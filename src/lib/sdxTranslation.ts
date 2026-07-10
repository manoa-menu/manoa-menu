import { FilteredSodexoMeal } from '@/types/menuTypes';

export function collectSdxTranslatableStrings(menus: FilteredSodexoMeal[][]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (value: string) => {
    if (!value || seen.has(value)) {
      return;
    }
    seen.add(value);
    ordered.push(value);
  };

  for (const dayMenu of menus) {
    for (const meal of dayMenu) {
      add(meal.name);
      for (const group of meal.groups) {
        add(group.name);
        for (const item of group.items) {
          add(item.formalName);
          add(item.description);
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

export function applySdxTranslations(
  menu: FilteredSodexoMeal[],
  translations: Map<string, string>,
): FilteredSodexoMeal[] {
  const translate = (value: string) => translations.get(value) ?? value;

  return menu.map((meal) => ({
    name: translate(meal.name),
    groups: meal.groups.map((group) => ({
      name: translate(group.name),
      items: group.items.map((item) => ({
        ...item,
        formalName: translate(item.formalName),
        description: item.description ? translate(item.description) : item.description,
      })),
    })),
  }));
}
