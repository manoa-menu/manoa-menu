export const TRANSLATION_REVIEW_LANGUAGES = ['Japanese', 'Korean', 'Chinese'] as const;
export const TRANSLATION_REVIEW_LOCATIONS = ['GW', 'HA', 'CC'] as const;
export type TranslationReviewLanguage = (typeof TRANSLATION_REVIEW_LANGUAGES)[number];
export type TranslationReviewLocation = 'all' | (typeof TRANSLATION_REVIEW_LOCATIONS)[number];
export type TranslationReviewStatus = 'all' | 'uncorrected' | 'corrected';
export type TranslationReviewKind = 'all' | 'dish' | 'description';
export type TranslationReviewSort = 'text' | 'date';
export type TranslationStringKind = 'dish' | 'description';

export type TranslationReviewerPublic = {
  name: string;
  languages: TranslationReviewLanguage[];
};

export type TranslationReviewRow = {
  id: number;
  language: string;
  kind: TranslationStringKind;
  sourceText: string;
  translatedText: string;
  aiTranslatedText: string;
  isCorrected: boolean;
  correctedAt: string | null;
  correctedBy: string | null;
  updatedAt: string;
  parentDishText: string | null;
  occurrences: Array<{
    location: 'GW' | 'HA' | 'CC';
    dates: string[];
  }>;
  occurrenceLabel: string;
};

export function parseTranslationLanguage(value: string | null | undefined): TranslationReviewLanguage | null {
  if (!value) {
    return null;
  }
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return TRANSLATION_REVIEW_LANGUAGES.find((language) => language === normalized) ?? null;
}

export function parseTranslationStatus(value: string | null | undefined): TranslationReviewStatus {
  if (value === 'corrected' || value === 'uncorrected' || value === 'all') {
    return value;
  }
  return 'uncorrected';
}

export function parseTranslationKind(value: string | null | undefined): TranslationReviewKind {
  if (value === 'dish' || value === 'description' || value === 'all') {
    return value;
  }
  return 'all';
}

export function parseTranslationSort(value: string | null | undefined): TranslationReviewSort {
  if (value === 'date' || value === 'text') {
    return value;
  }
  return 'text';
}

export function parseTranslationLocation(value: string | null | undefined): TranslationReviewLocation {
  if (!value) {
    return 'all';
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ALL') {
    return 'all';
  }
  return TRANSLATION_REVIEW_LOCATIONS.find((location) => location === normalized) ?? 'all';
}
