 
 
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import { getCCMenu } from '@/lib/dbActions';
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

    const currentWeekOf = getCurrentWeekOf();

    if (language === 'English') {
      return parsedMenu.weekOne;
    }

    console.log(`Checking ${language} menu for current week: ${currentWeekOf}`);
    const existingLanguageMenu = await getCCMenu(currentWeekOf, language);
    if (existingLanguageMenu) {
      const existingLanguageMenuParsed: DayMenu[] = JSON.parse(JSON.stringify(existingLanguageMenu.menu));
      if (existingLanguageMenuParsed.length > 0) {
        return existingLanguageMenuParsed;
      }
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
- Keep proper nouns as-is (example: "Cobb", "Cajun", "Mesquite",
  "Chimichurri", "Huli Huli", "Mochiko") and optionally explain ONLY if
  needed.

Return ONLY the translated menu text.\n`;

    const translatedMenu = await fetchOpenAI(
      prompt,
      Location.CAMPUS_CENTER,
      parsedMenu,
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
