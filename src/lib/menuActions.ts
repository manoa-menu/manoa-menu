 
 
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import { getCCMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse } from '@/types/menuTypes';
import fetchOpenAI, { parseCCMenuFromPDF } from '../app/utils/api/openai';
import { getCurrentWeekOf, getNextWeekOf } from './dateFunctions';

async function getCheckCCMenu(language: string): Promise<DayMenu[]> {
  try {
    console.log(`Fetching menu for language: ${language}`);

    const currentWeekOf = getCurrentWeekOf();
    const nextWeekOf = getNextWeekOf();

    if (language !== 'English') {
      const existingLanguageMenu = await getCCMenu(currentWeekOf, language);
      if (existingLanguageMenu) {
        const existingLanguageMenuParsed = existingLanguageMenu.menu as unknown as DayMenu[];
        if (existingLanguageMenuParsed.length > 0) {
          console.log(`Returning cached ${language} menu for ${currentWeekOf}`);
          return existingLanguageMenuParsed;
        }
      }
    }

    // Check if English menu is already in DB (parallel fetch for both weeks)
    const [englishWeekOneRow, englishWeekTwoRow] = await Promise.all([
      getCCMenu(currentWeekOf, 'English'),
      getCCMenu(nextWeekOf, 'English'),
    ]);

    let englishMenuFromDb: MenuResponse;

    if (englishWeekOneRow) {
      // English menu is cached, skip scraping and PDF parsing entirely
      console.log(`English menu already cached for ${currentWeekOf}, skipping scrape`);
      const englishWeekOne = englishWeekOneRow.menu as unknown as DayMenu[];
      const englishWeekTwo = englishWeekTwoRow
        ? (englishWeekTwoRow.menu as unknown as DayMenu[])
        : [];
      englishMenuFromDb = { weekOne: englishWeekOne, weekTwo: englishWeekTwo };
    } else {
      // No cached menu, scrape and parse the PDF
      const menuURL = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
      console.log(`No cached English menu. Scraping PDF URL from: ${menuURL}`);
      let menuPdf: string | null = null;

      try {
        menuPdf = await scrapeCCUrl(menuURL);
        console.log(`Scraped PDF URL: ${menuPdf}`);
      } catch (scrapeError) {
        console.warn(`Failed to scrape PDF URL: ${scrapeError}`);
        const staticPdf = '/cc-menus/menu.pdf';
        menuPdf = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${staticPdf}`;
        console.log(`Falling back to static PDF: ${menuPdf}`);
      }

      console.log(`Parsing PDF for week ${currentWeekOf}`);
      englishMenuFromDb = await parseCCMenuFromPDF(menuPdf);

      if (!englishMenuFromDb.weekOne || englishMenuFromDb.weekOne.length === 0) {
        throw new Error(`English menu is missing after PDF parse for ${currentWeekOf}.`);
      }
    }

    if (language === 'English') {
      return englishMenuFromDb.weekOne;
    }

    console.log(`No ${language} menu found for ${currentWeekOf}. Translating now.`);
  const prompt = `You are translating a cafeteria menu into ${language}.

OUTPUT RULES
1) Preserve the original structure and ordering exactly. Do not add, remove,
   merge, or invent groups or items.
2) Translate every group name and every menu item name into natural
   ${language}.
   - Group names: do not translate word-for-word. Use a natural equivalent
     category name in ${language}.
3) Parentheses notes are OPTIONAL and must be NECESSARY.
   - Only add a short explanation in parentheses when the dish would still be
     unclear to an average native speaker of ${language} AFTER
     translation.
   - If the translated name already clearly tells what it is, DO NOT add
     parentheses.

WHEN TO ADD PARENTHESES
A) The item is culturally specific OR uses an unfamiliar dish name OR a
   brand/place name OR a cooking style that many people in
   ${language} would not recognize, AND
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
- Keep it to 6 to 12 words in ${language}.
- Explain what it is using ingredients or dish type, not extra marketing.

SPECIAL CASES
- Keep proper nouns as-is (example: "Cajun", "Mesquite",
  "Chimichurri", "Huli Huli") and optionally explain ONLY if
  needed.

Return ONLY the translated menu text.\n`;

    const translatedMenu = await fetchOpenAI(
      prompt,
      Location.CAMPUS_CENTER,
      englishMenuFromDb,
      language,
      currentWeekOf,
    ) as MenuResponse;

    if (translatedMenu.weekOne && translatedMenu.weekOne.length > 0) {
      return translatedMenu.weekOne;
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
