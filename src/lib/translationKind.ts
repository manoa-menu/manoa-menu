import type { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { normalizeTranslationSource, translationSourceKey } from '@/lib/translationSource';

export type TranslationStringKind = 'dish' | 'description';

export type TranslationKindCatalog = {
  dishes: Set<string>;
  descriptions: Set<string>;
  /** description source key → English dish name */
  descriptionParents: Map<string, string>;
};

export function createTranslationKindCatalog(): TranslationKindCatalog {
  return {
    dishes: new Set<string>(),
    descriptions: new Set<string>(),
    descriptionParents: new Map(),
  };
}

function addKind(set: Set<string>, value: string | null | undefined) {
  const key = translationSourceKey(value ?? '');
  if (key) {
    set.add(key);
  }
}

function linkDescriptionToDish(
  catalog: TranslationKindCatalog,
  dishText: string | null | undefined,
  descriptionText: string | null | undefined,
) {
  const dish = normalizeTranslationSource(dishText);
  const description = normalizeTranslationSource(descriptionText);
  const dishKey = translationSourceKey(dish);
  const descriptionKey = translationSourceKey(description);
  if (!dishKey || !descriptionKey || dishKey === descriptionKey) {
    return;
  }
  addKind(catalog.descriptions, description);
  if (!catalog.descriptionParents.has(descriptionKey)) {
    catalog.descriptionParents.set(descriptionKey, dish);
  }
}

export function collectSdxTranslationKinds(
  menu: unknown,
  catalog: TranslationKindCatalog,
): void {
  if (!Array.isArray(menu)) {
    return;
  }

  (menu as FilteredSodexoMeal[]).forEach((meal) => {
    addKind(catalog.dishes, meal?.name);
    meal?.groups?.forEach((group) => {
      addKind(catalog.dishes, group?.name);
      group?.items?.forEach((item) => {
        addKind(catalog.dishes, item?.formalName);
        linkDescriptionToDish(catalog, item?.formalName, item?.description);
      });
    });
  });
}

export function collectCcTranslationKinds(
  menu: unknown,
  catalog: TranslationKindCatalog,
): void {
  if (!Array.isArray(menu)) {
    return;
  }

  (menu as DayMenu[]).forEach((day) => {
    day?.plateLunch?.forEach((item) => addKind(catalog.dishes, item));
    day?.grabAndGo?.forEach((item) => addKind(catalog.dishes, item));
    const messageKey = translationSourceKey(day?.specialMessage ?? '');
    if (messageKey && !catalog.dishes.has(messageKey)) {
      addKind(catalog.descriptions, day.specialMessage);
    }
  });
}

function looksLikeDescription(sourceText: string): boolean {
  const words = sourceText.trim().split(/\s+/).filter(Boolean);
  return sourceText.length > 42 || words.length >= 6 || /[.!?]/.test(sourceText);
}

export function classifyTranslationKind(
  sourceText: string,
  catalog: TranslationKindCatalog,
): TranslationStringKind {
  const key = translationSourceKey(sourceText);
  const isDish = catalog.dishes.has(key);
  const isDescription = catalog.descriptions.has(key);
  if (isDish && !isDescription) {
    return 'dish';
  }
  if (isDescription && !isDish) {
    return 'description';
  }
  if (isDish && isDescription) {
    return looksLikeDescription(sourceText) ? 'description' : 'dish';
  }
  return looksLikeDescription(sourceText) ? 'description' : 'dish';
}

export function parentDishForSource(
  sourceText: string,
  catalog: TranslationKindCatalog,
): string | null {
  return catalog.descriptionParents.get(translationSourceKey(sourceText)) ?? null;
}
