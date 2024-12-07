import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { SodexoMeal, FilteredSodexoMeal, Location, MenuResponse, SodexoMenuRow } from '@/types/menuTypes';
import fetchOpenAI from '@/app/utils/api/openai';
import { getLatestSdxMenu, insertSdxMenu } from '@/lib/dbActions';
import { getSevenDayDate } from '@/lib/dateFunctions';

const now = new Date();
const formattedDate = now.toISOString().split('T')[0];

const removeNutritionalFacts = (rootObject: SodexoMeal): FilteredSodexoMeal => ({
  name: rootObject.name,
  groups: rootObject.groups.map(group => ({
    name: group.name,
    items: group.items.map(item => {
      const {
        courseSortOrder, menuItemId, isMindful, isSwell, calories, caloriesFromFat, fat,
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

  const date = searchParams.get('date') || formattedDate;
  const language = searchParams.get('language') || 'Japanese';
  const location = searchParams.get('location')
    || NextResponse.json({ error: 'Missing Location Parameter' }, { status: 500 });
  console.log(`Location: ${location}`);

  const locationOption = (location === 'gw') ? Location.GATEWAY : Location.HALE_ALOHA;
  const locationString = (location === 'gw') ? 'Gateway' : 'Hale Aloha';
  // console.log(`Location Option: ${locationOption}`);

  const prompt = `You will translate all menu items into ${language}. 
  For the group names, do not directly translate, but instead use similar meaning words in ${language}.
  Keep the SAME number of groups and items in each group. Do not add additional groups or items.
  Translate both menu items AND item description and word in a way 
  that is easy for native speakers of ${language} to understand.
  ONLY IF there is no description already,
  Add descriptions to items that native speakers of ${language} may not understand
  such as Portuegese Sausage, or Chicken Parmesan, Cobb Salad, Huli Huli Chicken,
  pasta dishes, special salads, non-famous American dishes, and foreign asian dishes, etc
  or foods that are not self-explanatory.
  Do not add or create new items that are not on the menu.`;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected yyyy-mm-dd' }, { status: 400 });
  }
  const gwURL = process.env.GW_API_URL;
  const haURL = process.env.HA_API_URL;

  const url = (location === 'gw') ? gwURL : haURL;
  // console.log(`URL: ${url}`);

  const apiKey = process.env.MMR_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const queryUrl = `${url}?date=${date}`;
  console.log(`Query URL: ${queryUrl}`);

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await axios.get(queryUrl, { headers });
    // eslint-disable-next-line prefer-destructuring
    const dataArr: SodexoMeal[] | [] = response.data;

    // eslint-disable-next-line max-len
    const filteredData: FilteredSodexoMeal[] = dataArr.map((data: SodexoMeal) => removeNutritionalFacts(data));

    const formattedMenu: SodexoMenuRow = {
      name: `${locationString} Menu for ${date}`,
      groups: filteredData,
    };

    // Check if menu for next 7 days is available
    const latestMenu = await getLatestSdxMenu('English', locationOption);

    if (latestMenu) {
      const latestMenuDate = latestMenu.date;
      const latestMenuDates = getSevenDayDate();
      if (latestMenuDates.includes(latestMenuDate)) {
        return NextResponse.json(latestMenu.menu);
      }
    } else {
      console.error('No latest menu found');
    }

    console.log(`Inserting English menu for ${locationString}...`);
    await insertSdxMenu(JSON.parse(JSON.stringify(formattedMenu)), locationOption, 'English', date);

    if (filteredData.length > 0) console.log(`Translating menu to ${language}...`);

    const translatedFilteredData: FilteredSodexoMeal[] | MenuResponse | SodexoMenuRow = (filteredData.length > 0)
      ? await fetchOpenAI(
        prompt,
        Location.GATEWAY,
        filteredData,
        language,
      ) : formattedMenu;

    await insertSdxMenu(translatedFilteredData as FilteredSodexoMeal[], locationOption, language, date);

    console.log(filteredData);

    return (NextResponse.json(formattedMenu));

    // Gets latest English menu from database
    // const dbLatestMenu = await getLatestMenu('English', locationOption);

    // Parse the latest menu from the database
    // const dbMenuParsed: FilteredSodexoMeal = (dbLatestMenu) ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

    // console.log(`dbMenuParsed: ${JSON.stringify(dbMenuParsed)}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
