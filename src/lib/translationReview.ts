import { prisma } from '@/lib/prisma';
import {
  persistTranslationToStoredMenus,
  dedupeSdxStringTranslations,
} from '@/lib/sdxTranslationCache';
import { getCurrentWeekDates, getCurrentWeekOf } from '@/lib/dateFunctions';
import {
  classifyTranslationKind,
  collectCcTranslationKinds,
  collectSdxTranslationKinds,
  createTranslationKindCatalog,
  parentDishForSource,
  type TranslationKindCatalog,
} from '@/lib/translationKind';
import {
  collectCcOccurrences,
  collectSdxOccurrences,
  createOccurrenceIndex,
  formatTranslationOccurrences,
  getTranslationOccurrences,
  type TranslationOccurrence,
  type TranslationOccurrenceIndex,
} from '@/lib/translationOccurrences';
import { translationSourceKey } from '@/lib/translationSource';
import type {
  TranslationReviewKind,
  TranslationReviewLanguage,
  TranslationReviewLocation,
  TranslationReviewRow,
  TranslationReviewSort,
  TranslationReviewStatus,
  TranslationStringKind,
} from '@/lib/translationReviewShared';

export {
  TRANSLATION_REVIEW_LANGUAGES,
  parseTranslationKind,
  parseTranslationLanguage,
  parseTranslationLocation,
  parseTranslationSort,
  parseTranslationStatus,
} from '@/lib/translationReviewShared';
export type {
  TranslationReviewKind,
  TranslationReviewLanguage,
  TranslationReviewLocation,
  TranslationReviewRow,
  TranslationReviewSort,
  TranslationReviewStatus,
} from '@/lib/translationReviewShared';

function toReviewRow(row: {
  id: number;
  language: string;
  sourceText: string;
  translatedText: string;
  aiTranslatedText: string;
  isCorrected: boolean;
  correctedAt: Date | null;
  correctedBy: string | null;
  updatedAt: Date;
},
kind: TranslationStringKind,
occurrences: TranslationOccurrence[],
parentDishText: string | null,
): TranslationReviewRow {
  return {
    id: row.id,
    language: row.language,
    kind,
    sourceText: row.sourceText,
    translatedText: row.translatedText,
    aiTranslatedText: row.aiTranslatedText,
    isCorrected: row.isCorrected,
    correctedAt: row.correctedAt?.toISOString() ?? null,
    correctedBy: row.correctedBy,
    updatedAt: row.updatedAt.toISOString(),
    parentDishText,
    occurrences,
    occurrenceLabel: formatTranslationOccurrences(occurrences),
  };
}

type TranslationMenuIndex = {
  catalog: TranslationKindCatalog;
  occurrences: TranslationOccurrenceIndex;
};

let menuIndexCache: { index: TranslationMenuIndex; expiresAt: number } | null = null;

async function loadTranslationMenuIndex(): Promise<TranslationMenuIndex> {
  if (menuIndexCache && menuIndexCache.expiresAt > Date.now()) {
    return menuIndexCache.index;
  }

  const dates = getCurrentWeekDates();

  const [gwMenus, haMenus, ccMenus] = await Promise.all([
    prisma.gatewayMenus.findMany({
      where: { language: 'English', date: { in: dates } },
      select: { date: true, menu: true },
    }),
    prisma.haleAlohaMenus.findMany({
      where: { language: 'English', date: { in: dates } },
      select: { date: true, menu: true },
    }),
    prisma.campusCenterMenus.findMany({
      where: { language: 'English', week_of: getCurrentWeekOf() },
      select: { week_of: true, menu: true },
    }),
  ]);

  const catalog = createTranslationKindCatalog();
  const occurrences = createOccurrenceIndex();
  gwMenus.forEach((row) => {
    collectSdxTranslationKinds(row.menu, catalog);
    collectSdxOccurrences(row.menu, 'GW', row.date, occurrences);
  });
  haMenus.forEach((row) => {
    collectSdxTranslationKinds(row.menu, catalog);
    collectSdxOccurrences(row.menu, 'HA', row.date, occurrences);
  });
  ccMenus.forEach((row) => {
    collectCcTranslationKinds(row.menu, catalog);
    collectCcOccurrences(row.menu, row.week_of, occurrences);
  });

  const index = { catalog, occurrences };
  menuIndexCache = { index, expiresAt: Date.now() + 5 * 60_000 };
  return index;
}

function decorateReviewRow(row: {
  id: number;
  language: string;
  sourceText: string;
  translatedText: string;
  aiTranslatedText: string;
  isCorrected: boolean;
  correctedAt: Date | null;
  correctedBy: string | null;
  updatedAt: Date;
}, index: TranslationMenuIndex): TranslationReviewRow {
  const kind = classifyTranslationKind(row.sourceText, index.catalog);
  return toReviewRow(
    row,
    kind,
    getTranslationOccurrences(index.occurrences, row.sourceText),
    kind === 'description' ? parentDishForSource(row.sourceText, index.catalog) : null,
  );
}

function earliestOccurrenceDate(row: TranslationReviewRow): string {
  let earliest = '';
  row.occurrences.forEach((occurrence) => {
    occurrence.dates.forEach((date) => {
      if (!earliest || date < earliest) {
        earliest = date;
      }
    });
  });
  return earliest || '9999-99-99';
}

const LOCATION_SORT_ORDER = { GW: 0, HA: 1, CC: 2 } as const;

function primaryLocation(row: TranslationReviewRow): 'GW' | 'HA' | 'CC' | null {
  let bestLocation: 'GW' | 'HA' | 'CC' | null = null;
  let bestDate = '';
  row.occurrences.forEach((occurrence) => {
    occurrence.dates.forEach((date) => {
      if (
        bestLocation == null
        || date < bestDate
        || (date === bestDate
          && LOCATION_SORT_ORDER[occurrence.location] < LOCATION_SORT_ORDER[bestLocation])
      ) {
        bestLocation = occurrence.location;
        bestDate = date;
      }
    });
  });
  return bestLocation ?? row.occurrences[0]?.location ?? null;
}

function rowMatchesLocation(
  row: TranslationReviewRow,
  location: TranslationReviewLocation,
): boolean {
  if (location === 'all') {
    return true;
  }
  return row.occurrences.some((occurrence) => occurrence.location === location);
}

function groupSortName(row: TranslationReviewRow): string {
  if (row.kind === 'description' && row.parentDishText) {
    return row.parentDishText;
  }
  return row.sourceText;
}

function compareReviewRows(
  left: TranslationReviewRow,
  right: TranslationReviewRow,
  sort: TranslationReviewSort,
): number {
  if (sort === 'date') {
    const leftPlace = primaryLocation(left);
    const rightPlace = primaryLocation(right);
    const leftRank = leftPlace == null ? 99 : LOCATION_SORT_ORDER[leftPlace];
    const rightRank = rightPlace == null ? 99 : LOCATION_SORT_ORDER[rightPlace];
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const byDate = earliestOccurrenceDate(left).localeCompare(earliestOccurrenceDate(right));
    if (byDate !== 0) {
      return byDate;
    }
  }

  const byName = groupSortName(left).localeCompare(groupSortName(right));
  if (byName !== 0) {
    return byName;
  }

  if (left.kind !== right.kind) {
    return left.kind === 'dish' ? -1 : 1;
  }

  if (left.isCorrected !== right.isCorrected) {
    return left.isCorrected ? 1 : -1;
  }
  return left.sourceText.localeCompare(right.sourceText);
}

type ReviewGroup = {
  sortName: string;
  placeRank: number;
  date: string;
  dish: TranslationReviewRow | null;
  descriptions: TranslationReviewRow[];
};

function buildReviewGroups(rows: TranslationReviewRow[]): ReviewGroup[] {
  const dishes = rows.filter((row) => row.kind === 'dish');
  const descriptions = rows.filter((row) => row.kind === 'description');
  const dishByKey = new Map(dishes.map((row) => [translationSourceKey(row.sourceText), row]));
  const usedDescriptions = new Set<number>();
  const groups: ReviewGroup[] = [];

  dishes.forEach((dish) => {
    const dishKey = translationSourceKey(dish.sourceText);
    const children = descriptions.filter((row) => {
      if (!row.parentDishText) {
        return false;
      }
      return translationSourceKey(row.parentDishText) === dishKey;
    });
    children.forEach((row) => usedDescriptions.add(row.id));
    groups.push({
      sortName: dish.sourceText,
      placeRank: (() => {
        const place = primaryLocation(dish);
        return place == null ? 99 : LOCATION_SORT_ORDER[place];
      })(),
      date: earliestOccurrenceDate(dish),
      dish,
      descriptions: children,
    });
  });

  const orphanParents = new Map<string, TranslationReviewRow[]>();
  descriptions.forEach((row) => {
    if (usedDescriptions.has(row.id)) {
      return;
    }
    if (row.parentDishText && !dishByKey.has(translationSourceKey(row.parentDishText))) {
      const key = translationSourceKey(row.parentDishText);
      const list = orphanParents.get(key) ?? [];
      list.push(row);
      orphanParents.set(key, list);
      return;
    }
    groups.push({
      sortName: row.sourceText,
      placeRank: (() => {
        const place = primaryLocation(row);
        return place == null ? 99 : LOCATION_SORT_ORDER[place];
      })(),
      date: earliestOccurrenceDate(row),
      dish: null,
      descriptions: [row],
    });
  });

  orphanParents.forEach((list) => {
    const parentText = list[0]?.parentDishText ?? list[0]?.sourceText ?? '';
    const anchor = list[0];
    groups.push({
      sortName: parentText,
      placeRank: (() => {
        const place = primaryLocation(anchor);
        return place == null ? 99 : LOCATION_SORT_ORDER[place];
      })(),
      date: earliestOccurrenceDate(anchor),
      dish: null,
      descriptions: list,
    });
  });

  return groups;
}

function flattenReviewGroups(groups: ReviewGroup[]): TranslationReviewRow[] {
  const rows: TranslationReviewRow[] = [];
  groups.forEach((group) => {
    if (group.dish) {
      rows.push(group.dish);
    }
    group.descriptions.forEach((row) => rows.push(row));
  });
  return rows;
}

function sortReviewGroups(groups: ReviewGroup[], sort: TranslationReviewSort): ReviewGroup[] {
  return [...groups].sort((left, right) => {
    if (sort === 'date') {
      if (left.placeRank !== right.placeRank) {
        return left.placeRank - right.placeRank;
      }
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) {
        return byDate;
      }
    }
    const byName = left.sortName.localeCompare(right.sortName);
    if (byName !== 0) {
      return byName;
    }
    return (left.dish?.sourceText ?? '').localeCompare(right.dish?.sourceText ?? '');
  });
}

export async function listTranslationReviews(options: {
  language: TranslationReviewLanguage;
  status: TranslationReviewStatus;
  kind?: TranslationReviewKind;
  location?: TranslationReviewLocation;
  sort?: TranslationReviewSort;
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  rows: TranslationReviewRow[];
  total: number;
  uncorrectedCount: number;
  correctedCount: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50));
  const page = Math.max(1, options.page ?? 1);
  const query = options.query?.trim();
  const kind = options.kind ?? 'all';
  const location = options.location ?? 'all';
  const sort = options.sort ?? 'text';

  try {
    await dedupeSdxStringTranslations();
  } catch (error) {
    console.warn('[translation review] Duplicate cleanup failed', error);
  }

  const languageFilter = { language: options.language };
  const searchFilter = query
    ? {
      OR: [
        { sourceText: { contains: query, mode: 'insensitive' as const } },
        { translatedText: { contains: query, mode: 'insensitive' as const } },
      ],
    }
    : {};

  const [rawRows, index] = await Promise.all([
    prisma.sdxStringTranslation.findMany({
      where: { ...languageFilter, ...searchFilter },
      orderBy: [{ isCorrected: 'asc' }, { sourceText: 'asc' }],
    }),
    loadTranslationMenuIndex(),
  ]);

  const classified = rawRows.map((row) => decorateReviewRow(row, index));
  const uniqueBySource = new Map<string, typeof classified[number]>();
  classified.forEach((row) => {
    const key = translationSourceKey(row.sourceText);
    const existing = uniqueBySource.get(key);
    if (!existing || (row.isCorrected && !existing.isCorrected)) {
      uniqueBySource.set(key, row);
    }
  });
  const uniqueRows = [...uniqueBySource.values()];
  const byLocation = uniqueRows.filter((row) => rowMatchesLocation(row, location));
  const byKind = kind === 'all'
    ? byLocation
    : byLocation.filter((row) => row.kind === kind);
  const uncorrectedCount = byKind.filter((row) => !row.isCorrected).length;
  const correctedCount = byKind.filter((row) => row.isCorrected).length;
  const statusFiltered = options.status === 'all'
    ? byKind
    : byKind.filter((row) => row.isCorrected === (options.status === 'corrected'));

  const visible = kind === 'all'
    ? flattenReviewGroups(sortReviewGroups(buildReviewGroups(statusFiltered), sort))
    : [...statusFiltered].sort((left, right) => compareReviewRows(left, right, sort));
  const total = visible.length;
  const rows = visible.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows,
    total,
    uncorrectedCount,
    correctedCount,
    page,
    pageSize,
  };
}

export async function saveTranslationCorrection(options: {
  id: number;
  translatedText: string;
  correctedBy?: string | null;
}): Promise<TranslationReviewRow> {
  const translatedText = options.translatedText.trim();
  if (!translatedText) {
    throw new Error('Translation cannot be empty.');
  }

  const correctedBy = options.correctedBy?.trim() || null;
  const row = await prisma.sdxStringTranslation.update({
    where: { id: options.id },
    data: {
      translatedText,
      isCorrected: true,
      correctedAt: new Date(),
      correctedBy,
    },
  });

  try {
    await persistTranslationToStoredMenus(row.language, row.sourceText, row.translatedText);
  } catch (error) {
    console.warn('[translation review] Saved correction but failed to patch stored menus', error);
  }

  return decorateReviewRow(row, await loadTranslationMenuIndex());
}

export async function getTranslationReviewRow(id: number): Promise<TranslationReviewRow | null> {
  const row = await prisma.sdxStringTranslation.findUnique({
    where: { id },
  });
  if (!row) {
    return null;
  }
  return decorateReviewRow(row, await loadTranslationMenuIndex());
}

export async function resetTranslationToAi(id: number): Promise<TranslationReviewRow> {
  const existing = await prisma.sdxStringTranslation.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error('Translation not found.');
  }

  const row = await prisma.sdxStringTranslation.update({
    where: { id },
    data: {
      translatedText: existing.aiTranslatedText,
      isCorrected: false,
      correctedAt: null,
      correctedBy: null,
    },
  });

  try {
    await persistTranslationToStoredMenus(row.language, row.sourceText, row.translatedText);
  } catch (error) {
    console.warn('[translation review] Reset translation but failed to patch stored menus', error);
  }

  return decorateReviewRow(row, await loadTranslationMenuIndex());
}
