 
 
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

      const menuPdf = await scrapeCCUrl(menuURL);
      if (!menuPdf) {
        console.warn(`No Campus Center menu PDF found for the current week (${currentWeekOf})`);
        return [];
      }

      console.log(`Scraped PDF URL: ${menuPdf}`);
      console.log(`Parsing PDF for week ${currentWeekOf}`);
      englishMenuFromDb = await parseCCMenuFromPDF(menuPdf);

      if (!englishMenuFromDb.weekOne || englishMenuFromDb.weekOne.length === 0) {
        console.warn(`English menu is missing after PDF parse for ${currentWeekOf}`);
        return [];
      }
    }

    if (language === 'English') {
      return englishMenuFromDb.weekOne;
    }

    console.log(`No ${language} menu found for ${currentWeekOf}. Translating now.`);

    const prompt =
      `You are translating a cafeteria menu into ${language} for exchange students `
      + `who need to quickly understand what each dish is.

    TARGET READER
    Assume the reader is a native speaker of ${language}, but may not be familiar with American,
    Hawaiian, Filipino, local-style plate lunch, cafeteria, or regional restaurant dishes.
    The goal is not only to translate the name, but to help the student quickly imagine the main food.
    
    OUTPUT RULES
    1) Preserve the original structure, order, and number of groups/items exactly.
    2) Translate all group names and menu items into natural ${language}.
    3) Do not add, remove, merge, split, or invent menu items.
    4) Use familiar, student-friendly wording. Avoid overly literal translations.
    5) Return only the translated menu in the same format as the input.
    
    GROUP NAMES
    - Use natural cafeteria category names in ${language}, not word-for-word translations.
    - For example, translate categories by function, such as plate lunches, bowls, value bowls,
      or takeout/grab-and-go items.
    
    TRANSLATION STYLE
    - Prefer clear, natural, and informal food descriptions over strict literal translation
      when a literal translation would be confusing.
    - For unfamiliar dish names, transliterate or keep the established dish name, then add a short explanation.
    - When helpful, identify the main ingredient, cooking method, and defining sauce/flavor.
    - Do not over-explain items that are already clear in ${language}.
    
    PARENTHESES
    Add a short parenthetical description only when the dish would likely be unfamiliar or unclear to the target reader.
    
    Add parentheses when the item:
    - Is not commonly recognized by native speakers of ${language} from the target student culture.
    - Uses an unfamiliar cultural dish name, regional style, brand, place name, or specialized cooking term.
    - Uses an English/American menu phrase whose meaning is not obvious from the words alone.
    - Does not clearly show the main ingredient, dish type, sauce, or flavor.
    - Is a salad, wrap, bowl, or plate item with an unclear style name such as "Black & Blue,"
      "Mesquite," "Bruschetta," "Adobo," "Lau Lau," or "Kalua."
    
    Do not add parentheses when:
    - The dish is likely familiar to the target reader.
    - The translated name already identifies the dish clearly.
    - The description would only repeat the name.
    - There is not enough reliable information to describe it beyond the translated name.
    
    PARENTHESIS STYLE
    - Write descriptions in ${language}.
    - Keep them short: about 6 to 16 words.
    - Describe the basic dish type, main ingredient, cooking method, sauce, or defining flavor.
    - Be neutral and factual.
    - Do not add marketing language.
    - Do not use uncertainty phrases like "usually," "probably," or "may contain."
    
    INGREDIENT ACCURACY
    - Do not invent restaurant-specific ingredients, sauces, toppings, sides, or preparation details.
    - Only mention ingredients that appear in the name or are essential to the commonly recognized dish.
    - If recipes vary, give only a broad description.
    - You may mention the standard defining preparation of a well-known dish, such as fried cutlet,
      slow-cooked pork, stewed beef, or vinegar-soy braise.
    - Do not infer allergens, dietary labels, sides, or exact toppings when uncertain.
    
    SPECIAL CASES
    - Keep brand names and proper nouns as-is unless there is an established translation.
    - Keep style names like "Cajun," "Mesquite," "Black & Blue," or "Bruschetta" only if they are
      understandable in ${language}; otherwise translate or explain the meaning.
    - Transliterate unfamiliar cultural dish names when appropriate, then add a basic description.
    - Preserve numbers, serving sizes, and established abbreviations.
    - For fish names that may be unfamiliar, add a simple description such as "white fish" when accurate.
    
    EXAMPLES
    Use these as meaning guides. In the actual output, write the names and descriptions naturally in ${language}.
    
    - "Country Fried Steak" → translated name + (breaded fried beef with creamy gravy)
    - "Kalua Pork" → translated name + (Hawaiian-style slow-cooked shredded pork)
    - "Lau Lau" → translated name + (Hawaiian dish steamed in leaves)
    - "Pork Adobo" → translated name + (Filipino pork braised with vinegar and soy sauce)
    - "Black & Blue Chicken Salad" → translated name + (spiced chicken salad with blue cheese)
    - "Mesquite Chicken Salad" → translated name + (smoky-flavored chicken salad)
    - "Furikake Swai" → translated name + (white fish seasoned with furikake)
    - "Loco Moco" → translated name + (rice with hamburger patty, gravy, and egg)
    - "Chicken Katsu" → translated name + (Japanese-style breaded fried chicken cutlet)
    - "Bibimbap" → translated name + (Korean rice bowl with vegetables and mixed toppings)
    - "Pork Lumpia" → translated name + (Filipino fried rolls filled with seasoned pork)
    - "Teriyaki Chicken" → translated name + (Japanese-style teriyaki chicken)
    
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
