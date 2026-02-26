 
 
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import { getLatestCCMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse } from '@/types/menuTypes';
import fetchOpenAI, { parseCCMenuFromPDF } from '../app/utils/api/openai';
import { getCurrentWeekOf } from './dateFunctions';

async function getCheckCCMenu(language: string): Promise<DayMenu[]> {
  try {
    // Log the language parameter
    console.log(`Fetching menu for language: ${language}`);

    const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
    console.log(`Attempting to scrape PDF URL from: ${menuURL}`);
    let menuPdf: string | null = null;

    try {
      menuPdf = await scrapeCCUrl(menuURL);
      console.log(`Scraped PDF URL: ${menuPdf}`);
    } catch (scrapeError) {
      console.warn(`Failed to scrape PDF URL: ${scrapeError}`);
      console.log('Falling back to static PDF files...');

      // Try to use static PDFs as fallback
      const staticPdfs = [
        '/cc-menus/menu.pdf',
        '/cc-menus/menu2.pdf',
        '/cc-menus/specialmenu.pdf',
      ];

      for (const staticPdf of staticPdfs) {
        try {
          console.log(`Trying static PDF: ${staticPdf}`);
          const fullUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${staticPdf}`;
          menuPdf = fullUrl;
          break;
        } catch (error) {
          console.warn(`Failed to use static PDF ${staticPdf}: ${error}`);
        }
      }

      if (!menuPdf) {
        throw new Error('Failed to scrape menu PDF URL and no static PDFs available');
      }
    }

    console.log(`Attempting to parse PDF from URL: ${menuPdf}`);
    const parsedMenu: MenuResponse = await parseCCMenuFromPDF(menuPdf);
    console.log('Successfully parsed menu from PDF');

    // console.log(`Parsed menu: ${JSON.stringify(parsedMenu)}`);

    // Gets latest English menu from database
    const dbLatestMenu = await getLatestCCMenu('English');

    // Parse the latest menu from the database
    const dbMenuParsed: DayMenu[] = dbLatestMenu ? JSON.parse(JSON.stringify(dbLatestMenu?.menu)) : [];

    // console.log(`dbMenuParsed: ${JSON.stringify(dbMenuParsed)}`);

    // Check if the latest menu is not up to date
    if (
      dbMenuParsed.length === 0 ||
      (JSON.stringify(dbMenuParsed[0].plateLunch) !== JSON.stringify(parsedMenu.weekOne[0].plateLunch) &&
        JSON.stringify(dbMenuParsed[2].plateLunch) !== JSON.stringify(parsedMenu.weekOne[2].plateLunch))
    ) {
      console.log('Menu is not up to date, parseCCMenuFromPDF already inserted English menu');

      // Fetch the translated menu using OpenAI (DB check + insert handled inside fetchOpenAI)
      console.log('Translating menu into Japanese');

      const translateLanguage = 'Japanese';
      const prompt = `You will translate all menu items into ${translateLanguage}. 
      Translate and word in a way that is easy for native speakers of ${translateLanguage} to understand.
      In parenthesis provide a brief description of dish contents in ${translateLanguage}
      or foods that ${translateLanguage} people may not be familiar with,
      or Chinese food, Uncommon Mexican food, Hawaiian food,
      or Chicken Parmesan, Cobb Salad, Huli Huli Chicken
      or foods that are not self-explanatory.
      Must describe pasta dishes, special salads, non-famous American dishes, and foreign asian dishes.
      Do not add or create new items that are not on the menu.
      If there is a special message, provide a translation in ${translateLanguage}.`;

      await fetchOpenAI(
        prompt,
        Location.CAMPUS_CENTER,
        parsedMenu,
        'Japanese',
        getCurrentWeekOf(),
      ) as MenuResponse;

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
