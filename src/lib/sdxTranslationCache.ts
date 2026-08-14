import { createHash, randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { getSdxMenu } from '@/lib/dbActions';
import { getCurrentWeekDates, getCurrentWeekOf } from '@/lib/dateFunctions';
import { prisma } from '@/lib/prisma';
import {
  applySdxTranslations,
  buildSdxTranslationMap,
  collectSdxTranslatableStrings,
  extractSdxTranslationPairs,
  mergeSdxTranslations,
  mergeStoredAndCachedTranslations,
} from '@/lib/sdxTranslation';
import { applyCcTranslations, collectCcTranslatableStrings, extractCcTranslationPairs } from '@/lib/ccTranslation';
import { attachCcEnglishSources, attachSdxEnglishNames } from '@/lib/englishSource';
import { DayMenu, FilteredSodexoMeal, Location } from '@/types/menuTypes';
import {
  lookupTranslation,
  setUniqueTranslation,
  uniqueTranslationEntries,
  translationSourceKey,
} from '@/lib/translationSource';

const LOCK_TTL_MS = 90_000;
const LOCK_WAIT_MS = 45_000;
const LOCK_POLL_MS = 800;

const warmedLanguages = new Set<string>();
let dedupedTranslationRows = false;

function hashSource(sourceText: string): string {
  return createHash('sha256').update(translationSourceKey(sourceText), 'utf8').digest('hex');
}

export function hashSdxSource(sourceText: string): string {
  return hashSource(sourceText);
}

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

function recentMenuDates(): string[] {
  return getCurrentWeekDates();
}

async function tryAcquireSdxTranslationLock(language: string, holder: string): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  try {
    await prisma.sdxTranslationLock.create({
      data: { language, holder, expiresAt },
    });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
  }

  const stolen = await prisma.sdxTranslationLock.updateMany({
    where: {
      language,
      expiresAt: { lt: now },
    },
    data: { holder, expiresAt },
  });
  return stolen.count === 1;
}

async function releaseSdxTranslationLock(language: string, holder: string): Promise<void> {
  await prisma.sdxTranslationLock.deleteMany({
    where: { language, holder },
  });
}

/** Serialize SDX translation work per language so Gateway and Hale Aloha share one OpenAI pass. */
export async function withSdxTranslationLock<T>(
  language: string,
  fn: () => Promise<T>,
): Promise<T> {
  const holder = randomUUID();
  const deadline = Date.now() + LOCK_WAIT_MS;
  let acquired = false;

  try {
    while (Date.now() <= deadline) {
      acquired = await tryAcquireSdxTranslationLock(language, holder);
      if (acquired) {
        break;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, LOCK_POLL_MS);
      });
    }
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[SDX translation cache] Lock table missing; translating without lock');
      return fn();
    }
    console.warn('[SDX translation cache] Lock unavailable; translating without lock', error);
    return fn();
  }

  if (!acquired) {
    console.warn(`[SDX translation cache] Proceeding without lock for ${language}`);
    return fn();
  }

  try {
    return await fn();
  } finally {
    try {
      await releaseSdxTranslationLock(language, holder);
    } catch (error) {
      console.warn('[SDX translation cache] Failed to release lock', error);
    }
  }
}

export async function getCachedSdxTranslations(
  language: string,
  sourceStrings: string[],
): Promise<Map<string, string>> {
  const translations = new Map<string, string>();
  if (sourceStrings.length === 0) {
    return translations;
  }

  await dedupeSdxStringTranslations();

  const hashes = [...new Set(sourceStrings.map(hashSource))];
  const rows = await prisma.sdxStringTranslation.findMany({
    where: {
      language,
      sourceHash: { in: hashes },
    },
    select: {
      sourceText: true,
      translatedText: true,
    },
  });

  rows.forEach((row) => {
    if (row.translatedText.trim()) {
      translations.set(row.sourceText, row.translatedText);
      translations.set(translationSourceKey(row.sourceText), row.translatedText);
    }
  });

  sourceStrings.forEach((source) => {
    const translated = lookupTranslation(translations, source);
    if (translated) {
      translations.set(source, translated);
    }
  });

  return translations;
}

export async function saveSdxTranslations(
  language: string,
  translations: Map<string, string>,
): Promise<void> {
  const data = uniqueTranslationEntries(translations)
    .map(([sourceText, translatedText]) => ({
      sourceHash: hashSource(sourceText),
      language,
      sourceText,
      translatedText,
      aiTranslatedText: translatedText,
      isCorrected: false,
    }));

  if (data.length === 0) {
    return;
  }

  await dedupeSdxStringTranslations();

  await prisma.sdxStringTranslation.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function dedupeSdxStringTranslations(): Promise<number> {
  if (dedupedTranslationRows) {
    return 0;
  }

  const rows = await prisma.sdxStringTranslation.findMany({
    orderBy: [{ isCorrected: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  });

  const groups = new Map<string, typeof rows>();
  rows.forEach((row) => {
    const key = `${row.language}::${hashSource(row.sourceText)}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  });

  let removed = 0;
  await Promise.all([...groups.values()].map(async (group) => {
    const [winner, ...losers] = group;
    if (losers.length > 0) {
      await prisma.sdxStringTranslation.deleteMany({
        where: { id: { in: losers.map((row) => row.id) } },
      });
      removed += losers.length;
    }

    const sourceText = winner.sourceText.replace(/\s+/g, ' ').trim();
    const sourceHash = hashSource(sourceText);
    if (winner.sourceText !== sourceText || winner.sourceHash !== sourceHash) {
      await prisma.sdxStringTranslation.update({
        where: { id: winner.id },
        data: { sourceText, sourceHash },
      });
    }
  }));

  dedupedTranslationRows = true;
  if (removed > 0) {
    console.log(`[SDX translation cache] Removed ${removed} duplicate string(s)`);
  }
  return removed;
}

function menuByDate(
  rows: Array<{ date: string; menu: unknown }>,
): Map<string, unknown> {
  const menus = new Map<string, unknown>();
  rows.forEach((row) => {
    if (!menus.has(row.date)) {
      menus.set(row.date, row.menu);
    }
  });
  return menus;
}

function collectPairsFromLocation(
  englishByDate: Map<string, unknown>,
  translatedByDate: Map<string, unknown>,
  translations: Map<string, string>,
): void {
  englishByDate.forEach((englishMenu, date) => {
    const translatedMenu = translatedByDate.get(date);
    if (!translatedMenu) {
      return;
    }
    extractSdxTranslationPairs(englishMenu, translatedMenu).forEach(([source, translated]) => {
      setUniqueTranslation(translations, source, translated);
    });
  });
}

async function backfillSdxTranslationCache(language: string): Promise<number> {
  const dates = recentMenuDates();
  const dateFilter = { date: { in: dates } };
  const translations = new Map<string, string>();

  const [gwEnglish, gwTranslated, haEnglish, haTranslated] = await Promise.all([
    prisma.gatewayMenus.findMany({
      where: { ...dateFilter, language: 'English' },
      select: { date: true, menu: true },
    }),
    prisma.gatewayMenus.findMany({
      where: { ...dateFilter, language },
      select: { date: true, menu: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { ...dateFilter, language: 'English' },
      select: { date: true, menu: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { ...dateFilter, language },
      select: { date: true, menu: true },
    }),
  ]);

  collectPairsFromLocation(menuByDate(gwEnglish), menuByDate(gwTranslated), translations);
  collectPairsFromLocation(menuByDate(haEnglish), menuByDate(haTranslated), translations);

  const weekFilter = { week_of: getCurrentWeekOf() };
  const [ccEnglish, ccTranslated] = await Promise.all([
    prisma.campusCenterMenus.findMany({
      where: { ...weekFilter, language: 'English' },
      select: { week_of: true, menu: true },
    }),
    prisma.campusCenterMenus.findMany({
      where: { ...weekFilter, language },
      select: { week_of: true, menu: true },
    }),
  ]);
  const ccTranslatedByWeek = new Map(ccTranslated.map((row) => [row.week_of, row.menu]));
  ccEnglish.forEach((row) => {
    const translatedMenu = ccTranslatedByWeek.get(row.week_of);
    if (!translatedMenu) {
      return;
    }
    extractCcTranslationPairs(row.menu, translatedMenu).forEach(([source, translated]) => {
      setUniqueTranslation(translations, source, translated);
    });
  });

  await saveSdxTranslations(language, translations);
  console.log(
    `[SDX translation cache] Backfilled ${translations.size} strings for ${language} `
    + `from stored menus`,
  );
  return translations.size;
}

/** Harvest this week's stored English/translated menus into the string cache. */
export async function ensureSdxTranslationCacheBackfilled(language: string): Promise<void> {
  if (language.toLowerCase() === 'english' || warmedLanguages.has(language)) {
    return;
  }

  try {
    await dedupeSdxStringTranslations();
    await backfillSdxTranslationCache(language);
    warmedLanguages.add(language);
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[SDX translation cache] Cache table missing; skipping backfill');
      return;
    }
    console.warn('[SDX translation cache] Backfill failed', error);
  }
}

export async function translateSdxStringsCached(
  language: string,
  sourceStrings: string[],
  translateMissing: (missing: string[]) => Promise<string[]>,
): Promise<string[]> {
  if (sourceStrings.length === 0) {
    return [];
  }

  let cached: Map<string, string>;
  try {
    cached = await getCachedSdxTranslations(language, sourceStrings);
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[SDX translation cache] Cache table missing; translating all strings');
    } else {
      console.warn('[SDX translation cache] Cache lookup failed; translating all strings', error);
    }
    return translateMissing(sourceStrings);
  }

  const missing = sourceStrings.filter((source) => {
    const translated = cached.get(source);
    return translated == null || !translated.trim();
  });

  console.log(
    `[SDX translation cache] language=${language}, total=${sourceStrings.length}, `
    + `cached=${sourceStrings.length - missing.length}, missing=${missing.length}`,
  );

  if (missing.length === 0) {
    return mergeSdxTranslations(sourceStrings, cached, [], []);
  }

  const fresh = await translateMissing(missing);
  const freshMap = buildSdxTranslationMap(missing, fresh);
  try {
    await saveSdxTranslations(language, freshMap);
  } catch (error) {
    console.warn('[SDX translation cache] Failed to save translations', error);
  }
  freshMap.forEach((translated, source) => {
    if (translated.trim()) {
      cached.set(source, translated);
    }
  });

  return mergeSdxTranslations(sourceStrings, cached, [], []);
}

export async function refreshPendingSdxDays<T extends {
  date: string;
  meals: FilteredSodexoMeal[];
  englishMenu?: FilteredSodexoMeal[];
}>(
  days: T[],
  language: string,
  location: Location,
): Promise<T[]> {
  await Promise.all(days.map(async (day) => {
    const cachedMenu = await getSdxMenu(day.date, language, location);
    const dayMenu = cachedMenu
      ? (cachedMenu.menu as unknown as FilteredSodexoMeal[]) || []
      : [];
    if (dayMenu.length > 0) {
      day.meals = dayMenu;
    }
  }));

  return days.filter((day) => day.meals.length === 0 && (day.englishMenu?.length ?? 0) > 0);
}

export async function overlaySdxMenusWithCorrections<T extends {
  date: string;
  meals: FilteredSodexoMeal[];
  englishMenu?: FilteredSodexoMeal[];
}>(
  days: T[],
  language: string,
  location: Location,
): Promise<void> {
  if (language.toLowerCase() === 'english') {
    return;
  }

  const overlayDays = days.filter((day) => day.meals.length > 0);
  if (overlayDays.length === 0) {
    return;
  }

  const withEnglish = await Promise.all(overlayDays.map(async (day) => {
    if (day.englishMenu && day.englishMenu.length > 0) {
      return { day, english: day.englishMenu };
    }
    const englishRow = await getSdxMenu(day.date, 'English', location);
    const english = englishRow
      ? (englishRow.menu as unknown as FilteredSodexoMeal[]) || []
      : [];
    return { day, english };
  }));

  try {
    const uniqueStrings = collectSdxTranslatableStrings(
      withEnglish.map(({ english }) => english).filter((menu) => menu.length > 0),
    );
    const table = await getCachedSdxTranslations(language, uniqueStrings);

    withEnglish.forEach(({ day, english }) => {
      if (english.length === 0) {
        return;
      }
      const merged = mergeStoredAndCachedTranslations(
        extractSdxTranslationPairs(english, day.meals),
        table,
      );
      day.meals = applySdxTranslations(english, merged);
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn('[SDX translation cache] Overlay failed; serving stored menus', error);
    }
  }

  withEnglish.forEach(({ day, english }) => {
    if (english.length > 0) {
      day.meals = attachSdxEnglishNames(day.meals, english);
    }
  });
}

export async function overlayCcMenuWithCorrections(
  englishMenu: DayMenu[],
  translatedMenu: DayMenu[],
  language: string,
): Promise<DayMenu[]> {
  if (language.toLowerCase() === 'english' || englishMenu.length === 0) {
    return translatedMenu;
  }

  let next = translatedMenu;
  try {
    const uniqueStrings = collectCcTranslatableStrings(englishMenu);
    const table = await getCachedSdxTranslations(language, uniqueStrings);
    const merged = mergeStoredAndCachedTranslations(
      extractCcTranslationPairs(englishMenu, translatedMenu),
      table,
    );
    next = applyCcTranslations(englishMenu, merged);
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn('[SDX translation cache] CC overlay failed; serving stored menu', error);
    }
  }

  return attachCcEnglishSources(next, englishMenu);
}

/** Write a correction into stored weekly menus so current and later weeks stay in sync. */
export async function persistTranslationToStoredMenus(
  language: string,
  sourceText: string,
  translatedText: string,
): Promise<void> {
  const correction = new Map([[sourceText, translatedText]]);

  const [gwTranslated, gwEnglish, haTranslated, haEnglish, ccTranslated, ccEnglish] = await Promise.all([
    prisma.gatewayMenus.findMany({
      where: { language },
      select: { id: true, date: true, menu: true },
    }),
    prisma.gatewayMenus.findMany({
      where: { language: 'English' },
      select: { date: true, menu: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { language },
      select: { id: true, date: true, menu: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { language: 'English' },
      select: { date: true, menu: true },
    }),
    prisma.campusCenterMenus.findMany({
      where: { language },
      select: { id: true, week_of: true, menu: true },
    }),
    prisma.campusCenterMenus.findMany({
      where: { language: 'English' },
      select: { week_of: true, menu: true },
    }),
  ]);

  const patchSdx = async (
    translatedRows: Array<{ id: number; date: string; menu: unknown }>,
    englishByDate: Map<string, unknown>,
    updateMenu: (id: number, menu: Prisma.InputJsonValue) => Promise<unknown>,
  ) => {
    await Promise.all(translatedRows.map(async (row) => {
      const english = englishByDate.get(row.date);
      if (!Array.isArray(english)) {
        return;
      }
      const current = (Array.isArray(row.menu) ? row.menu : []) as FilteredSodexoMeal[];
      const next = applySdxTranslations(
        english as FilteredSodexoMeal[],
        mergeStoredAndCachedTranslations(
          extractSdxTranslationPairs(english, current),
          correction,
        ),
      );
      if (JSON.stringify(current) === JSON.stringify(next)) {
        return;
      }
      await updateMenu(row.id, next as unknown as Prisma.InputJsonValue);
    }));
  };

  await Promise.all([
    patchSdx(gwTranslated, menuByDate(gwEnglish), (id, menu) => prisma.gatewayMenus.update({
      where: { id },
      data: { menu },
    })),
    patchSdx(haTranslated, menuByDate(haEnglish), (id, menu) => prisma.haleAlohaMenus.update({
      where: { id },
      data: { menu },
    })),
  ]);

  const ccEnglishByWeek = new Map(ccEnglish.map((row) => [row.week_of, row.menu]));
  await Promise.all(ccTranslated.map(async (row) => {
    const english = ccEnglishByWeek.get(row.week_of);
    if (!english || !Array.isArray(english)) {
      return;
    }
    const englishDays = english as unknown as DayMenu[];
    const current = (Array.isArray(row.menu) ? row.menu : []) as unknown as DayMenu[];
    const patched = applyCcTranslations(
      englishDays,
      mergeStoredAndCachedTranslations(
        extractCcTranslationPairs(englishDays, current),
        correction,
      ),
    );
    if (JSON.stringify(current) === JSON.stringify(patched)) {
      return;
    }
    await prisma.campusCenterMenus.update({
      where: { id: row.id },
      data: { menu: patched as unknown as Prisma.InputJsonValue },
    });
  }));
}
