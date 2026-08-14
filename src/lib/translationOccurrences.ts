import type { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { translationSourceKey } from '@/lib/translationSource';

export const TRANSLATION_LOCATIONS = ['GW', 'HA', 'CC'] as const;
export type TranslationLocation = (typeof TRANSLATION_LOCATIONS)[number];

export type TranslationOccurrence = {
  location: TranslationLocation;
  dates: string[];
};

export type TranslationOccurrenceIndex = Map<string, Map<TranslationLocation, Set<string>>>;

const WEEKDAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

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

export function isoDateFromWeekAndDayName(weekOf: string, name: string): string | null {
  if (!isIsoDate(weekOf)) {
    return null;
  }
  const match = name.match(/sunday|monday|tuesday|wednesday|thursday|friday|saturday/i);
  if (!match) {
    return null;
  }
  const weekday = WEEKDAY_NAME_TO_INDEX[match[0].toLowerCase()];
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
  (menu as DayMenu[]).forEach((dayMenu) => {
    const isoDate = isoDateFromWeekAndDayName(weekOf, dayMenu?.name ?? '');
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
      const dates = formatOccurrenceDates(occurrence.dates);
      return dates ? `${occurrence.location} ${dates}` : occurrence.location;
    })
    .join(' · ');
}
