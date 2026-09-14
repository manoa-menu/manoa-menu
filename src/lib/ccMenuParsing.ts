import { parseFlexibleMenuRange, validCalendarDate } from './menuDateRange';

export const PDF_MEDIA_BASE = 'https://media-prd.sodexomyway.net';
export const HST_TIMEZONE = 'Pacific/Honolulu';

const MAX_MENU_RANGE_DAYS = 14;
const FILENAME_MENU_DAY_SPAN = 4;
const EMBEDDED_NAME_LOOKBACK_CHARS = 800;

const EMBEDDED_PDF_URI_REGEX = /"(?:uri|url|href)"\s*:\s*"([^"]+\.pdf(?:[?#][^"]*)?)"/gi;
const EMBEDDED_NAME_REGEX = /"(?:name|title|label)"\s*:\s*"([^"]+)"/g;
const PDF_FILENAME_YYMMDD_REGEX = /(?<!\d)(\d{4}|\d{2})[-_](\d{2})[-_]?(\d{2})(?!\d)/g;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface MenuCandidate {
  href: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface ParsedMenuDateRange {
  startDate: Date;
  endDate: Date;
  format: string;
}

export function getTodayInHST(now = new Date()): DateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: HST_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value) - 1,
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

export function formatDateParts(parts: DateParts): string {
  const month = String(parts.month + 1).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

function calendarUtc(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day);
}

export function isTodayWithinRange(today: DateParts, startDate: Date, endDate: Date): boolean {
  const todayValue = calendarUtc(today.year, today.month, today.day);
  const startValue = calendarUtc(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endValue = calendarUtc(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return todayValue >= startValue && todayValue <= endValue;
}

/** Sunday–Saturday week in HST calendar dates that contains `today`. */
function currentWeekBoundsUtc(today: DateParts): { weekStart: number; weekEnd: number } {
  const todayValue = calendarUtc(today.year, today.month, today.day);
  const dayOfWeek = new Date(todayValue).getUTCDay();
  return {
    weekStart: calendarUtc(today.year, today.month, today.day - dayOfWeek),
    weekEnd: calendarUtc(today.year, today.month, today.day - dayOfWeek + 6),
  };
}

export function rangeOverlapsCurrentWeek(
  today: DateParts,
  startDate: Date,
  endDate: Date,
): boolean {
  const { weekStart, weekEnd } = currentWeekBoundsUtc(today);
  const startValue = calendarUtc(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endValue = calendarUtc(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return startValue <= weekEnd && endValue >= weekStart;
}

function isPlausibleMenuRange(startDate: Date, endDate: Date): boolean {
  const startValue = calendarUtc(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endValue = calendarUtc(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (endValue < startValue) {
    return false;
  }
  const days = (endValue - startValue) / 86_400_000;
  return days <= MAX_MENU_RANGE_DAYS;
}

function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

function pdfBasename(href: string): string {
  const decoded = decodeHref(href);
  const withoutQuery = decoded.split('?')[0] ?? decoded;
  const segments = withoutQuery.split('/');
  return segments[segments.length - 1] ?? withoutQuery;
}

export function parsePdfFilenameRange(
  href: string,
  today: DateParts,
): ParsedMenuDateRange | null {
  const basename = pdfBasename(href);
  const explicitRange = parseMenuDateRange(basename.replace(/_/g, ' '), today);
  if (explicitRange) return { ...explicitRange, format: 'filename' };
  PDF_FILENAME_YYMMDD_REGEX.lastIndex = 0;
  for (const match of basename.matchAll(PDF_FILENAME_YYMMDD_REGEX)) {
    const year = Number(match[1]) + (match[1].length === 2 ? 2000 : 0);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (month < 0 || month > 11 || day < 1 || day > 31) {
      continue;
    }

    const startDate = validCalendarDate(year, month, day);
    if (!startDate) continue;
    const endDate = new Date(year, month, day);
    endDate.setDate(endDate.getDate() + FILENAME_MENU_DAY_SPAN);
    if (!isPlausibleMenuRange(startDate, endDate)) {
      continue;
    }

    return { startDate, endDate, format: 'filename' };
  }

  return null;
}

export function normalizePdfHref(href: string): string {
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('/')) {
    return `${PDF_MEDIA_BASE}${href}`;
  }
  return href;
}

export function parseMenuDateRange(label: string, today: DateParts): ParsedMenuDateRange | null {
  return parseFlexibleMenuRange(label, today);
}

export function createMenuCandidate(
  label: string,
  href: string,
  today: DateParts,
): MenuCandidate | null {
  const dateRange = parseMenuDateRange(label, today) ?? parsePdfFilenameRange(href, today);
  if (!dateRange) {
    return null;
  }

  return {
    href: normalizePdfHref(href),
    label,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  };
}

function addCandidate(
  candidates: MenuCandidate[],
  seenHrefs: Set<string>,
  label: string,
  href: string,
  today: DateParts,
): void {
  const candidate = createMenuCandidate(label, href, today);
  if (!candidate || seenHrefs.has(candidate.href)) {
    return;
  }

  seenHrefs.add(candidate.href);
  candidates.push(candidate);
}

export function collectCandidatesFromDom(doc: Document, today: DateParts): MenuCandidate[] {
  const candidates: MenuCandidate[] = [];
  const seenHrefs = new Set<string>();

  const addAnchor = (node: Element): void => {
    if (node.tagName !== 'A') {
      return;
    }
    const href = node.getAttribute('href');
    if (!href) {
      return;
    }
    const label = [node.textContent, node.getAttribute('aria-label'), node.getAttribute('title')]
      .filter(Boolean).join(' ').trim();
    addCandidate(candidates, seenHrefs, label, href, today);
  };

  doc.querySelectorAll('div[class*="MenuLinkContainer"] a[href]').forEach(addAnchor);
  doc.querySelectorAll('a[href]').forEach(node => {
    if (/\.pdf(?:[?#]|$)/i.test(node.getAttribute('href') ?? '')) addAnchor(node);
  });

  return candidates;
}

export function collectCandidatesFromEmbeddedJson(html: string, today: DateParts): MenuCandidate[] {
  const candidates: MenuCandidate[] = [];
  const seenHrefs = new Set<string>();

  html = html.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/&quot;/g, '"');
  // Prefer metadata from the same object, regardless of name/URI field ordering.
  for (const match of html.matchAll(/\{[^{}]*\}/g)) {
    try {
      const data = JSON.parse(match[0]);
      const href = data.uri ?? data.url ?? data.href;
      const label = data.name ?? data.title ?? data.label;
      if (typeof href === 'string' && typeof label === 'string' && /\.pdf(?:[?#]|$)/i.test(href)) {
        addCandidate(candidates, seenHrefs, label, href, today);
      }
    } catch {
      // Script wrappers may not be standalone JSON; retain the text fallback below.
    }
  }
  EMBEDDED_PDF_URI_REGEX.lastIndex = 0;
  for (const match of html.matchAll(EMBEDDED_PDF_URI_REGEX)) {
    const href = match[1];
    const pdfIndex = match.index ?? 0;
    const lookbackStart = Math.max(0, pdfIndex - EMBEDDED_NAME_LOOKBACK_CHARS);
    const preceding = html.slice(lookbackStart, pdfIndex);
    EMBEDDED_NAME_REGEX.lastIndex = 0;
    const names = [...preceding.matchAll(EMBEDDED_NAME_REGEX)];
    const nearestName = names.length > 0 ? names[names.length - 1][1] : '';
    addCandidate(candidates, seenHrefs, nearestName, href, today);
  }

  return candidates;
}

export function mergeMenuCandidates(...groups: MenuCandidate[][]): MenuCandidate[] {
  const seenHrefs = new Set<string>();
  const merged: MenuCandidate[] = [];

  groups.flat().forEach((candidate) => {
    if (seenHrefs.has(candidate.href)) {
      return;
    }
    seenHrefs.add(candidate.href);
    merged.push(candidate);
  });

  return merged;
}

export function findCurrentWeekMenu(candidates: MenuCandidate[], today: DateParts): MenuCandidate | null {
  const containingToday = candidates.filter((candidate) =>
    isTodayWithinRange(today, candidate.startDate, candidate.endDate));
  const currentWeekMenus = containingToday.length > 0
    ? containingToday
    : candidates.filter((candidate) =>
      rangeOverlapsCurrentWeek(today, candidate.startDate, candidate.endDate));

  if (currentWeekMenus.length === 0) {
    return null;
  }

  if (currentWeekMenus.length > 1) {
    currentWeekMenus.sort(
      (left, right) => left.startDate.getTime() - right.startDate.getTime(),
    );
  }

  return currentWeekMenus[0];
}
