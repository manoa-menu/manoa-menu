import type { FilteredSodexoMeal } from '@/types/menuTypes';
import { isSdxPlaceholderItemName } from './sdxSpecialHours';
import { uniqueSdxMenuApiUrls } from './sdxMenuEndpoint';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid menu object');
  }
  return value as Record<string, unknown>;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid menu list');
  return value;
}

function name(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing menu name');
  return value.trim();
}

/** Accept known envelopes, but never treat error objects or damaged meals as a closed day. */
export function parseSdxMeals(payload: unknown): FilteredSodexoMeal[] {
  const root = Array.isArray(payload) ? payload : (() => {
    const envelope = record(payload);
    if (envelope.error || envelope.errors || envelope.success === false) throw new Error('Upstream menu error');
    return envelope.meals ?? envelope.data;
  })();
  return array(root).map(value => {
    const meal = record(value);
    return {
      name: name(meal.name),
      groups: array(meal.groups).map(value => {
        const group = record(value);
        const items = array(group.items).map(value => {
          const item = record(value);
          if (typeof item.formalName !== 'string') throw new Error('Missing dish name');
          return {
            formalName: item.formalName.trim(),
            description: typeof item.description === 'string' ? item.description : '',
            course: typeof item.course === 'string' ? item.course : null,
            meal: typeof item.meal === 'string' ? item.meal : name(meal.name),
            isVegan: item.isVegan === true,
            isVegetarian: item.isVegetarian === true,
            ...(typeof item.englishName === 'string' ? { englishName: item.englishName } : {}),
          };
        }).filter(item => !isSdxPlaceholderItemName(item.formalName));
        return { name: typeof group.name === 'string' ? group.name.trim() || 'Menu' : 'Menu', items };
      }).filter(group => group.items.length > 0),
    };
  }).filter(meal => meal.groups.length > 0);
}

export async function fetchSdxWithFallbacks(
  initialUrls: string[],
  discover: () => Promise<string[]>,
  fetchMeals: (url: string) => Promise<FilteredSodexoMeal[]>,
): Promise<FilteredSodexoMeal[]> {
  const tried: string[] = [];
  let hadValidResponse = false;
  const tryUrls = async (urls: string[]) => {
    for (const url of uniqueSdxMenuApiUrls(...tried, ...urls).slice(tried.length)) {
      tried.push(url);
      try {
        const meals = await fetchMeals(url);
        hadValidResponse = true;
        if (meals.length) return meals;
      } catch {
        // Log no request config: it can contain the upstream API key.
        console.warn('[sdx-menu] A menu source failed; trying remaining sources');
      }
    }
    return null;
  };
  const initial = await tryUrls(initialUrls);
  if (initial) return initial;
  try {
    const recovered = await tryUrls(await discover());
    if (recovered) return recovered;
  } catch {
    console.warn('[sdx-menu] Live menu discovery failed');
  }
  if (!hadValidResponse) throw new Error('All menu sources failed');
  return [];
}
