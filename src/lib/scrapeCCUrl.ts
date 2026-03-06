import { JSDOM, VirtualConsole } from 'jsdom';
import fetch from 'node-fetch';

export default async function scrapeCCUrl(url: string): Promise<string> {
  console.log(`Starting scrapeCCUrl for: ${url}`);
  if (typeof window !== 'undefined') {
    throw new Error('scrapeCCUrl can only be run in a Node.js environment');
  }

  console.log(`Fetching URL: ${url}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch the URL: ${response.statusText}`);
  }

  console.log(`Successfully fetched URL, content length: ${response.headers.get('content-length')}`);
  const html = await response.text();
  console.log(`HTML length: ${html.length} characters`);

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (error) => {
    if (error.message.includes('Could not parse CSS stylesheet')) {
      console.warn('Ignoring CSS parsing error:', error.message);
    } else {
      console.error(error);
    }
  });

  console.log('Parsing HTML with JSDOM...');
  const dom = new JSDOM(html, {
    resources: 'usable',
    runScripts: 'dangerously',
    virtualConsole,
  });

  const doc = dom.window.document;
  console.log('Looking for divs with class: MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
  const divs = doc.querySelectorAll('div.MenuAppstyles__MenuLinkContainer-sc-hftaq1-1');
  if (divs.length === 0) {
    console.error('Menu link container div not found');
    console.log('Available divs with similar classes:');
    const allDivs = doc.querySelectorAll('div');
    allDivs.forEach((d, index) => {
      if (d.className && d.className.includes('Menu')) {
        console.log(`Div ${index}: ${d.className}`);
      }
    });
    throw new Error('Menu link container div not found');
  }

  console.log(`Found ${divs.length} menu link container div(s)`);

  // Month abbreviation map for parsing anchor text dates
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const now = new Date();

  // Iterate over all matching divs and find the anchor whose date range covers this week
  for (let i = 0; i < divs.length; i++) {
    const anchor = divs[i].querySelector('a') as HTMLAnchorElement | null;
    if (!anchor) continue;

    const text = anchor.textContent || '';
    console.log(`Div ${i} anchor text: "${text}"`);

    // Expected format: "... Menu DD Mon to DD Mon"
    const dateMatch = text.match(/(\d{1,2})\s+([A-Za-z]{3})\s+to\s+(\d{1,2})\s+([A-Za-z]{3})/);
    if (!dateMatch) {
      console.log(`Div ${i}: could not parse date range from anchor text`);
      continue;
    }

    const startDay = parseInt(dateMatch[1], 10);
    const startMonth = monthMap[dateMatch[2]];
    const endDay = parseInt(dateMatch[3], 10);
    const endMonth = monthMap[dateMatch[4]];

    if (startMonth === undefined || endMonth === undefined) {
      console.log(`Div ${i}: unrecognised month abbreviation`);
      continue;
    }

    // Build full Date objects; infer the year from the current date
    const startDate = new Date(now.getFullYear(), startMonth, startDay);
    const endDate = new Date(now.getFullYear(), endMonth, endDay, 23, 59, 59);

    // Handle year boundary (e.g. range spans Dec-Jan)
    if (endDate < startDate) {
      if (now.getMonth() <= endMonth) {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
    }

    console.log(`Div ${i}: date range ${startDate.toDateString()} – ${endDate.toDateString()}`);

    if (now >= startDate && now <= endDate) {
      console.log(`Div ${i} matches the current week. Returning href: ${anchor.href}`);
      return anchor.href;
    }
  }

  // Fallback: if no date range matched, return the first anchor found
  console.warn('No anchor matched the current week; falling back to the first available anchor');
  for (let i = 0; i < divs.length; i++) {
    const anchor = divs[i].querySelector('a') as HTMLAnchorElement | null;
    if (anchor) {
      console.log(`Fallback: returning first anchor href: ${anchor.href}`);
      return anchor.href;
    }
  }

  console.error('No anchor elements found in any menu link container');
  throw new Error('Anchor element not found');
}

export async function scrapeCCHours(url: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    throw new Error('scrapeCCHours can only be run in a Node.js environment');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch the URL: ${response.statusText}`);
  }

  const html = await response.text();

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});

  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;

  const hoursBlock = doc.querySelector('div.current-open-hours-block');
  if (!hoursBlock) {
    console.warn('current-open-hours-block not found');
    return null;
  }

  const textDiv = hoursBlock.querySelector('div.text');
  if (!textDiv) {
    console.warn('div.text inside current-open-hours-block not found');
    return null;
  }

  return (textDiv.textContent || '').trim();
}
