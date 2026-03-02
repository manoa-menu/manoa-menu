/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import {
  SodexoMeal,
  FilteredSodexoMeal,
  Location,
  FilteredSodexoModRoot,
  FilteredSodexoMenuRow,
  SdxAPIResponse,
  SdxSchemaObject,
} from '@/types/menuTypes';

import fetchOpenAI from '@/app/utils/api/openai';
import { getSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getSevenDayDate, getCurrentWeekDates } from '@/lib/dateFunctions';

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

 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  let language = searchParams.get('language');
  language = language ? language.charAt(0).toUpperCase() + language.slice(1).toLowerCase() : null;

  if (language?.toLowerCase() !== 'english' && language?.toLowerCase() !== 'japanese') {
    return NextResponse.json({ error: 'Invalid Language Parameter' }, { status: 500 });
  }
  if (!language) {
    return NextResponse.json({ error: 'Missing Language Parameter' }, { status: 500 });
  }
   
  const location =
    searchParams.get('location') || NextResponse.json({ error: 'Missing Location Parameter' }, { status: 500 });
  console.log(`Location: ${location}`);

  const locationOption = location === 'gw' ? Location.GATEWAY : Location.HALE_ALOHA;
  const locationString = location === 'gw' ? 'Gateway' : 'Hale Aloha';
  // console.log(`Location Option: ${locationOption}`);

  const translateLanguage = 'Japanese';

  const prompt = `You are translating a cafeteria menu into ${translateLanguage}.

OUTPUT RULES
1) Preserve the original structure and ordering exactly. Do not add, remove,
   merge, or invent groups or items.
2) Translate every group name and every menu item name into natural
   ${translateLanguage}.
   - Group names: do not translate word-for-word. Use a natural equivalent
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

Return ONLY the translated menu text.\n`;

  const gwURL = process.env.GW_API_URL;
  const haURL = process.env.HA_API_URL;

  const url = location === 'gw' ? gwURL : haURL;
  // console.log(`URL: ${url}`);

  const apiKey = process.env.MMR_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Check if menu for next 7 days is available
  const currentWeekDates = getCurrentWeekDates();

  // const testDays = ['2024-12-06', '2024-12-08'];

  const nextSevenDaysMenu: SdxAPIResponse[] = await Promise.all(
    currentWeekDates.map(async (day) => {
      try {
        // Fetch the menu for the specific day

        console.log(`Attempting to get menu for ${day} from database`);

        const dayMenuRow = await getSdxMenu(day, language, locationOption);

        const dayMenu: FilteredSodexoMeal[] = (dayMenuRow?.menu as unknown as FilteredSodexoMeal[]) || [];

        console.log(`Menu for ${day} from database:`, dayMenuRow);

        if (!dayMenuRow) {
          // If menu does not exist, call the API with axios
          const queryUrl = `${url}?date=${day}`;

          console.log(`Getting data for ${day} via API`);
          const response = await axios.get(queryUrl, { headers });
          const dataArr: SodexoMeal[] | [] = response.data;

          // Filter the data
          const filteredData: FilteredSodexoMeal[] = dataArr.map((data: SodexoMeal) => removeNutritionalFacts(data));

          // Insert the menu
          const formattedMenu: SdxAPIResponse = {
            date: day,
            meals: filteredData,
          };

          if (filteredData.length > 0) {
            console.log(`Inserting menu for ${day} in English`);
          } else {
            console.log(`Inserting blank menu for ${day} in English`);
          }
          await insertSdxMenu(filteredData, locationOption, 'English', day);

          // Translate the menu

          let translatedMenu: FilteredSodexoMeal[] = [];

          if (filteredData.length > 0) {
            console.log(`Translating menu for ${day} into Japanese`);
            const translatedMenuSchemaObj: SdxSchemaObject = (await fetchOpenAI(
              prompt,
              locationOption,
              filteredData,
              'Japanese',
              day,
            )) as SdxSchemaObject;

            translatedMenu = translatedMenuSchemaObj.schemaObject;
          } else {
            console.log(`Inserting blank menu for ${day} in Japanese`);
            await insertSdxMenu([], locationOption, 'Japanese', day);
          }

          if (language.toLowerCase() === 'english') {
            console.log(`Adding English menu for ${day}`);
            const retVal: SdxAPIResponse = {
              date: day,
              meals: filteredData,
            };

            return retVal;
          }
          if (language.toLowerCase() === 'japanese') {
            console.log(`Adding Japanese menu for ${day}`);
            const retVal: SdxAPIResponse = {
              date: day,
              meals: translatedMenu,
            };

            return retVal;
          }
        }

        const retVal: SdxAPIResponse = {
          date: day,
          meals: dayMenu,
        };

        return retVal;
      } catch (error) {
        console.error(`Error fetching menu for ${day}:`, error);
        return {
          date: day,
          meals: [],
        };
      }
    }),
  );

  return NextResponse.json(nextSevenDaysMenu);
}
