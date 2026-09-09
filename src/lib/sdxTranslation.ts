import { FilteredSodexoMeal } from '@/types/menuTypes';
import {
  lookupTranslation,
  setUniqueTranslation,
  translationSourceKey,
  normalizeTranslationSource,
} from '@/lib/translationSource';

export function collectSdxTranslatableStrings(menus: FilteredSodexoMeal[][]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (value: string | null | undefined) => {
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
  };

  for (const dayMenu of menus) {
    for (const meal of dayMenu) {
      add(meal.name);
      for (const group of meal.groups) {
        add(group.name);
        for (const item of group.items) {
          add(item.formalName);
          if (translationSourceKey(item.description) !== translationSourceKey(item.formalName)) {
            add(item.description);
          }
        }
      }
    }
  }

  return ordered;
}

export function buildSdxTranslationMap(
  sourceStrings: string[],
  translatedStrings: string[],
): Map<string, string> {
  if (sourceStrings.length !== translatedStrings.length) {
    throw new Error(
      `Translation count mismatch: expected ${sourceStrings.length}, got ${translatedStrings.length}`,
    );
  }

  return new Map(sourceStrings.map((source, index) => [source, translatedStrings[index]]));
}

export function mergeSdxTranslations(
  sourceStrings: string[],
  cached: Map<string, string>,
  missingSources: string[],
  missingTranslated: string[],
): string[] {
  const fresh = missingSources.length === 0
    ? new Map<string, string>()
    : buildSdxTranslationMap(missingSources, missingTranslated);

  return sourceStrings.map((source) => {
    const translated = lookupTranslation(cached, source)
      ?? lookupTranslation(fresh, source);
    if (translated == null || !translated.trim()) {
      return source;
    }
    return translated;
  });
}

/** Cached/corrected table values win over translations already stored on a menu. */
export function mergeStoredAndCachedTranslations(
  storedPairs: Array<[string, string]>,
  cached: Map<string, string>,
): Map<string, string> {
  const merged = new Map<string, string>();
  storedPairs.forEach(([source, translated]) => {
    setUniqueTranslation(merged, source, translated);
  });
  cached.forEach((translated, source) => {
    setUniqueTranslation(merged, source, translated, true);
  });
  return merged;
}

function isSdxMenuShape(value: unknown): value is FilteredSodexoMeal[] {
  return Array.isArray(value);
}

function keepOrTranslate(
  englishValue: string | undefined,
  currentValue: string,
  translations: Map<string, string>,
): string {
  if (!englishValue) {
    return currentValue;
  }
  const translated = lookupTranslation(translations, englishValue);
  if (translated == null || !translated.trim()) {
    return currentValue;
  }
  return translated;
}

/**
 * Apply translations onto an existing translated menu. Missing map entries keep
 * the stored text — they are never replaced with English, and items are never dropped.
 */
export function patchSdxTranslatedMenu(
  englishMenu: unknown,
  translatedMenu: unknown,
  translations: Map<string, string>,
): FilteredSodexoMeal[] | null {
  if (!isSdxMenuShape(translatedMenu)) {
    return null;
  }
  if (!isSdxMenuShape(englishMenu) || englishMenu.length !== translatedMenu.length) {
    return translatedMenu;
  }

  let changed = false;
  const next = translatedMenu.map((translatedMeal, mealIndex) => {
    const englishMeal = englishMenu[mealIndex];
    if (!englishMeal?.groups || !translatedMeal?.groups) {
      return translatedMeal;
    }

    const mealName = keepOrTranslate(englishMeal.name, translatedMeal.name, translations);
    if (mealName !== translatedMeal.name) {
      changed = true;
    }

    const groups = englishMeal.groups.length !== translatedMeal.groups.length
      ? translatedMeal.groups
      : translatedMeal.groups.map((translatedGroup, groupIndex) => {
        const englishGroup = englishMeal.groups[groupIndex];
        if (!englishGroup?.items || !translatedGroup?.items) {
          return translatedGroup;
        }

        const groupName = keepOrTranslate(englishGroup.name, translatedGroup.name, translations);
        if (groupName !== translatedGroup.name) {
          changed = true;
        }

        const items = englishGroup.items.length !== translatedGroup.items.length
          ? translatedGroup.items
          : translatedGroup.items.map((translatedItem, itemIndex) => {
            const englishItem = englishGroup.items[itemIndex];
            if (!englishItem) {
              return translatedItem;
            }

            const formalName = keepOrTranslate(
              englishItem.formalName,
              translatedItem.formalName,
              translations,
            );
            const description = translatedItem.description
              ? keepOrTranslate(
                englishItem.description,
                translatedItem.description,
                translations,
              )
              : translatedItem.description;
            if (formalName === translatedItem.formalName
              && description === translatedItem.description) {
              return translatedItem;
            }
            changed = true;
            return {
              ...translatedItem,
              formalName,
              description,
            };
          });

        if (groupName === translatedGroup.name && items === translatedGroup.items) {
          return translatedGroup;
        }
        return {
          ...translatedGroup,
          name: groupName,
          items,
        };
      });

    if (mealName === translatedMeal.name && groups === translatedMeal.groups) {
      return translatedMeal;
    }
    return {
      ...translatedMeal,
      name: mealName,
      groups,
    };
  });

  return changed ? next : translatedMenu;
}

/** Pair English and translated menus by structure. Returns [] if the trees do not match. */
export function extractSdxTranslationPairs(
  englishMenu: unknown,
  translatedMenu: unknown,
): Array<[string, string]> {
  if (!isSdxMenuShape(englishMenu) || !isSdxMenuShape(translatedMenu)) {
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

  for (let mealIndex = 0; mealIndex < englishMenu.length; mealIndex += 1) {
    const englishMeal = englishMenu[mealIndex];
    const translatedMeal = translatedMenu[mealIndex];
    if (!englishMeal?.groups || !translatedMeal?.groups
      || englishMeal.groups.length !== translatedMeal.groups.length) {
      return [];
    }

    add(englishMeal.name, translatedMeal.name);

    for (let groupIndex = 0; groupIndex < englishMeal.groups.length; groupIndex += 1) {
      const englishGroup = englishMeal.groups[groupIndex];
      const translatedGroup = translatedMeal.groups[groupIndex];
      if (!englishGroup?.items || !translatedGroup?.items
        || englishGroup.items.length !== translatedGroup.items.length) {
        return [];
      }

      add(englishGroup.name, translatedGroup.name);

      for (let itemIndex = 0; itemIndex < englishGroup.items.length; itemIndex += 1) {
        const englishItem = englishGroup.items[itemIndex];
        const translatedItem = translatedGroup.items[itemIndex];
        add(englishItem?.formalName, translatedItem?.formalName);
        if (translationSourceKey(englishItem?.description ?? '')
          !== translationSourceKey(englishItem?.formalName ?? '')) {
          add(englishItem?.description, translatedItem?.description);
        }
      }
    }
  }

  return pairs;
}

export function applySdxTranslations(
  menu: FilteredSodexoMeal[],
  translations: Map<string, string>,
): FilteredSodexoMeal[] {
  const translate = (value: string) => {
    const translated = lookupTranslation(translations, value);
    if (translated == null || !translated.trim()) {
      return value;
    }
    return translated;
  };

  return menu.map((meal) => ({
    name: translate(meal.name),
    groups: meal.groups
      .map((group) => ({
        name: translate(group.name),
        items: group.items
          .map((item) => ({
            ...item,
            formalName: translate(item.formalName),
            description: item.description ? translate(item.description) : item.description,
          }))
          .filter((item) => item.formalName.trim().length > 0),
      }))
      .filter((group) => group.name.trim().length > 0 && group.items.length > 0),
  })).filter((meal) => meal.groups.length > 0);
}
