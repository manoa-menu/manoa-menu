/* eslint-disable eqeqeq */
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import parseCampusCenterMenu from '@/lib/menuParse';
import { getLatestMenu, insertMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse, Option } from '@/types/menuTypes';
import populateFoodTableFromMenu from './foodTable';
import fetchOpenAI from '../app/utils/api/openai';

async function getCheckCCMenu(language: string): Promise<DayMenu[]> {
  try {
    const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
    const menuPdf: string | null = await scrapeCCUrl(menuURL);
    if (menuPdf === null) {
      throw new Error('Failed to scrape menu PDF');
    }
    const parsedMenu: MenuResponse = await parseCampusCenterMenu(menuPdf);

    // Gets latest English menu from database
    const dbLatestMenu = await getLatestMenu('English');

    // Parse the latest menu from the database
    const dbMenuParsed: DayMenu[] = (dbLatestMenu) ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

    // console.log(`dbMenuParsed: ${JSON.stringify(dbMenuParsed)}`);

    // Check if the latest menu is not up to date
    if ((dbMenuParsed.length === 0)
        || (JSON.stringify(dbMenuParsed[1].grabAndGo) !== JSON.stringify(parsedMenu.weekOne[1].grabAndGo)
        && JSON.stringify(dbMenuParsed[2].plateLunch) !== JSON.stringify(parsedMenu.weekOne[2].plateLunch))) {
      console.log('Inserting parsedMenu into database');

      // console.log(parsedMenu.weekOne);
      // Insert the parsed menu for week one into the database
      await insertMenu(parsedMenu.weekOne, Location.CAMPUS_CENTER, 'English', 'USA');
      await populateFoodTableFromMenu(parsedMenu.weekOne);
      
      // If week two menu exists, insert it into the database
      if (parsedMenu.weekTwo) {
        await insertMenu(parsedMenu.weekTwo, Location.CAMPUS_CENTER, 'English', 'USA', 2);
        await populateFoodTableFromMenu(parsedMenu.weekTwo);
        // console.log(parsedMenu.weekTwo);
      }

      // Fetch the translated menu using OpenAI
      console.log('Translating menu into Japanese');
      const translatedMenu: MenuResponse = await fetchOpenAI(Option.CC, parsedMenu, 'Japanese');

      // Insert the translated menu for week one into the database
      await insertMenu(translatedMenu.weekOne, Location.CAMPUS_CENTER, 'Japanese', 'Japan');

      // If week two translated menu exists, insert it into the database
      if (translatedMenu.weekTwo) {
        await insertMenu(translatedMenu.weekTwo, Location.CAMPUS_CENTER, 'Japanese', 'Japan', 2);
      }

      // If the latest menu is up to date, fetch the menu from the database
      console.log(`Fetching parsedMenu from database in ${language}`);
      const dbMenuLanguage = await getLatestMenu(language);
      const dbMenuLanguageParsed: DayMenu[] = (dbMenuLanguage) ? JSON.parse(JSON.stringify(dbMenuLanguage?.menu)) : [];

      // Return the parsed menu if it exists
      if (dbMenuLanguageParsed) {
        return dbMenuLanguageParsed;
      }
    } else {
      // If the latest menu is up to date, fetch the menu from the database
      console.log(`Fetching parsedMenu from database in ${language}`);
      const dbMenuLanguage = await getLatestMenu(language);
      const dbMenuLanguageParsed: DayMenu[] = (dbMenuLanguage) ? JSON.parse(JSON.stringify(dbMenuLanguage?.menu)) : [];

      // Return the parsed menu if it exists
      if (dbMenuLanguageParsed) {
        return dbMenuLanguageParsed;
      }
    }

    // Log an error if fetching the parsed menu from the database fails
    console.error('Failed to fetch parsedMenu from database');
    throw new Error('Failed to load parsedMenu. Please try again later.');
  } catch (error) {
    console.error(`Failed to fetch menu. ERROR: ${error}`);
    throw new Error(`Failed to load menu. ERROR: ${error}`);
  }
}

export default getCheckCCMenu;
