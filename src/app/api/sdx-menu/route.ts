import { NextRequest, NextResponse } from 'next/server';
import { readUpstream, singleFlight } from '@/lib/upstreamFetch';
import { fetchSdxWithFallbacks, parseSdxMeals } from '@/lib/sdxMenuSource';

import {
  FilteredSodexoMeal,
  Location,
  SdxAPIResponse,
} from '@/types/menuTypes';

import { translateSdxStrings } from '@/app/utils/api/openai';
import { getSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getCurrentWeekDates } from '@/lib/dateFunctions';
import {
  applySdxTranslations,
  buildSdxTranslationMap,
  collectSdxTranslatableStrings,
} from '@/lib/sdxTranslation';
import {
  ensureSdxTranslationCacheBackfilled,
  overlaySdxMenusWithCorrections,
  refreshPendingSdxDays,
  translateSdxStringsCached,
  withSdxTranslationLock,
} from '@/lib/sdxTranslationCache';
import {
  resolveSdxMenuApiUrl,
  SDX_LOCATION_PAGES,
  sdxMenuApiUrlsMatch,
  uniqueSdxMenuApiUrls,
} from '@/lib/sdxMenuEndpoint';
import { parseMenuLanguage, parseSdxLocation } from '@/lib/menuQuery';
import { allowMenuRequest, menuClientKey } from '@/lib/menuRateLimit';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

const getSdxTranslationPrompt = (translateLanguage: string): string => (
  `You are translating a cafeteria menu into ${translateLanguage}.

INPUT/OUTPUT
- You will receive a JSON object with "expectedCount" and a "strings" array of English menu text.
- Return JSON with a "translations" array of EXACTLY expectedCount entries, in the same order.
- translations.length MUST equal strings.length. Never skip, merge, or drop an entry.
- Each entry is the ${translateLanguage} translation of the corresponding input string.

OUTPUT RULES
1) Preserve ordering exactly. Do not add, remove, merge, or invent strings.
2) Translate every string into natural ${translateLanguage}.
   - Group/category names: do not translate word-for-word. Use a natural equivalent
     category name in ${translateLanguage}.
3) Parentheses notes are OPTIONAL and must be NECESSARY.
   - Only add a short explanation in parentheses when the dish would still be
     unclear to an average native speaker of ${translateLanguage} AFTER
     translation.
   - If the translated name already clearly tells what it is, DO NOT add
     parentheses.

WHEN TO ADD PARENTHESES
A) The item is culturally specific OR uses an unfamiliar dish name OR a
   brand/place name OR a cooking style that many people in
   ${translateLanguage} would not recognize, AND
B) The translation alone does not reveal the main ingredients or what kind
   of dish it is, AND
C) A one-phrase clarification would reduce confusion.

WHEN NOT TO ADD PARENTHESES
- If the translated name already makes the dish obvious (wrap, salad, grilled
  chicken, garlic chicken, steak, lobster tail, fish & chips, Caesar salad,
  etc.)
- If it is just a normal combination of common ingredients and cooking
  methods.
- If the item name contains the main ingredient and form (example: "Asian
  chicken wrap", "Garlic chicken", "New York steak", "Lobster tail").

STYLE FOR PARENTHESES (if needed)
- Keep it to 6 to 12 words in ${translateLanguage}.
- Explain what it is using ingredients or dish type, not extra marketing.

SPECIAL CASES
- Keep proper nouns as-is (example: "Cobb", "Cajun", "Mesquite",
  "Chimichurri", "Huli Huli", "Mochiko") and optionally explain ONLY if
  needed.

Return ONLY the JSON object with the translations array.\n`
);

const shareEnglishFetch = singleFlight<FilteredSodexoMeal[]>();

type ResolvedDay = {
  date: string;
  meals: FilteredSodexoMeal[];
  englishMenu?: FilteredSodexoMeal[];
  status?: 'unavailable' | 'english-fallback';
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const language = parseMenuLanguage(searchParams.get('language'));
  if (!language) {
    return NextResponse.json({ error: 'Invalid or missing language' }, { status: 400 });
  }

  const location = parseSdxLocation(searchParams.get('location'));
  if (!location) {
    return NextResponse.json({ error: 'Invalid or missing location' }, { status: 400 });
  }

  if (!allowMenuRequest(`sdx-menu:${menuClientKey(req)}:${location}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }


  console.log(`Location: ${location}`);

  const locationOption = location === 'gw' ? Location.GATEWAY : Location.HALE_ALOHA;

  const gwURL = process.env.GW_API_URL;
  const haURL = process.env.HA_API_URL;
  const gwBackupURL = process.env.GW_API_URL_BACKUP;
  const haBackupURL = process.env.HA_API_URL_BACKUP;

  const configuredUrl = location === 'gw' ? gwURL : haURL;
  const backupUrl = location === 'gw' ? gwBackupURL : haBackupURL;

  const apiKey = process.env.MMR_API_KEY;

  if (!configuredUrl || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  let menuApiUrls = uniqueSdxMenuApiUrls(configuredUrl, backupUrl);
  let refreshPromise: Promise<string[]> | null = null;

  const refreshMenuApiUrlsFromPage = (): Promise<string[]> => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const pageUrl = location === 'gw' ? SDX_LOCATION_PAGES.gw : SDX_LOCATION_PAGES.ha;
        const resolved = await resolveSdxMenuApiUrl(pageUrl, configuredUrl);
        menuApiUrls = uniqueSdxMenuApiUrls(configuredUrl, resolved, backupUrl);
        if (!sdxMenuApiUrlsMatch(resolved, configuredUrl)) {
          console.warn(
            `[sdx-menu] ${location} live menu IDs differ from configured URL; also trying ${resolved}`,
          );
        }
        return menuApiUrls;
      })();
    }
    return refreshPromise;
  };

  const fetchMealsFromApi = async (day: string, apiUrl: string): Promise<FilteredSodexoMeal[]> => {
    const queryUrl = new URL(apiUrl);
    queryUrl.searchParams.set('date', day);
    return readUpstream(queryUrl.toString(), async response => parseSdxMeals(await response.json()), { headers });
  };

  const readCachedMenu = async (day: string, lang: string): Promise<FilteredSodexoMeal[]> => {
    try {
      const row = await getSdxMenu(day, lang, locationOption);
      return row ? parseSdxMeals(row.menu) : [];
    } catch {
      console.warn('[sdx-menu] Cache read failed; using the menu source');
      return [];
    }
  };

  const fetchEnglishSdxMenu = (day: string): Promise<FilteredSodexoMeal[]> =>
    shareEnglishFetch(`${location}:${day}`, async () => {
      const cached = await readCachedMenu(day, 'English');
      if (cached.length) return cached;
      const meals = await fetchSdxWithFallbacks(menuApiUrls, refreshMenuApiUrlsFromPage,
        apiUrl => fetchMealsFromApi(day, apiUrl));
      if (meals.length) {
        try {
          await insertSdxMenu(meals, locationOption, 'English', day);
        } catch {
          console.warn('[sdx-menu] Cache write failed; serving the fetched menu');
        }
      }
      return meals;
    });

  const currentWeekDates = getCurrentWeekDates();

  const resolvedDays: ResolvedDay[] = await Promise.all(
    currentWeekDates.map(async (day): Promise<ResolvedDay> => {
      try {
        console.log(`Attempting to get menu for ${day} from database`);

        if (language !== 'English') {
          const dayMenu = await readCachedMenu(day, language);
          if (dayMenu.length) return { date: day, meals: dayMenu };
        }

        const englishMenu = await fetchEnglishSdxMenu(day);

        if (language.toLowerCase() === 'english') {
          return {
            date: day,
            meals: englishMenu,
          };
        }

        if (englishMenu.length === 0) {
          console.log(`Skipping blank ${language} menu for ${day} (location closed / no meals)`);
          return {
            date: day,
            meals: [],
          };
        }

        return {
          date: day,
          meals: [],
          englishMenu,
        };
      } catch (error) {
        console.error(`Error fetching menu for ${day}:`, error);
        return {
          date: day,
          meals: [],
          status: 'unavailable',
        };
      }
    }),
  );

  const pendingTranslations = resolvedDays.filter(
    (day): day is ResolvedDay & { englishMenu: FilteredSodexoMeal[] } =>
      Array.isArray(day.englishMenu) && day.englishMenu.length > 0,
  );

  if (pendingTranslations.length > 0) {
    try {
      await withSdxTranslationLock(language, async () => {
        await ensureSdxTranslationCacheBackfilled(language);
        const stillPending = await refreshPendingSdxDays(
          pendingTranslations,
          language,
          locationOption,
        );
        if (stillPending.length === 0) {
          console.log(`Another request already translated ${language} ${locationOption} for this week`);
          return;
        }

        const englishMenus = stillPending
          .map((day) => day.englishMenu)
          .filter((menu): menu is FilteredSodexoMeal[] => Array.isArray(menu) && menu.length > 0);
        const uniqueStrings = collectSdxTranslatableStrings(englishMenus);

        console.log(
          `Translating ${uniqueStrings.length} unique strings across `
            + `${stillPending.length} day(s) into ${language}`,
        );

        const translatedStrings = await translateSdxStringsCached(
          language,
          uniqueStrings,
          (missing) => translateSdxStrings(
            getSdxTranslationPrompt(language),
            missing,
            language,
          ),
        );
        const translationMap = buildSdxTranslationMap(uniqueStrings, translatedStrings);

        await Promise.all(
          stillPending.map(async (day) => {
            const translatedMenu = applySdxTranslations(day.englishMenu ?? [], translationMap);
            day.meals = translatedMenu;
            try {
              await insertSdxMenu(translatedMenu, locationOption, language, day.date);
            } catch {
              console.warn('[sdx-menu] Could not cache translated menu');
            }
          }),
        );
      });
    } catch (error) {
      console.error('Error translating SDX menus for the week:', error);
      pendingTranslations.forEach(day => {
        if (!day.meals.length) {
          day.meals = day.englishMenu;
          day.status = 'english-fallback';
        }
      });
    }
  }

  if (language.toLowerCase() !== 'english') {
    try {
      await overlaySdxMenusWithCorrections(
        resolvedDays.filter(day => day.status !== 'english-fallback'), language, locationOption,
      );
    } catch {
      console.warn('[sdx-menu] Translation corrections unavailable; serving the menu');
    }
  }

  if (resolvedDays.every(day => day.status === 'unavailable')) {
    return NextResponse.json({ error: 'Menu sources are temporarily unavailable' }, { status: 503 });
  }
  const nextSevenDaysMenu: SdxAPIResponse[] = resolvedDays.map(({ date, meals, status }) => ({
    date, meals, ...(status ? { status } : {}),
  }));

  return NextResponse.json(nextSevenDaysMenu, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
