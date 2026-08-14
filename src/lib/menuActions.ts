
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
  `You are translating a university cafeteria menu from English into ${translateLanguage}.

Your highest priority is that an average native speaker of ${translateLanguage}
can quickly understand what each dish is with minimal confusion.

Translations should be:

1. Natural and immediately understandable to native speakers
2. Appropriate for a cafeteria or restaurant menu
3. Concise
4. Faithful to the intended dish
5. Consistent throughout the menu

A perfectly literal translation is LESS important than making the food
understandable, as long as you do not invent important details.

INPUT / OUTPUT

You will receive a JSON object with:

* "expectedCount"
* "strings": an array of English menu strings

Return ONLY:

{
"translations": [...]
}

translations MUST contain EXACTLY expectedCount entries.

Each input string must correspond to exactly one translated string in the
same order.

Never skip, merge, split, reorder, or add entries.

TRANSLATION APPROACH

Translate menu items the way they would naturally appear on a menu written
for native speakers of ${translateLanguage}.

Do NOT simply transliterate every foreign food term if doing so would leave
the reader confused.

Do NOT over-translate internationally familiar foods that native speakers
would normally recognize by their established name.

CLARITY IS THE PRIORITY

Ask yourself:

"Would an average native speaker understand roughly what food they will
receive from this translated name?"

If YES:
Use the natural translated dish name with no explanation.

If NO:
Add a short clarification in parentheses.

A clarification may explain:

* the general type of dish
* the main protein or ingredient
* the general sauce or flavor
* the cuisine or cultural origin
* an unfamiliar cooking style

The purpose is NOT to fully define the dish.
The purpose is only to remove likely confusion.

REASONABLE INFERENCE

You MAY use well-established culinary knowledge to clarify a commonly known
dish or cooking term when necessary for understanding.

For example, an unfamiliar named dish may be described generally as:

* a Filipino-style braised chicken dish
* a Mexican-style pork dish with green chili sauce
* an egg-coated pan-cooked fish preparation

However, distinguish between GENERAL understanding and SPECIFIC ingredients.

Good:
"Filipino-style braised chicken"

Too specific unless confirmed by the source:
"Chicken braised with soy sauce, vinegar, garlic, bay leaves, and pepper"

Good:
"Hawaiian-style rice bowl dish"

Too specific unless confirmed:
"Rice topped with a chicken patty, fried egg, and brown gravy"

Never introduce a specific ingredient, topping, side, or preparation detail
unless:

1. it appears in the source, OR
2. it is essential to identifying the established dish and is highly
   characteristic of that dish.

When uncertain, use a broader description.

PARENTHESES

Parenthetical explanations are encouraged when they genuinely help a native
speaker understand an unfamiliar dish.

Use parentheses when:

* the dish is strongly associated with another country's cuisine
* the English name would normally remain transliterated
* the cooking term is uncommon in ${translateLanguage}
* the name alone does not tell the reader what kind of food it is
* a short explanation would significantly reduce confusion

Do NOT use parentheses when:

* the dish is already easily understandable
* the translated name already communicates the important ingredients
* the term is commonly recognized by native speakers
* the explanation merely repeats the translated name

Keep explanations short, ideally one brief phrase.

Examples of the desired level of explanation:

"Chicken Adobo"
→ "[natural transliteration] (Filipino-style braised chicken)"

"Pork Chili Verde"
→ "[natural name] (Mexican-style pork with green chili sauce)"

"Beef Lasagna"
→ natural translation only; no explanation needed

"Chicken Caesar Salad"
→ natural translation only; no explanation needed

For established regional dishes, you may include the dish's widely recognized
basic structure when this is necessary for native-speaker understanding,
even if every component is not explicitly written in the English menu name.

Example:
"Loco Moco" may be clarified as a Hawaiian-style rice dish with a patty,
egg, and gravy.

Keep this description general. Do not add optional toppings, exact seasonings,
or restaurant-specific ingredients that cannot be safely assumed.

MENU TERMINOLOGY

Category and product labels should sound natural in ${translateLanguage}.
Do not blindly translate them word-for-word.

Examples include:

* Plate Lunch
* Grab and Go
* Mixed Plate
* Mini or Bowl
* Value Bowl

For repeated phrases, use the same translation throughout the menu.

FOREIGN DISH NAMES

Use the form that a native speaker would most naturally encounter.

Depending on the term, this may mean:

* an established native-language name
* transliteration
* transliteration plus a short explanation
* a descriptive translation

Choose whichever form creates the least confusion.

Common internationally recognizable terms generally do not require
explanations, such as:
Caesar
BLT
Lasagna
Buffalo Chicken
Katsu
Curry
Aioli
Bruschetta

Less familiar regional or culinary terms may need clarification, such as:
Adobo
Chili Verde
Loco Moco
Doré
Hoisin
Swai

Judge familiarity from the perspective of an average native speaker of
${translateLanguage}, not an English-speaking food enthusiast.

SOURCE INCONSISTENCIES

Preserve the meaning of each source string independently.

Do not silently change one protein into another or "correct" an apparent
cafeteria typo.

If the source says:
"Mixed Plate: Chicken Katsu and Mahi"

translate Chicken Katsu and Mahi even if another item nearby uses Swai.

STYLE

Use concise menu language.

Prefer:
[dish] + [sauce / accompaniment]

Avoid:

* full explanatory sentences
* dictionary-style definitions
* excessive cultural notes
* marketing language
* unnatural literal English syntax

The translated menu should feel as though it was written for native speakers,
not translated for language learners.

FINAL CHECK

Before responding, silently verify:

* translations.length === expectedCount
* every input has exactly one output
* order is identical
* native speakers can reasonably understand each dish
* unfamiliar dishes have brief explanations where helpful
* familiar dishes are not over-explained
* no unnecessarily specific ingredients were invented
* repeated terminology is consistent

Return ONLY valid JSON with the "translations" array.
\n`
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
