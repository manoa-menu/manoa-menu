/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import {
  SodexoMeal,
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

const SUPPORTED_LANGUAGES = ['english', 'japanese', 'korean', 'chinese'];

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

const removeNutritionalFacts = (rootObject: SodexoMeal): FilteredSodexoMeal => ({
  name: rootObject.name,
  groups: rootObject.groups
    // Filter out groups with no names or no items
    .filter((group) => group.name && group.items.length > 0)
    .map((group) => ({
      name: group.name || '',
      items: group.items
        .filter(
          (item) =>
            // Filter out items with the name 'Have a nice day'

            item.formalName.toLowerCase() !== 'have a nice day',
        )
        .map((item) => {
          // Remove nutritional facts from items
          const {
            price,
            addons,
            sizes,
            allergens,
            courseSortOrder,
            menuItemId,
            isMindful,
            isSwell,
            calories,
            caloriesFromFat,
            fat,
            saturatedFat,
            transFat,
            polyunsaturatedFat,
            cholesterol,
            sodium,
            carbohydrates,
            dietaryFiber,
            sugar,
            protein,
            potassium,
            iron,
            calcium,
            vitaminA,
            vitaminC,
            ...rest
          } = item;
          return rest;
        }),
    })),
});

type ResolvedDay = {
  date: string;
  meals: FilteredSodexoMeal[];
  englishMenu?: FilteredSodexoMeal[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  let language = searchParams.get('language');
  language = language ? language.charAt(0).toUpperCase() + language.slice(1).toLowerCase() : null;

  if (!language) {
    return NextResponse.json({ error: 'Missing Language Parameter' }, { status: 500 });
  }
  if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
    return NextResponse.json({ error: 'Invalid Language Parameter' }, { status: 500 });
  }

  const location =
    searchParams.get('location') || NextResponse.json({ error: 'Missing Location Parameter' }, { status: 500 });
  console.log(`Location: ${location}`);

  const locationOption = location === 'gw' ? Location.GATEWAY : Location.HALE_ALOHA;

  const gwURL = process.env.GW_API_URL;
  const haURL = process.env.HA_API_URL;

  const url = location === 'gw' ? gwURL : haURL;

  const apiKey = process.env.MMR_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const fetchEnglishSdxMenu = async (day: string): Promise<FilteredSodexoMeal[]> => {
    const existingEnglish = await getSdxMenu(day, 'English', locationOption);
    if (existingEnglish) {
      return (existingEnglish.menu as unknown as FilteredSodexoMeal[]) || [];
    }

    const queryUrl = `${url}?date=${day}`;
    console.log(`Getting data for ${day} via API`);
    const response = await axios.get(queryUrl, { headers });
    const dataArr: SodexoMeal[] | [] = response.data;
    const filteredData: FilteredSodexoMeal[] = dataArr.map((data: SodexoMeal) => removeNutritionalFacts(data));

    if (filteredData.length > 0) {
      console.log(`Inserting menu for ${day} in English`);
    } else {
      console.log(`Inserting blank menu for ${day} in English`);
    }
    await insertSdxMenu(filteredData, locationOption, 'English', day);

    return filteredData;
  };

  const currentWeekDates = getCurrentWeekDates();

  const resolvedDays: ResolvedDay[] = await Promise.all(
    currentWeekDates.map(async (day): Promise<ResolvedDay> => {
      try {
        console.log(`Attempting to get menu for ${day} from database`);

        const cachedMenu = await getSdxMenu(day, language, locationOption);
        if (cachedMenu) {
          const dayMenu = (cachedMenu.menu as unknown as FilteredSodexoMeal[]) || [];
          console.log(`Returning cached ${language} menu for ${day}`);
          return {
            date: day,
            meals: dayMenu,
          };
        }

        const englishMenu = await fetchEnglishSdxMenu(day);

        if (language.toLowerCase() === 'english') {
          return {
            date: day,
            meals: englishMenu,
          };
        }

        if (englishMenu.length === 0) {
          console.log(`Inserting blank menu for ${day} in ${language}`);
          await insertSdxMenu([], locationOption, language, day);
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
        };
      }
    }),
  );

  const pendingTranslations = resolvedDays.filter(
    (day): day is ResolvedDay & { englishMenu: FilteredSodexoMeal[] } => Boolean(day.englishMenu),
  );

  if (pendingTranslations.length > 0) {
    try {
      const englishMenus = pendingTranslations.map((day) => day.englishMenu);
      const uniqueStrings = collectSdxTranslatableStrings(englishMenus);

      console.log(
        `Translating ${uniqueStrings.length} unique strings across `
          + `${pendingTranslations.length} day(s) into ${language}`,
      );

      const translatedStrings = await translateSdxStrings(
        getSdxTranslationPrompt(language),
        uniqueStrings,
        language,
      );
      const translationMap = buildSdxTranslationMap(uniqueStrings, translatedStrings);

      await Promise.all(
        pendingTranslations.map(async (day) => {
          const translatedMenu = applySdxTranslations(day.englishMenu, translationMap);
          await insertSdxMenu(translatedMenu, locationOption, language, day.date);
          day.meals = translatedMenu;
        }),
      );
    } catch (error) {
      console.error('Error translating SDX menus for the week:', error);
      return NextResponse.json(
        { error: 'Failed to translate SDX menus for the week.' },
        { status: 500 },
      );
    }
  }

  const nextSevenDaysMenu: SdxAPIResponse[] = resolvedDays.map(({ date, meals }) => ({
    date,
    meals,
  }));

  return NextResponse.json(nextSevenDaysMenu);
}
