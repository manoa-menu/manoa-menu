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
import { parseOpenChipStatus } from '@/lib/openChipStatus';
import { parseSdxSpecialHours, SdxSpecialHours } from '@/lib/sdxSpecialHours';

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

  console.log('[scrapeCCHours] Parsing OpenChip status from HTML...');
  const result = parseOpenChipStatus(html);
  if (!result) {
    console.warn('[scrapeCCHours] Could not determine open/closed status from page');
    return null;
  }

  console.log(`[scrapeCCHours] Extracted status: "${result}"`);
  return result;
}

export async function scrapeSdxLocationHours(url: string): Promise<{
  hours: string | null;
  specialHours: SdxSpecialHours | null;
}> {
  console.log(`[scrapeSdxLocationHours] Starting for: ${url}`);

  if (typeof window !== 'undefined') {
    throw new Error('scrapeSdxLocationHours can only be run in a Node.js environment');
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
  const hours = parseOpenChipStatus(html);
  const specialHours = parseSdxSpecialHours(html);

  console.log(
    `[scrapeSdxLocationHours] status="${hours}" specialHours=${specialHours ? specialHours.dateRangeLabel : 'none'}`,
  );

  return { hours, specialHours };
}
