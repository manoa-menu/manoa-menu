export function normalizeTranslationSource(text: string | null | undefined): string {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

export function translationSourceKey(text: string): string {
  return normalizeTranslationSource(text).toLowerCase();
}

export function lookupTranslation(
  translations: Map<string, string>,
  value: string,
): string | undefined {
  const exact = translations.get(value);
  if (exact != null && exact.trim()) {
    return exact;
  }
  const normalized = normalizeTranslationSource(value);
  if (normalized && normalized !== value) {
    const byNormalized = translations.get(normalized);
    if (byNormalized != null && byNormalized.trim()) {
      return byNormalized;
    }
  }
  const key = translationSourceKey(value);
  if (!key) {
    return undefined;
  }
  const byKey = translations.get(key);
  if (byKey != null && byKey.trim()) {
    return byKey;
  }
  for (const [source, translated] of translations) {
    if (translationSourceKey(source) === key && translated.trim()) {
      return translated;
    }
  }
  return undefined;
}

export function setUniqueTranslation(
  translations: Map<string, string>,
  sourceText: string,
  translatedText: string,
  overwrite = false,
): void {
  const source = normalizeTranslationSource(sourceText);
  const translated = translatedText.trim();
  if (!source || !translated) {
    return;
  }
  const key = translationSourceKey(source);
  for (const existing of [...translations.keys()]) {
    if (translationSourceKey(existing) === key) {
      if (!overwrite) {
        return;
      }
      translations.delete(existing);
    }
  }
  translations.set(source, translated);
}

export function uniqueTranslationEntries(
  translations: Iterable<[string, string]>,
): Array<[string, string]> {
  const unique = new Map<string, [string, string]>();
  for (const [sourceText, translatedText] of translations) {
    const source = normalizeTranslationSource(sourceText);
    const translated = translatedText.trim();
    if (!source || !translated) {
      continue;
    }
    const key = translationSourceKey(source);
    if (!unique.has(key)) {
      unique.set(key, [source, translated]);
    }
  }
  return [...unique.values()];
}
