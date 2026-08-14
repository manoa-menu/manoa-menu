import { DayMenu } from '@/types/menuTypes';
import { lookupTranslation, normalizeTranslationSource, translationSourceKey } from '@/lib/translationSource';

function addUnique(seen: Set<string>, ordered: string[], value: string | null | undefined) {
  const text = normalizeTranslationSource(value);
  if (!text) {
    return;
  }
  const key = translationSourceKey(text);
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  ordered.push(text);
}

export function collectCcTranslatableStrings(menus: DayMenu[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  menus.forEach((day) => {
    day.plateLunch.forEach((item) => addUnique(seen, ordered, item));
    day.grabAndGo.forEach((item) => addUnique(seen, ordered, item));
    addUnique(seen, ordered, day.specialMessage);
  });

  return ordered;
}

function isDayMenuArray(value: unknown): value is DayMenu[] {
  return Array.isArray(value);
}

export function extractCcTranslationPairs(
  englishMenu: unknown,
  translatedMenu: unknown,
): Array<[string, string]> {
  if (!isDayMenuArray(englishMenu) || !isDayMenuArray(translatedMenu)) {
    return [];
  }
  if (englishMenu.length !== translatedMenu.length) {
    return [];
  }

  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();
  const add = (source: string | undefined, translated: string | undefined) => {
    const normalizedSource = source?.replace(/\s+/g, ' ').trim();
    const normalizedTranslated = translated?.trim();
    if (!normalizedSource || !normalizedTranslated) {
      return;
    }
    const key = translationSourceKey(normalizedSource);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    pairs.push([normalizedSource, normalizedTranslated]);
  };

  for (let dayIndex = 0; dayIndex < englishMenu.length; dayIndex += 1) {
    const englishDay = englishMenu[dayIndex];
    const translatedDay = translatedMenu[dayIndex];
    if (!englishDay || !translatedDay) {
      return [];
    }
    if (englishDay.plateLunch.length !== translatedDay.plateLunch.length
      || englishDay.grabAndGo.length !== translatedDay.grabAndGo.length) {
      return [];
    }

    englishDay.plateLunch.forEach((item, itemIndex) => {
      add(item, translatedDay.plateLunch[itemIndex]);
    });
    englishDay.grabAndGo.forEach((item, itemIndex) => {
      add(item, translatedDay.grabAndGo[itemIndex]);
    });
    add(englishDay.specialMessage, translatedDay.specialMessage);
  }

  return pairs;
}

export function applyCcTranslations(
  menu: DayMenu[],
  translations: Map<string, string>,
): DayMenu[] {
  const translate = (value: string) => {
    const translated = lookupTranslation(translations, value);
    if (translated == null || !translated.trim()) {
      return value;
    }
    return translated;
  };

  return menu.map((day) => ({
    ...day,
    plateLunch: day.plateLunch.map(translate),
    grabAndGo: day.grabAndGo.map(translate),
    specialMessage: day.specialMessage ? translate(day.specialMessage) : day.specialMessage,
  }));
}
