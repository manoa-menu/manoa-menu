import scapeCCUrl from '@/lib/scrapeCCUrl';
import parseCampusCenterMenu from '@/lib/menuParse';
import { getLatestMenu, getMenu, insertMenu } from '@/lib/dbActions';
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

function getCurrentWeek(): Date {
  const today = new Date();
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = today.getDay();
  // Calculate the start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  // Calculate the end of the week (Saturday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  return startOfWeek;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCheckCCMenu(language: string, country: string): Promise<DayMenu[]> {
  const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
  const menuPdf: string = await scapeCCUrl(menuURL);
  const parsedMenu: DayMenu[] = await parseCampusCenterMenu(menuPdf);

  // Gets latest English menu from database
  const dbLatestMenu = await getLatestMenu();

  // If the latest menu is older than the current week,
  // insert the parsed menu into the database
  if ((dbLatestMenu?.week_of ?? 0) < getCurrentWeek()) {
    console.log('Inserting parsedMenu into database');
    await insertMenu(parsedMenu, Location.CAMPUS_CENTER, 'English', 'USA');
    const translatedMenu: MenuResponse = await fetchOpenAI(Option.CC, parsedMenu, 'Japanese', 'Japan');
    const translatedDayMenus: DayMenu[] = translatedMenu.day_menus;
    await insertMenu(translatedDayMenus, Location.CAMPUS_CENTER, 'Japanese', 'Japan');
    return translatedDayMenus;
  }
  // If the latest menu is up to date, fetch the menu from the database
  console.log('Fetching parsedMenu from database');
  const dbMenu = await getMenu(getCurrentWeek(), 'English');
  if (dbMenu && typeof dbMenu.menu === 'string') {
    return JSON.parse(dbMenu.menu);
  }
  console.error('Failed to fetch parsedMenu from database');
  throw new Error('Failed to load parsedMenu. Please try again later.');
}

export default getCheckCCMenu;
