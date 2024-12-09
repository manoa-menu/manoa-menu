/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { SodexoMeal, FilteredSodexoMeal, Location,
  FilteredSodexoModRoot, FilteredSodexoMenuRow, SdxAPIResponse,
  SdxSchemaObject } from '@/types/menuTypes';

import fetchOpenAI from '@/app/utils/api/openai';
import { getSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getSevenDayDate, getCurrentWeekDates } from '@/lib/dateFunctions';

const removeNutritionalFacts = (rootObject: SodexoMeal): FilteredSodexoMeal => ({
  name: rootObject.name,
  groups: rootObject.groups
    // Filter out groups with no names or no items
    .filter(group => group.name && group.items.length > 0)
    .map(group => ({
      name: group.name,
      items: group.items.filter(item => (
        // Filter out items with the name 'Have a nice day'
        (item.formalName.toLowerCase() !== 'have a nice day')
      )).map(item => {
        // Remove nutritional facts from items
        const {
          price, addons, sizes, allergens, courseSortOrder, menuItemId,
          isMindful, isSwell, calories, caloriesFromFat, fat,
          saturatedFat, transFat, polyunsaturatedFat, cholesterol,
          sodium, carbohydrates, dietaryFiber, sugar, protein,
          potassium, iron, calcium, vitaminA, vitaminC,
          ...rest
        } = item;
        return rest;
      }),
    })),
});

// eslint-disable-next-line import/prefer-default-export
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
  const location = searchParams.get('location')
    || NextResponse.json({ error: 'Missing Location Parameter' }, { status: 500 });
  console.log(`Location: ${location}`);

  const locationOption = (location === 'gw') ? Location.GATEWAY : Location.HALE_ALOHA;
  const locationString = (location === 'gw') ? 'Gateway' : 'Hale Aloha';
  // console.log(`Location Option: ${locationOption}`);

  const translateLanguage = 'Japanese';

  const prompt = `You will translate all menu items into ${translateLanguage}. 
  For the group names, do not directly translate, but instead use similar meaning words in ${translateLanguage}.
  Do not add additional groups or items that are not in the original.
  Translate both menu items AND item description and word in a way 
  that is easy for native speakers of ${translateLanguage} to understand.
  ONLY IF there is no description already,
  Add descriptions to items that native speakers of ${translateLanguage} may not understand
  such as Portuegese Sausage, or Chicken Parmesan, Cobb Salad, Huli Huli Chicken,
  pasta dishes, special salads, non-famous American dishes, and foreign asian dishes, etc
  or foods that are not self-explanatory.
  Do not add or create new items that are not on the menu.\n`;

  const gwURL = process.env.GW_API_URL;
  const haURL = process.env.HA_API_URL;

  const url = (location === 'gw') ? gwURL : haURL;
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

        const dayMenu: FilteredSodexoMeal[] = dayMenuRow?.menu as unknown as FilteredSodexoMeal[] || [];

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
            const translatedMenuSchemaObj: SdxSchemaObject = await fetchOpenAI(
              prompt,
              locationOption,
              filteredData,
              'Japanese',
            ) as SdxSchemaObject;

            translatedMenu = translatedMenuSchemaObj.schemaObject;

            // Insert the translated menu
            console.log(`Inserting menu for ${day} in Japanese`);
            await insertSdxMenu(translatedMenu, locationOption, 'Japanese', day);
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
          } if (language.toLowerCase() === 'japanese') {
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
