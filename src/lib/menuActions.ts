/* eslint-disable eqeqeq */
import scapeCCUrl from '@/lib/scrapeCCUrl';
import parseCampusCenterMenu from '@/lib/menuParse';
import { getLatestMenu, insertMenu } from '@/lib/dbActions';
import populateFoodTableFromMenu from './foodTable';
import fetchOpenAI, { Option } from '../app/utils/api/openai';

enum Location {
  CAMPUS_CENTER = 'CAMPUS_CENTER',
  GATEWAY = 'GATEWAY',
  HALE_ALOHA = 'HALE_ALOHA',
}

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

interface MenuResponse {
  day_menus: DayMenu[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCheckCCMenu(language: string, country: string): Promise<DayMenu[]> {
  const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
  const menuPdf: string = await scapeCCUrl(menuURL);
  const parsedMenu: DayMenu[] = await parseCampusCenterMenu(menuPdf);

  // Gets latest English menu from database
  const dbLatestMenu = await getLatestMenu('English');
  // console.log('dbLatestMenu:', dbLatestMenu);

  // If the latest menu is not up to date, insert the parsed menu into the database
  const dbMenuParsed: DayMenu[] = dbLatestMenu ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

  // console.log(dbMenuParsed[0].plateLunch, '._.', parsedMenu[0].plateLunch);

  if (JSON.stringify(dbMenuParsed[0]) !== JSON.stringify(parsedMenu[0])
    && JSON.stringify(dbMenuParsed[1]) !== JSON.stringify(parsedMenu[1])
    && JSON.stringify(dbMenuParsed[2]) !== JSON.stringify(parsedMenu[2])) {
    console.log('Inserting parsedMenu into database');
    await insertMenu(parsedMenu, Location.CAMPUS_CENTER, 'English', 'USA');
    const translatedMenu: MenuResponse = await fetchOpenAI(Option.CC, parsedMenu, 'Japanese', 'Japan');
    const translatedDayMenus: DayMenu[] = translatedMenu.day_menus;
    await insertMenu(translatedDayMenus, Location.CAMPUS_CENTER, 'Japanese', 'Japan');

    // Populate foodTable with the new menu
    await populateFoodTableFromMenu(parsedMenu);

    return parsedMenu;
  }
  // If the latest menu is up to date, fetch the menu from the database
  console.log('Fetching parsedMenu from database');
  const dbMenu = await getLatestMenu('English');
  if (dbMenu) {
    return dbMenuParsed;
  }
  console.error('Failed to fetch parsedMenu from database');
  throw new Error('Failed to load parsedMenu. Please try again later.');
}

export default getCheckCCMenu;
