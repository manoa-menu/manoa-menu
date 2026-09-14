/* eslint-disable max-len -- Date patterns are easier to audit without splitting regex tokens. */
import type { DateParts, ParsedMenuDateRange } from './ccMenuParsing';

const months = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');
const month = '(January|February|March|April|May|June|July|August|September|October|November|December|Sept|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\.?';
const day = '(\\d{1,2})(?:st|nd|rd|th)?';
const year = '(?:[ ,]+(\\d{4}|\\d{2})(?!\\d))?';
const separator = '\\s*(?:through|thru|to|[-–—−])\\s*';
const yearNumber = (value?: string) => value ? Number(value) + (value.length === 2 ? 2000 : 0) : undefined;
const monthNumber = (value: string) => months.indexOf(value.toLowerCase().slice(0, 3));

/** Reject calendar overflow; never let February 30 silently become a March menu. */
export function validCalendarDate(y: number, m: number, d: number): Date | null {
  const date = new Date(y, m, d);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
}

export function parseFlexibleMenuRange(text: string, today: DateParts): ParsedMenuDateRange | null {
  const label = text.normalize('NFKC')
    .replace(/\b(?:Sun(?:day)?|Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?|Thu(?:rs(?:day)?)?|Fri(?:day)?|Sat(?:urday)?)[,.]?\s*/gi, '')
    .replace(/\s+/g, ' ').trim();
  type Range = [number, number, number | undefined, number, number, number | undefined];
  const patterns: Array<{ format: string; regex: RegExp; parts: (m: RegExpMatchArray) => Range }> = [
    {
      format: 'iso',
      regex: new RegExp(`(?<![\\d-])(\\d{4})-(\\d{1,2})-(\\d{1,2})${separator}(\\d{4})-(\\d{1,2})-(\\d{1,2})(?!\\d)`, 'i'),
      parts: m => [Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[6]), Number(m[5]) - 1, Number(m[4])],
    },
    {
      format: 'day-month',
      regex: new RegExp(`\\b${day}\\s+${month}${year}${separator}${day}\\s+${month}${year}(?!\\w)`, 'i'),
      parts: m => [Number(m[1]), monthNumber(m[2]), yearNumber(m[3]), Number(m[4]), monthNumber(m[5]), yearNumber(m[6])],
    },
    {
      format: 'month-day',
      regex: new RegExp(`\\b${month}\\s+${day}${year}${separator}${month}\\s+${day}${year}(?!\\w)`, 'i'),
      parts: m => [Number(m[2]), monthNumber(m[1]), yearNumber(m[3]), Number(m[5]), monthNumber(m[4]), yearNumber(m[6])],
    },
    {
      format: 'numeric',
      regex: new RegExp(`(?<![\\d/-])(\\d{1,2})/(\\d{1,2})(?:/(\\d{4}|\\d{2}))?${separator}(\\d{1,2})/(\\d{1,2})(?:/(\\d{4}|\\d{2}))?(?![\\d/])`, 'i'),
      parts: m => [Number(m[2]), Number(m[1]) - 1, yearNumber(m[3]), Number(m[5]), Number(m[4]) - 1, yearNumber(m[6])],
    },
    {
      format: 'month-shared',
      regex: new RegExp(`\\b${month}\\s+${day}${separator}${day}${year}(?![\\w/])`, 'i'),
      parts: m => [Number(m[2]), monthNumber(m[1]), undefined, Number(m[3]), monthNumber(m[1]), yearNumber(m[4])],
    },
    {
      format: 'day-shared',
      regex: new RegExp(`(?<![\\d/-])${day}${separator}${day}\\s+${month}${year}(?!\\w)`, 'i'),
      parts: m => [Number(m[1]), monthNumber(m[3]), undefined, Number(m[2]), monthNumber(m[3]), yearNumber(m[4])],
    },
  ];
  for (const pattern of patterns) {
    const match = label.match(pattern.regex);
    if (!match) continue;
    const [sd, sm, sy, ed, em, ey] = pattern.parts(match);
    const crossesYear = em < sm;
    const startYear = sy ?? (ey !== undefined ? ey - Number(crossesYear)
      : today.year - Number(crossesYear && today.month <= em));
    const endYear = ey ?? startYear + Number(crossesYear);
    const startDate = validCalendarDate(startYear, sm, sd);
    const endDate = validCalendarDate(endYear, em, ed);
    if (!startDate || !endDate) return null;
    const span = (Date.UTC(endYear, em, ed) - Date.UTC(startYear, sm, sd)) / 86_400_000;
    if (span < 0 || span > 14) return null;
    return { startDate, endDate, format: pattern.format };
  }
  return null;
}
