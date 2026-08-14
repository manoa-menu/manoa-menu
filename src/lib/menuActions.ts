
import scrapeCCUrl from '@/lib/scrapeCCUrl';
import { getCCMenu, insertCCMenu } from '@/lib/dbActions';
import { Location, DayMenu, MenuResponse } from '@/types/menuTypes';
import { parseCCMenuFromPDF, translateCcStrings } from '../app/utils/api/openai';
import { getCurrentWeekOf, getNextWeekOf } from './dateFunctions';
import { applyCcTranslations, collectCcTranslatableStrings } from './ccTranslation';
import { attachCcEnglishSources } from './englishSource';
import jpManualReplace from './manualTranslate';
import { buildSdxTranslationMap } from './sdxTranslation';
import {
  ensureSdxTranslationCacheBackfilled,
  overlayCcMenuWithCorrections,
  translateSdxStringsCached,
  withSdxTranslationLock,
} from './sdxTranslationCache';

const getCcTranslationPrompt = (translateLanguage: string): string => (
  `You are translating a cafeteria menu into ${translateLanguage}.

INPUT/OUTPUT
- You will receive a JSON object with "expectedCount" and a "strings" array of English menu text.
- Return JSON with a "translations" array of EXACTLY expectedCount entries, in the same order.
- translations.length MUST equal strings.length. Never skip, merge, or drop an entry.
- Each entry is the ${translateLanguage} translation of the corresponding input string.

OUTPUT RULES
1) Preserve ordering exactly. Do not add, remove, merge, or invent strings.
2) Translate every string into natural ${translateLanguage}.
   - Group/category names: do not translate word-for-word. Use a natural equivalent
     category name in ${translateLanguage}.
3) Parentheses notes are OPTIONAL and must be NECESSARY.
   - Only add a short explanation in parentheses when the dish would still be
     unclear to an average native speaker of ${translateLanguage} AFTER
     translation.
   - If the translated name already clearly tells what it is, DO NOT add
     parentheses.

WHEN TO ADD PARENTHESES
A) The item is culturally specific OR uses an unfamiliar dish name OR a
   brand/place name OR a cooking style that many people in
   ${translateLanguage} would not recognize, AND
B) The translation alone does not reveal the main ingredients or what kind
   of dish it is, AND
C) A one-phrase clarification would reduce confusion.

WHEN NOT TO ADD PARENTHESES
- If the translated name already makes the dish obvious.
- If it is just a normal combination of common ingredients and cooking methods.
- If the item name contains the main ingredient and form.

STYLE FOR PARENTHESES (if needed)
- Keep it to 6 to 12 words in ${translateLanguage}.
- Explain what it is using ingredients or dish type, not extra marketing.

SPECIAL CASES
- Keep proper nouns as-is when appropriate and optionally explain ONLY if needed.

Return ONLY the JSON object with the translations array.\n`
);

async function finalizeCcMenu(
  englishMenu: DayMenu[],
  translatedMenu: DayMenu[],
  language: string,
): Promise<DayMenu[]> {
  let next = await overlayCcMenuWithCorrections(englishMenu, translatedMenu, language);
  if (language === 'Japanese') {
    next = jpManualReplace({ weekOne: next, weekTwo: [] }).weekOne;
    // Manual replace rebuilds day objects; re-attach English underlines.
    next = attachCcEnglishSources(next, englishMenu);
  }
  return next;
}

async function getCheckCCMenu(language: string): Promise<DayMenu[]> {
  try {
    console.log(`Fetching menu for language: ${language}`);

    const currentWeekOf = getCurrentWeekOf();
    const nextWeekOf = getNextWeekOf();

    if (language !== 'English') {
      await ensureSdxTranslationCacheBackfilled(language);
      const existingLanguageMenu = await getCCMenu(currentWeekOf, language);
      if (existingLanguageMenu) {
        const existingLanguageMenuParsed = existingLanguageMenu.menu as unknown as DayMenu[];
        if (existingLanguageMenuParsed.length > 0) {
          console.log(`Returning cached ${language} menu for ${currentWeekOf}`);
          const englishWeekOneRow = await getCCMenu(currentWeekOf, 'English');
          const englishWeekOne = englishWeekOneRow
            ? englishWeekOneRow.menu as unknown as DayMenu[]
            : [];
          if (englishWeekOne.length > 0) {
            return finalizeCcMenu(englishWeekOne, existingLanguageMenuParsed, language);
          }
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

    return withSdxTranslationLock(language, async () => {
      const existingDuringLock = await getCCMenu(currentWeekOf, language);
      if (existingDuringLock) {
        const existingMenu = existingDuringLock.menu as unknown as DayMenu[];
        if (existingMenu.length > 0) {
          console.log(`Another request already translated ${language} CC for ${currentWeekOf}`);
          return finalizeCcMenu(englishMenuFromDb.weekOne, existingMenu, language);
        }
      }

      const englishMenus = [
        ...englishMenuFromDb.weekOne,
        ...(englishMenuFromDb.weekTwo ?? []),
      ];
      const uniqueStrings = collectCcTranslatableStrings(englishMenus);

      console.log(
        `Translating ${uniqueStrings.length} unique CC strings into ${language}`,
      );

      const translatedStrings = await translateSdxStringsCached(
        language,
        uniqueStrings,
        (missing) => translateCcStrings(
          getCcTranslationPrompt(language),
          missing,
          language,
        ),
      );
      const translationMap = buildSdxTranslationMap(uniqueStrings, translatedStrings);

      let weekOne = applyCcTranslations(englishMenuFromDb.weekOne, translationMap);
      let weekTwo = applyCcTranslations(englishMenuFromDb.weekTwo ?? [], translationMap);

      if (language === 'Japanese') {
        const replaced = jpManualReplace({ weekOne, weekTwo });
        weekOne = replaced.weekOne;
        weekTwo = replaced.weekTwo ?? [];
      }

      await insertCCMenu(weekOne, Location.CAMPUS_CENTER, language, currentWeekOf);
      if (weekTwo.length > 0) {
        await insertCCMenu(weekTwo, Location.CAMPUS_CENTER, language, nextWeekOf);
      }
      console.log(`Inserted ${language} CC menu into DB for ${currentWeekOf}`);

      return finalizeCcMenu(englishMenuFromDb.weekOne, weekOne, language);
    });
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
