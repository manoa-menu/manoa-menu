/* eslint-disable operator-linebreak */
/* eslint-disable eqeqeq */
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import parseCampusCenterMenu from '@/lib/menuParse';
import { getLatestCCMenu, insertCCMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse } from '@/types/menuTypes';
import populateFoodTableFromCCMenu from './foodTable';
import fetchOpenAI from '../app/utils/api/openai';
import { getCurrentWeekOf, getNextWeekOf } from './dateFunctions';

async function getCheckCCMenu(language: string): Promise<DayMenu[]> {
  try {
    // Log the language parameter
    console.log(`Fetching menu for language: ${language}`);

    const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
    const menuPdf: string | null = await scrapeCCUrl(menuURL);
    if (menuPdf === null) {
      throw new Error('Failed to scrape menu PDF');
    }
    const parsedMenu: MenuResponse = await parseCampusCenterMenu(menuPdf);

    // Gets latest English menu from database
    const dbLatestMenu = await getLatestCCMenu('English');

    // Parse the latest menu from the database
    const dbMenuParsed: DayMenu[] = dbLatestMenu ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

    // console.log(`dbMenuParsed: ${JSON.stringify(dbMenuParsed)}`);

    // Check if the latest menu is not up to date
    if (
      dbMenuParsed.length === 0 ||
      (JSON.stringify(dbMenuParsed[1].grabAndGo) !== JSON.stringify(parsedMenu.weekOne[1].grabAndGo) &&
        JSON.stringify(dbMenuParsed[2].plateLunch) !== JSON.stringify(parsedMenu.weekOne[2].plateLunch))
    ) {
      console.log('Inserting parsedMenu into database');

      // console.log(parsedMenu.weekOne);
      // Insert the parsed menu for week one into the database
      await insertCCMenu(parsedMenu.weekOne, Location.CAMPUS_CENTER, 'English', getCurrentWeekOf());
      await populateFoodTableFromCCMenu(parsedMenu.weekOne);

      // If week two menu exists, insert it into the database
      if (parsedMenu.weekTwo) {
        await insertCCMenu(parsedMenu.weekTwo, Location.CAMPUS_CENTER, 'English', getNextWeekOf());
        await populateFoodTableFromCCMenu(parsedMenu.weekTwo);
        // console.log(parsedMenu.weekTwo);
      }

      // Fetch the translated menu using OpenAI
      console.log('Translating menu into Japanese');

      const prompt = `You will translate all menu items into ${language}. 
      Translate and word in a way that is easy for native speakers of ${language} to understand.
      In parenthesis provide a brief description of dish contents in ${language}
      or foods that ${language} people may not be familiar with,
      or Chinese food, Uncommon Mexican food, Hawaiian food,
      or Chicken Parmesan, Cobb Salad, Huli Huli Chicken
      or foods that are not self-explanatory.
      Must describe pasta dishes, special salads, non-famous American dishes, and foreign asian dishes.
      Do not add or create new items that are not on the menu.
      If there is a special message, provide a translation in ${language}.`;

      const translatedMenu = (await fetchOpenAI(
        prompt,
        Location.CAMPUS_CENTER,
        parsedMenu,
        'Japanese',
      )) as MenuResponse;

      // Insert the translated menu for week one into the database
      await insertCCMenu(translatedMenu.weekOne, Location.CAMPUS_CENTER, 'Japanese', getCurrentWeekOf());

      // If week two translated menu exists, insert it into the database
      if (translatedMenu.weekTwo) {
        await insertCCMenu(translatedMenu.weekTwo, Location.CAMPUS_CENTER, 'Japanese', getNextWeekOf());
      }

      // If the latest menu is up to date, fetch the menu from the database
      console.log(`Fetching parsedMenu from database in ${language}`);
      const dbMenuLanguage = await getLatestCCMenu(language);
      console.log(`dbMenuLanguage: ${JSON.stringify(dbMenuLanguage)}`);
      const dbMenuLanguageParsed: DayMenu[] = dbMenuLanguage ? JSON.parse(JSON.stringify(dbMenuLanguage?.menu)) : [];

      // Return the parsed menu if it exists
      if (dbMenuLanguageParsed) {
        return dbMenuLanguageParsed;
      }
    } else {
      // If the latest menu is up to date, fetch the menu from the database
      console.log(`Fetching parsedMenu from database in ${language}`);
      const dbMenuLanguage = await getLatestCCMenu(language);
      const dbMenuLanguageParsed: DayMenu[] = dbMenuLanguage ? JSON.parse(JSON.stringify(dbMenuLanguage?.menu)) : [];

      // Return the parsed menu if it exists
      if (dbMenuLanguageParsed) {
        return dbMenuLanguageParsed;
      }
    }

    // Log an error if fetching the parsed menu from the database fails
    throw new Error(`Failed to load parsedMenu for language: ${language}. Please try again later.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch menu for language: ${language}. ERROR: ${error.message}`);
      throw new Error(`Failed to load menu for language: ${language}. ERROR: ${error.message}`);
    } else {
      console.error(`Failed to fetch menu for language: ${language}. Unknown error: ${error}`);
      throw new Error(`Failed to load menu for language: ${language}. Unknown error: ${error}`);
    }
  }
}

export default getCheckCCMenu;
