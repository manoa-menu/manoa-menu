/* eslint-disable eqeqeq */
import scapeCCUrl from '@/lib/scrapeCCUrl';
import parseCampusCenterMenu from '@/lib/menuParse';
import { getLatestMenu, insertMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse, Option } from '@/types/menuTypes';

import fetchOpenAI from '../app/utils/api/openai';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCheckCCMenu(language: string, country: string): Promise<DayMenu[]> {
  const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
  const menuPdf: string | null = await scapeCCUrl(menuURL);
  if (menuPdf === null) {
    throw new Error('Failed to scrape menu PDF');
  }
  const parsedMenu: MenuResponse = await parseCampusCenterMenu(menuPdf);

  // Gets latest English menu from database
  const dbLatestMenu = await getLatestMenu('English');

  // Parse the latest menu from the database
  const dbMenuParsed: DayMenu[] = (dbLatestMenu) ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

  // Check if the latest menu is not up to date
  if (JSON.stringify(dbMenuParsed[1]) !== JSON.stringify(parsedMenu.weekOne[1])
    && JSON.stringify(dbMenuParsed[2]) !== JSON.stringify(parsedMenu.weekOne[2])) {
    console.log('Inserting parsedMenu into database');

    // Insert the parsed menu for week one into the database
    await insertMenu(parsedMenu.weekOne, Location.CAMPUS_CENTER, 'English', 'USA');

    // If week two menu exists, insert it into the database
    if (parsedMenu.weekTwo) {
      await insertMenu(parsedMenu.weekTwo, Location.CAMPUS_CENTER, 'English', 'USA');
    }

    // Fetch the translated menu using OpenAI
    const translatedMenu: MenuResponse = await fetchOpenAI(Option.CC, parsedMenu, 'Japanese', 'Japan');

    // Insert the translated menu for week one into the database
    await insertMenu(translatedMenu.weekOne, Location.CAMPUS_CENTER, 'Japanese', 'Japan');

    // If week two translated menu exists, insert it into the database
    if (translatedMenu.weekTwo) {
      await insertMenu(translatedMenu.weekTwo, Location.CAMPUS_CENTER, 'Japanese', 'Japan');
    }

    // Fetch the menu in the specified language from the database
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
}

export default getCheckCCMenu;
