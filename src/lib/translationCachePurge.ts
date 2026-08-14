import type { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { prisma } from '@/lib/prisma';
import { collectCcTranslatableStrings } from '@/lib/ccTranslation';
import { collectSdxTranslatableStrings } from '@/lib/sdxTranslation';
import { hashSdxSource } from '@/lib/sdxTranslationCache';
import {
  TRANSLATION_REVIEW_LANGUAGES,
  type TranslationReviewLanguage,
} from '@/lib/translationReviewShared';
import {
  TRANSLATION_LOCATIONS,
  isIsoDate,
  shiftIsoDate,
  type TranslationLocation,
} from '@/lib/translationOccurrences';

export type TranslationCachePurgeScope = {
  weekOf: string;
  locations: TranslationLocation[];
  languages: TranslationReviewLanguage[];
};

export type TranslationCachePurgeResult = {
  deletedMenuRows: number;
  deletedStringRows: number;
  matchedEnglishStrings: number;
};

function weekOfForDate(isoDate: string): string | null {
  if (!isIsoDate(isoDate)) {
    return null;
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return shiftIsoDate(isoDate, -date.getUTCDay());
}

function uniqueValues<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

export function parseTranslationCachePurgeScope(value: unknown): TranslationCachePurgeScope | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const body = value as Record<string, unknown>;
  if (!isIsoDate(String(body.weekOf ?? ''))) {
    return null;
  }

  const locations = uniqueValues(
    (Array.isArray(body.locations) ? body.locations : [])
      .filter((location): location is TranslationLocation =>
        TRANSLATION_LOCATIONS.includes(location as TranslationLocation)),
  );
  const languages = uniqueValues(
    (Array.isArray(body.languages) ? body.languages : [])
      .filter((language): language is TranslationReviewLanguage =>
        TRANSLATION_REVIEW_LANGUAGES.includes(language as TranslationReviewLanguage)),
  );

  if (locations.length === 0 || languages.length === 0) {
    return null;
  }

  return {
    weekOf: String(body.weekOf),
    locations,
    languages,
  };
}

export async function listTranslationCacheWeeks(): Promise<string[]> {
  const [gateway, haleAloha, campusCenter] = await Promise.all([
    prisma.gatewayMenus.findMany({
      where: { language: 'English' },
      distinct: ['date'],
      select: { date: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { language: 'English' },
      distinct: ['date'],
      select: { date: true },
    }),
    prisma.campusCenterMenus.findMany({
      where: { language: 'English' },
      distinct: ['week_of'],
      select: { week_of: true },
    }),
  ]);

  const weeks = new Set<string>();
  [...gateway, ...haleAloha].forEach(({ date }) => {
    const weekOf = weekOfForDate(date);
    if (weekOf) {
      weeks.add(weekOf);
    }
  });
  campusCenter.forEach(({ week_of: weekOf }) => {
    if (isIsoDate(weekOf)) {
      weeks.add(weekOf);
    }
  });

  return [...weeks].sort().reverse();
}

export async function purgeTranslationCache(
  scope: TranslationCachePurgeScope,
): Promise<TranslationCachePurgeResult> {
  const dates = Array.from({ length: 7 }, (_, index) => shiftIsoDate(scope.weekOf, index));
  const nextWeekOf = shiftIsoDate(scope.weekOf, 7);
  const includeGateway = scope.locations.includes('GW');
  const includeHaleAloha = scope.locations.includes('HA');
  const includeCampusCenter = scope.locations.includes('CC');

  const [gatewayEnglish, haleAlohaEnglish, campusCenterEnglish] = await Promise.all([
    includeGateway
      ? prisma.gatewayMenus.findMany({
        where: { language: 'English', date: { in: dates } },
        select: { menu: true },
      })
      : [],
    includeHaleAloha
      ? prisma.haleAlohaMenus.findMany({
        where: { language: 'English', date: { in: dates } },
        select: { menu: true },
      })
      : [],
    includeCampusCenter
      ? prisma.campusCenterMenus.findMany({
        where: { language: 'English', week_of: { in: [scope.weekOf, nextWeekOf] } },
        select: { menu: true },
      })
      : [],
  ]);

  const sourceStrings = new Set<string>();
  const collectSdxRows = (rows: Array<{ menu: unknown }>) => {
    const menus = rows
      .map(({ menu }) => menu)
      .filter((menu): menu is FilteredSodexoMeal[] => Array.isArray(menu));
    collectSdxTranslatableStrings(menus).forEach((source) => sourceStrings.add(source));
  };
  collectSdxRows(gatewayEnglish);
  collectSdxRows(haleAlohaEnglish);
  campusCenterEnglish.forEach(({ menu }) => {
    if (Array.isArray(menu)) {
      collectCcTranslatableStrings(menu as unknown as DayMenu[])
        .forEach((source) => sourceStrings.add(source));
    }
  });

  const sourceHashes = [...sourceStrings].map(hashSdxSource);
  const operations = [];

  if (includeGateway) {
    operations.push(prisma.gatewayMenus.deleteMany({
      where: {
        language: { in: scope.languages },
        date: { in: dates },
      },
    }));
  }
  if (includeHaleAloha) {
    operations.push(prisma.haleAlohaMenus.deleteMany({
      where: {
        language: { in: scope.languages },
        date: { in: dates },
      },
    }));
  }
  if (includeCampusCenter) {
    operations.push(prisma.campusCenterMenus.deleteMany({
      where: {
        language: { in: scope.languages },
        week_of: { in: [scope.weekOf, nextWeekOf] },
      },
    }));
  }

  const menuOperationCount = operations.length;
  if (sourceHashes.length > 0) {
    operations.push(prisma.sdxStringTranslation.deleteMany({
      where: {
        language: { in: scope.languages },
        sourceHash: { in: sourceHashes },
      },
    }));
  }

  const results = await prisma.$transaction(operations);
  const deletedMenuRows = results
    .slice(0, menuOperationCount)
    .reduce((total, result) => total + result.count, 0);
  const deletedStringRows = sourceHashes.length > 0
    ? (results[menuOperationCount]?.count ?? 0)
    : 0;

  return {
    deletedMenuRows,
    deletedStringRows,
    matchedEnglishStrings: sourceStrings.size,
  };
}
