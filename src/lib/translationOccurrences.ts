import type { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { translationSourceKey } from '@/lib/translationSource';

export const TRANSLATION_LOCATIONS = ['GW', 'HA', 'CC'] as const;
export type TranslationLocation = (typeof TRANSLATION_LOCATIONS)[number];

export const TRANSLATION_LOCATION_LABELS: Record<TranslationLocation, string> = {
  GW: 'Gateway',
  HA: 'Hale Aloha',
  CC: 'Campus Center',
};

export type TranslationOccurrence = {
  location: TranslationLocation;
  dates: string[];
};

export type TranslationOccurrenceIndex = Map<string, Map<TranslationLocation, Set<string>>>;

const WEEKDAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thurs: 4,
  thur: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const WEEKDAY_PATTERN = new RegExp(
  `\\b(${Object.keys(WEEKDAY_NAME_TO_INDEX).sort((left, right) => right.length - left.length).join('|')})\\b`,
  'i',
);

export function createOccurrenceIndex(): TranslationOccurrenceIndex {
  return new Map();
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isoFromParts(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function isoDateFromNumericDayName(weekOf: string, name: string): string | null {
  const match = name.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (match[3]) {
    const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
    return isoFromParts(year, month, day);
  }

  const weekYear = Number(weekOf.slice(0, 4));
  const weekTime = Date.parse(`${weekOf}T12:00:00.000Z`);
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  [weekYear - 1, weekYear, weekYear + 1].forEach((year) => {
    const iso = isoFromParts(year, month, day);
    if (!iso) {
      return;
    }
    const distance = Math.abs(Date.parse(`${iso}T12:00:00.000Z`) - weekTime);
    if (distance < bestDistance) {
      best = iso;
      bestDistance = distance;
    }
  });
  return best;
}

export function isoDateFromWeekAndDayName(weekOf: string, name: string): string | null {
  if (!isIsoDate(weekOf)) {
    return null;
  }
  const fromDate = isoDateFromNumericDayName(weekOf, name);
  if (fromDate) {
    return fromDate;
  }
  const match = name.match(WEEKDAY_PATTERN);
  if (!match) {
    return null;
  }
  const weekday = WEEKDAY_NAME_TO_INDEX[match[1].toLowerCase()];
  if (weekday == null) {
    return null;
  }
  return shiftIsoDate(weekOf, weekday);
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return iso;
  }
  return `${month}/${day}`;
}

export function formatOccurrenceDates(dates: string[]): string {
  const unique = [...new Set(dates.filter(isIsoDate))].sort();
  if (unique.length === 0) {
    return '';
  }

  const ranges: string[] = [];
  let start = unique[0];
  let prev = unique[0];

  const pushRange = () => {
    if (start === prev) {
      ranges.push(formatIsoDate(start));
      return;
    }
    ranges.push(`${formatIsoDate(start)}–${formatIsoDate(prev)}`);
  };

  for (let index = 1; index < unique.length; index += 1) {
    const current = unique[index];
    if (shiftIsoDate(prev, 1) === current) {
      prev = current;
      continue;
    }
    pushRange();
    start = current;
    prev = current;
  }
  pushRange();
  return ranges.join(', ');
}

function addOccurrence(
  index: TranslationOccurrenceIndex,
  sourceText: string | null | undefined,
  location: TranslationLocation,
  isoDate: string | null,
): void {
  const key = translationSourceKey(sourceText ?? '');
  if (!key || !isoDate || !isIsoDate(isoDate)) {
    return;
  }
  const byLocation = index.get(key) ?? new Map<TranslationLocation, Set<string>>();
  const dates = byLocation.get(location) ?? new Set<string>();
  dates.add(isoDate);
  byLocation.set(location, dates);
  index.set(key, byLocation);
}

export function collectSdxOccurrences(
  menu: unknown,
  location: TranslationLocation,
  isoDate: string,
  index: TranslationOccurrenceIndex,
): void {
  if (!Array.isArray(menu)) {
    return;
  }
  (menu as FilteredSodexoMeal[]).forEach((meal) => {
    addOccurrence(index, meal?.name, location, isoDate);
    meal?.groups?.forEach((group) => {
      addOccurrence(index, group?.name, location, isoDate);
      group?.items?.forEach((item) => {
        addOccurrence(index, item?.formalName, location, isoDate);
        addOccurrence(index, item?.description, location, isoDate);
      });
    });
  });
}

export function collectCcOccurrences(
  menu: unknown,
  weekOf: string,
  index: TranslationOccurrenceIndex,
): void {
  if (!Array.isArray(menu)) {
    return;
  }
  (menu as DayMenu[]).forEach((dayMenu, dayIndex) => {
    const isoDate = isoDateFromWeekAndDayName(weekOf, dayMenu?.name ?? '')
      ?? (isIsoDate(weekOf) ? shiftIsoDate(weekOf, dayIndex + 1) : null);
    dayMenu?.plateLunch?.forEach((item) => addOccurrence(index, item, 'CC', isoDate));
    dayMenu?.grabAndGo?.forEach((item) => addOccurrence(index, item, 'CC', isoDate));
    addOccurrence(index, dayMenu?.specialMessage, 'CC', isoDate);
  });
}

export function getTranslationOccurrences(
  index: TranslationOccurrenceIndex,
  sourceText: string,
): TranslationOccurrence[] {
  const byLocation = index.get(translationSourceKey(sourceText));
  if (!byLocation) {
    return [];
  }
  return TRANSLATION_LOCATIONS
    .filter((location) => byLocation.has(location))
    .map((location) => ({
      location,
      dates: [...(byLocation.get(location) ?? [])].sort(),
    }));
}

export function formatTranslationOccurrences(occurrences: TranslationOccurrence[]): string {
  return occurrences
    .map((occurrence) => {
      const location = TRANSLATION_LOCATION_LABELS[occurrence.location];
      const dates = formatOccurrenceDates(occurrence.dates);
      return dates ? `${location} ${dates}` : location;
    })
    .join(' · ');
}
