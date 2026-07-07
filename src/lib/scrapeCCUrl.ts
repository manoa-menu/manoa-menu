/* eslint-disable max-len */
import { JSDOM, VirtualConsole } from 'jsdom';
import fetch from 'node-fetch';

import {
  collectCandidatesFromDom,
  collectCandidatesFromEmbeddedJson,
  findCurrentWeekMenu,
  formatDateParts,
  getTodayInHST,
  isTodayWithinRange,
  mergeMenuCandidates,
} from '@/lib/ccMenuParsing';

export default async function scrapeCCUrl(url: string): Promise<string | null> {
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

  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;
  const today = getTodayInHST();
  const todayLabel = formatDateParts(today);
  console.log(
    `[scrapeCCUrl] Current week (HST): ${todayLabel} (${new Date(today.year, today.month, today.day).toDateString()})`,
  );

  const candidates = mergeMenuCandidates(
    collectCandidatesFromDom(doc, today),
    collectCandidatesFromEmbeddedJson(html, today),
  );

  console.log(`Found ${candidates.length} menu candidate(s) on page`);
  candidates.forEach((candidate, index) => {
    const matchesCurrentWeek = isTodayWithinRange(today, candidate.startDate, candidate.endDate);
    console.log(
      `Candidate ${index}: "${candidate.label}" (${candidate.startDate.toDateString()} – ${candidate.endDate.toDateString()}) | current week match: ${matchesCurrentWeek ? 'YES' : 'no'}`,
    );
  });

  const currentMenu = findCurrentWeekMenu(candidates, today);
  if (!currentMenu) {
    console.warn(
      `[scrapeCCUrl] No menu matched the current week in HST (${todayLabel})`,
    );
    return null;
  }

  console.log(
    `[scrapeCCUrl] Matched current week ${todayLabel} to "${currentMenu.label}" (${currentMenu.startDate.toDateString()} – ${currentMenu.endDate.toDateString()})`,
  );
  console.log(`Current week menu found. Returning href: ${currentMenu.href}`);
  return currentMenu.href;
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

  console.log('[scrapeCCHours] Looking for OpenChip status wrapper...');
  const allDivs = doc.querySelectorAll('div[class]');
  let statusWrapper = null;

  for (let i = 0; i < allDivs.length; i++) {
    const div = allDivs[i];
    if (div.className && div.className.includes('OpenChipstyles__Wrapper')) {
      statusWrapper = div;
      break;
    }
  }

  if (!statusWrapper) {
    console.warn('[scrapeCCHours] OpenChip status wrapper not found in page');
    return null;
  }

  console.log(`[scrapeCCHours] Found status wrapper. innerHTML preview: "${statusWrapper.innerHTML.slice(0, 200)}"`);

  const containerDiv = statusWrapper.querySelector('div.container[aria-label]');
  if (!containerDiv) {
    console.warn('[scrapeCCHours] div.container with aria-label not found inside status wrapper');
    return null;
  }

  const status = containerDiv.getAttribute('aria-label');
  if (!status) {
    console.warn('[scrapeCCHours] aria-label attribute not found');
    return null;
  }

  const result = status.charAt(0).toUpperCase() + status.slice(1);
  console.log(`[scrapeCCHours] Extracted status: "${result}"`);
  return result;
}
