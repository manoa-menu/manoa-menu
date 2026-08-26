export const PDF_MEDIA_BASE = 'https://media-prd.sodexomyway.net';
export const HST_TIMEZONE = 'Pacific/Honolulu';

const MAX_MENU_RANGE_DAYS = 14;
const FILENAME_MENU_DAY_SPAN = 4;
const EMBEDDED_NAME_LOOKBACK_CHARS = 800;

const MONTH_MAP: Record<string, number> = {};
[
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].forEach((month, index) => {
  MONTH_MAP[month.toLowerCase()] = index;
  MONTH_MAP[month.slice(0, 3).toLowerCase()] = index;
});

const WEEKDAY = '(?:Sun(?:day)?|Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?'
  + '|Thu(?:rs(?:day)?)?|Fri(?:day)?|Sat(?:urday)?)';
const RANGE_SEP = '(?:to|–|—|-)';

// Primary: "06 July to 10 July", "Mon 6 Jul - Fri 10 Jul", "6th July to 10th July"
const DAY_MONTH_RANGE_REGEX = new RegExp(
  `(?:${WEEKDAY}\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+([A-Za-z]+\\.?)\\s+${RANGE_SEP}\\s+`
  + `(?:${WEEKDAY}\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+([A-Za-z]+\\.?)`,
  'i',
);

// Secondary: "July 6 to July 10", "Jul 6 - Jul 10"
const MONTH_DAY_RANGE_REGEX = new RegExp(
  `(?:${WEEKDAY}\\s+)?([A-Za-z]+\\.?)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+${RANGE_SEP}\\s+`
  + `(?:${WEEKDAY}\\s+)?([A-Za-z]+\\.?)\\s+(\\d{1,2})(?:st|nd|rd|th)?`,
  'i',
);

// Secondary: "7/6 to 7/10", "07/06/2026 to 07/10/2026"
const NUMERIC_RANGE_REGEX = new RegExp(
  `(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\s+${RANGE_SEP}\\s+`
  + `(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?`,
);

// Secondary: "2026-07-06 to 2026-07-10"
const ISO_RANGE_REGEX = /(\d{4})-(\d{1,2})-(\d{1,2})\s+(?:to|–|—|-)\s+(\d{4})-(\d{1,2})-(\d{1,2})/;

const EMBEDDED_PDF_URI_REGEX = /"uri":"(\/web\/en-us\/media\/[^"]+\.pdf)"/g;
const EMBEDDED_NAME_REGEX = /"name":"([^"]+)"/g;
const PDF_FILENAME_YYMMDD_REGEX = /(?<!\d)(\d{2})-(\d{2})(\d{2})(?!\d)/g;

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

function parseMonth(monthText: string): number | undefined {
  const normalized = monthText.toLowerCase().replace(/\./g, '');
  return MONTH_MAP[normalized];
}

function parseOptionalYear(yearText: string | undefined, today: DateParts): number {
  if (!yearText) {
    return today.year;
  }

  const year = parseInt(yearText, 10);
  if (yearText.length === 2) {
    return 2000 + year;
  }

  return year;
}

function buildDateRangeWithYears(
  startDay: number,
  startMonth: number,
  startYear: number,
  endDay: number,
  endMonth: number,
  endYear: number,
): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(startYear, startMonth, startDay),
    endDate: new Date(endYear, endMonth, endDay),
  };
}

function buildDateRange(
  startDay: number,
  startMonth: number,
  endDay: number,
  endMonth: number,
  today: DateParts,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(today.year, startMonth, startDay);
  const endDate = new Date(today.year, endMonth, endDay);

  if (endDate < startDate) {
    if (today.month <= endMonth) {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
  }

  return { startDate, endDate };
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
  PDF_FILENAME_YYMMDD_REGEX.lastIndex = 0;
  for (const match of basename.matchAll(PDF_FILENAME_YYMMDD_REGEX)) {
    const year = parseOptionalYear(match[1], today);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (month < 0 || month > 11 || day < 1 || day > 31) {
      continue;
    }

    const startDate = new Date(year, month, day);
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
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('/')) {
    return `${PDF_MEDIA_BASE}${href}`;
  }
  return href;
}

function parseDayMonthRange(label: string, today: DateParts): { startDate: Date; endDate: Date } | null {
  const match = label.match(DAY_MONTH_RANGE_REGEX);
  if (!match) {
    return null;
  }

  const startDay = parseInt(match[1], 10);
  const startMonth = parseMonth(match[2]);
  const endDay = parseInt(match[3], 10);
  const endMonth = parseMonth(match[4]);

  if (startMonth === undefined || endMonth === undefined) {
    return null;
  }

  return buildDateRange(startDay, startMonth, endDay, endMonth, today);
}

function parseMonthDayRange(label: string, today: DateParts): { startDate: Date; endDate: Date } | null {
  const match = label.match(MONTH_DAY_RANGE_REGEX);
  if (!match) {
    return null;
  }

  const startMonth = parseMonth(match[1]);
  const startDay = parseInt(match[2], 10);
  const endMonth = parseMonth(match[3]);
  const endDay = parseInt(match[4], 10);

  if (startMonth === undefined || endMonth === undefined) {
    return null;
  }

  return buildDateRange(startDay, startMonth, endDay, endMonth, today);
}

function parseNumericRange(label: string, today: DateParts): { startDate: Date; endDate: Date } | null {
  const match = label.match(NUMERIC_RANGE_REGEX);
  if (!match) {
    return null;
  }

  const startMonth = parseInt(match[1], 10) - 1;
  const startDay = parseInt(match[2], 10);
  const startYear = parseOptionalYear(match[3], today);
  const endMonth = parseInt(match[4], 10) - 1;
  const endDay = parseInt(match[5], 10);
  const endYear = parseOptionalYear(match[6], today);

  if (
    startMonth < 0 || startMonth > 11
    || endMonth < 0 || endMonth > 11
    || startDay < 1 || startDay > 31
    || endDay < 1 || endDay > 31
  ) {
    return null;
  }

  if (!match[3] && !match[6]) {
    return buildDateRange(startDay, startMonth, endDay, endMonth, today);
  }

  return buildDateRangeWithYears(startDay, startMonth, startYear, endDay, endMonth, endYear);
}

function parseIsoRange(label: string): { startDate: Date; endDate: Date } | null {
  const match = label.match(ISO_RANGE_REGEX);
  if (!match) {
    return null;
  }

  const startYear = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10) - 1;
  const startDay = parseInt(match[3], 10);
  const endYear = parseInt(match[4], 10);
  const endMonth = parseInt(match[5], 10) - 1;
  const endDay = parseInt(match[6], 10);

  return buildDateRangeWithYears(startDay, startMonth, startYear, endDay, endMonth, endYear);
}

export function parseMenuDateRange(label: string, today: DateParts): ParsedMenuDateRange | null {
  const parsers: Array<{
    format: string;
    parse: (text: string, referenceToday: DateParts) => { startDate: Date; endDate: Date } | null;
  }> = [
    { format: 'day-month', parse: parseDayMonthRange },
    { format: 'month-day', parse: parseMonthDayRange },
    { format: 'numeric', parse: parseNumericRange },
    {
      format: 'iso',
      parse: (text) => parseIsoRange(text),
    },
  ];

  for (const parser of parsers) {
    const result = parser.parse(label, today);
    if (!result) {
      continue;
    }

    if (!isPlausibleMenuRange(result.startDate, result.endDate)) {
      continue;
    }

    return { ...result, format: parser.format };
  }

  return null;
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
    const label = (node.textContent || '').trim();
    addCandidate(candidates, seenHrefs, label, href, today);
  };

  doc.querySelectorAll('div[class*="MenuLinkContainer"] a[href]').forEach(addAnchor);
  doc.querySelectorAll('a[href*=".pdf"]').forEach(addAnchor);

  return candidates;
}

export function collectCandidatesFromEmbeddedJson(html: string, today: DateParts): MenuCandidate[] {
  const candidates: MenuCandidate[] = [];
  const seenHrefs = new Set<string>();

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
