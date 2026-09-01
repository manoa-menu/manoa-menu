export const MENU_LANGUAGES = ['English', 'Japanese', 'Korean', 'Chinese'] as const;
export type MenuLanguage = (typeof MENU_LANGUAGES)[number];

export const SDX_LOCATIONS = ['gw', 'ha'] as const;
export type SdxLocationParam = (typeof SDX_LOCATIONS)[number];

export function parseMenuLanguage(raw: string | null | undefined): MenuLanguage | null {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const match = MENU_LANGUAGES.find((language) => language.toLowerCase() === trimmed.toLowerCase());
  return match ?? null;
}

export function parseSdxLocation(raw: string | null | undefined): SdxLocationParam | null {
  if (raw == null) {
    return null;
  }
  const value = raw.trim().toLowerCase();
  if (value === 'gw' || value === 'ha') {
    return value;
  }
  return null;
}
