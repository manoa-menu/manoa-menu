import { getTodayInHST, DateParts } from '@/lib/ccMenuParsing';

export interface SdxTimeOfDay {
  hour: string;
  minute: string;
  period: string;
}

export interface SdxHourEntry {
  label: string;
  timeRange: string | null;
  closed: boolean;
}

export interface SdxSpecialHoursBlock {
  daysLabel: string;
  hours: SdxHourEntry[];
}

export interface SdxSpecialHours {
  dateRangeLabel: string;
  from: string;
  to: string;
  blocks: SdxSpecialHoursBlock[];
}

interface RawDay {
  key?: string;
  value?: string;
}

interface RawHour {
  allDay?: boolean | { value?: string };
  startTime?: SdxTimeOfDay;
  finishTime?: SdxTimeOfDay;
  label?: string;
}

interface RawOpeningBlock {
  days?: RawDay[];
  hours?: RawHour[];
}

interface RawSeasonalHours {
  from?: string;
  to?: string;
  openingHours?: RawOpeningBlock[];
}

function extractPreloadedState(html: string): unknown | null {
  const marker = 'window.__PRELOADED_STATE__ = ';
  const start = html.indexOf(marker);
  if (start < 0) {
    return null;
  }

  let i = start + marker.length;
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        i += 1;
        break;
      }
    }
  }

  try {
    return JSON.parse(html.slice(start + marker.length, i));
  } catch {
    return null;
  }
}

function findSeasonalHours(value: unknown, results: RawSeasonalHours[] = []): RawSeasonalHours[] {
  if (!value || typeof value !== 'object') {
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => findSeasonalHours(item, results));
    return results;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.seasonalHours)) {
    results.push(...(record.seasonalHours as RawSeasonalHours[]));
  }

  Object.entries(record).forEach(([key, nested]) => {
    if (key !== 'seasonalHours') {
      findSeasonalHours(nested, results);
    }
  });

  return results;
}

function toDateParts(iso: string): DateParts | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function isTodayWithinSeason(today: DateParts, fromIso: string, toIso: string): boolean {
  const from = toDateParts(fromIso);
  const to = toDateParts(toIso);
  if (!from || !to) {
    return false;
  }
  return compareDateParts(today, from) >= 0 && compareDateParts(today, to) <= 0;
}

function formatDisplayDate(iso: string): string {
  const parts = toDateParts(iso);
  if (!parts) {
    return iso;
  }
  const mm = String(parts.month + 1).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${mm}/${dd}/${parts.year}`;
}

function formatTime(time?: SdxTimeOfDay): string | null {
  if (!time?.hour || !time?.minute || !time?.period) {
    return null;
  }
  return `${time.hour}:${time.minute} ${time.period}`;
}

function formatDaysLabel(days: RawDay[] = []): string {
  const names = days
    .map((day) => day.value?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return 'All days';
  }
  if (names.length === 1) {
    return names[0];
  }
  return `${names[0]} - ${names[names.length - 1]}`;
}

function formatHourEntry(hour: RawHour): SdxHourEntry {
  const label = (hour.label || '').replace(/\s*:\s*$/, '').trim() || 'Hours';
  const start = formatTime(hour.startTime);
  const finish = formatTime(hour.finishTime);

  if (typeof hour.allDay === 'object' && hour.allDay?.value) {
    const closedValue = hour.allDay.value;
    return {
      label: closedValue,
      timeRange: null,
      closed: /closed/i.test(closedValue),
    };
  }

  if (start && finish) {
    return {
      label,
      timeRange: `${start} - ${finish}`,
      closed: false,
    };
  }

  // Labels like "Summer Break" with no times mean closed for that period.
  return {
    label,
    timeRange: null,
    closed: true,
  };
}

function normalizeSeasonalHours(entry: RawSeasonalHours): SdxSpecialHours | null {
  if (!entry.from || !entry.to || !Array.isArray(entry.openingHours)) {
    return null;
  }

  const blocks = entry.openingHours
    .map((block) => ({
      daysLabel: formatDaysLabel(block.days),
      hours: (block.hours || []).map(formatHourEntry),
    }))
    .filter((block) => block.hours.length > 0);

  if (blocks.length === 0) {
    return null;
  }

  return {
    from: entry.from,
    to: entry.to,
    dateRangeLabel: `${formatDisplayDate(entry.from)} - ${formatDisplayDate(entry.to)}`,
    blocks,
  };
}

/**
 * Parse the currently active Special Hours block from a Sodexo location page.
 * Prefers `__PRELOADED_STATE__.openingHours.seasonalHours` for the date range
 * that contains today (HST).
 */
export function parseSdxSpecialHours(html: string, now = new Date()): SdxSpecialHours | null {
  const state = extractPreloadedState(html);
  if (!state) {
    return null;
  }

  const today = getTodayInHST(now);
  const seasonal = findSeasonalHours(state);

  const active = seasonal
    .filter((entry) => entry.from && entry.to && isTodayWithinSeason(today, entry.from, entry.to))
    // Prefer longer overlapping windows when multiple match.
    .sort((a, b) => {
      const aFrom = toDateParts(a.from || '')!;
      const aTo = toDateParts(a.to || '')!;
      const bFrom = toDateParts(b.from || '')!;
      const bTo = toDateParts(b.to || '')!;
      const aLen = Date.UTC(aTo.year, aTo.month, aTo.day) - Date.UTC(aFrom.year, aFrom.month, aFrom.day);
      const bLen = Date.UTC(bTo.year, bTo.month, bTo.day) - Date.UTC(bFrom.year, bFrom.month, bFrom.day);
      return aLen - bLen;
    });

  if (active.length === 0) {
    return null;
  }

  return normalizeSeasonalHours(active[active.length - 1]);
}

export function isSdxMenuBlank(weekMenu: { meals?: unknown[] }[] | null | undefined): boolean {
  if (!weekMenu || weekMenu.length === 0) {
    return true;
  }
  return weekMenu.every((day) => !day.meals || day.meals.length === 0);
}
