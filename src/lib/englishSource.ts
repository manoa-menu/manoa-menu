import type { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { normalizeTranslationSource, translationSourceKey } from '@/lib/translationSource';

/** English underlines that should never appear under a translated dish. */
const HIDDEN_ENGLISH_SOURCES = new Set([
  translationSourceKey('Mini or Bowl: Choice of any one (1) entrée'),
]);

function stripTrailingNotes(text: string): string {
  return text
    .replace(/\s*[\(（][^)）]*[\)）]\s*$/g, '')
    .trim();
}

/** English to show under a translated dish. Hidden when it would only repeat the name. */
export function englishSourceLabel(
  translated: string | null | undefined,
  english: string | null | undefined,
): string | undefined {
  const source = normalizeTranslationSource(english);
  const display = normalizeTranslationSource(translated);
  if (!source || !display) {
    return undefined;
  }
  if (HIDDEN_ENGLISH_SOURCES.has(translationSourceKey(source))) {
    return undefined;
  }
  if (translationSourceKey(source) === translationSourceKey(display)) {
    return undefined;
  }
  if (translationSourceKey(source) === translationSourceKey(stripTrailingNotes(display))) {
    return undefined;
  }
  return source;
}

export function attachCcEnglishSources(
  translated: DayMenu[],
  english: DayMenu[],
): DayMenu[] {
  if (translated.length === 0 || translated.length !== english.length) {
    return translated;
  }

  return translated.map((day, dayIndex) => {
    const englishDay = english[dayIndex];
    if (!englishDay) {
      return day;
    }

    return {
      ...day,
      plateLunchEnglish: day.plateLunch.length === englishDay.plateLunch.length
        ? englishDay.plateLunch
        : undefined,
      grabAndGoEnglish: day.grabAndGo.length === englishDay.grabAndGo.length
        ? englishDay.grabAndGo
        : undefined,
    };
  });
}

export function attachSdxEnglishNames(
  translated: FilteredSodexoMeal[],
  english: FilteredSodexoMeal[],
): FilteredSodexoMeal[] {
  if (translated.length === 0 || translated.length !== english.length) {
    return translated;
  }

  return translated.map((meal, mealIndex) => {
    const englishMeal = english[mealIndex];
    if (!englishMeal || meal.groups.length !== englishMeal.groups.length) {
      return meal;
    }

    return {
      ...meal,
      groups: meal.groups.map((group, groupIndex) => {
        const englishGroup = englishMeal.groups[groupIndex];
        if (!englishGroup || group.items.length !== englishGroup.items.length) {
          return group;
        }

        return {
          ...group,
          items: group.items.map((item, itemIndex) => ({
            ...item,
            englishName: englishGroup.items[itemIndex]?.formalName,
          })),
        };
      }),
    };
  });
}
