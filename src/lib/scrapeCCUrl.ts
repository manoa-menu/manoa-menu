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

  interface Candidate { anchor: HTMLAnchorElement; startDate: Date; endDate: Date; }
  const candidates: Candidate[] = [];

  // Iterate over all matching divs and collect parsed date ranges
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

    candidates.push({ anchor, startDate, endDate });
  }

  // Fallback: pick the next upcoming range (closest startDate after today),
  // or if everything is in the past, the most recently ended range.
  console.warn('No anchor matched the current week; selecting nearest date range as fallback');

  const upcoming = candidates
    .filter(c => c.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (upcoming.length > 0) {
    console.log(`Fallback: next upcoming range starts ${upcoming[0].startDate.toDateString()}. Returning href: ${upcoming[0].anchor.href}`);
    return upcoming[0].anchor.href;
  }

  const past = candidates
    .filter(c => c.endDate < now)
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  if (past.length > 0) {
    console.log(`Fallback: most recent past range ended ${past[0].endDate.toDateString()}. Returning href: ${past[0].anchor.href}`);
    return past[0].anchor.href;
  }

  console.error('No anchor elements found in any menu link container');
  throw new Error('Anchor element not found');
}

export async function scrapeCCHours(url: string): Promise<string | null> {
  console.log(`[scrapeCCHours] Starting for: ${url}`);

  if (typeof window !== 'undefined') {
    throw new Error('scrapeCCHours can only be run in a Node.js environment');
  }

  console.log('[scrapeCCHours] Fetching page HTML...');
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  console.log(`[scrapeCCHours] Response status: ${response.status} ${response.statusText}`);
  if (!response.ok) {
    console.error(`[scrapeCCHours] Fetch failed with status ${response.status}`);
    throw new Error(`Failed to fetch the URL: ${response.statusText}`);
  }

  const html = await response.text();
  console.log(`[scrapeCCHours] HTML received, length: ${html.length} characters`);

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});

  console.log('[scrapeCCHours] Parsing HTML with JSDOM...');
  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;

  console.log('[scrapeCCHours] Looking for div.current-open-hours-block...');
  const hoursBlock = doc.querySelector('div.current-open-hours-block');
  if (!hoursBlock) {
    console.warn('[scrapeCCHours] div.current-open-hours-block not found in page');
    // Log nearby div class names to help diagnose selector changes
    const allDivs = doc.querySelectorAll('div[class]');
    const candidates: string[] = [];
    allDivs.forEach((d) => {
      if (d.className && d.className.toLowerCase().includes('hour')) {
        candidates.push(d.className);
      }
    });
    if (candidates.length > 0) {
      console.warn('[scrapeCCHours] Divs with "hour" in class name:', candidates);
    } else {
      console.warn('[scrapeCCHours] No divs with "hour" in class name found either');
    }
    return null;
  }

  console.log(`[scrapeCCHours] Found hours block. innerHTML preview: "${hoursBlock.innerHTML.slice(0, 200)}"`);

  console.log('[scrapeCCHours] Looking for div.text inside hours block...');
  const textDiv = hoursBlock.querySelector('div.text');
  if (!textDiv) {
    console.warn('[scrapeCCHours] div.text inside current-open-hours-block not found');
    console.warn(`[scrapeCCHours] Hours block child elements: ${Array.from(hoursBlock.children).map(c => `<${c.tagName.toLowerCase()} class="${c.className}">`).join(', ')}`);
    return null;
  }

  const result = (textDiv.textContent || '').trim();
  console.log(`[scrapeCCHours] Extracted hours text: "${result}"`);
  return result;
}
