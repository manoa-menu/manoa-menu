export type SdxMenuIds = {
  locationId: string;
  menuId: string;
};

export const SDX_LOCATION_PAGES = {
  gw: 'https://uhm.sodexomyway.com/en-us/locations/gateway-cafe',
  ha: 'https://uhm.sodexomyway.com/en-us/locations/hale-aloha-cafe',
} as const;

const LOCATION_THEN_MENU = /"locationId"\s*:\s*"(\d+)"\s*,\s*"menuId"\s*:\s*"(\d+)"/;
const MENU_THEN_LOCATION = /"menuId"\s*:\s*"(\d+)"\s*,\s*"locationId"\s*:\s*"(\d+)"/;
const API_PATH_IDS = /\/data\/menu\/(\d+)\/(\d+)/;

export function parseSdxMenuIds(html: string): SdxMenuIds | null {
  const locFirst = html.match(LOCATION_THEN_MENU);
  if (locFirst) {
    return { locationId: locFirst[1], menuId: locFirst[2] };
  }

  const menuFirst = html.match(MENU_THEN_LOCATION);
  if (menuFirst) {
    return { locationId: menuFirst[2], menuId: menuFirst[1] };
  }

  return null;
}

export function parseSdxMenuIdsFromApiUrl(url: string): SdxMenuIds | null {
  const match = url.match(API_PATH_IDS);
  if (!match) {
    return null;
  }
  return { locationId: match[1], menuId: match[2] };
}

export function buildSdxMenuApiUrl(ids: SdxMenuIds, templateUrl: string): string {
  const origin = new URL(templateUrl).origin;
  return `${origin}/v0.2/data/menu/${ids.locationId}/${ids.menuId}`;
}

export function sdxMenuApiUrlsMatch(left: string, right: string): boolean {
  const leftIds = parseSdxMenuIdsFromApiUrl(left);
  const rightIds = parseSdxMenuIdsFromApiUrl(right);
  if (leftIds && rightIds) {
    return leftIds.locationId === rightIds.locationId && leftIds.menuId === rightIds.menuId;
  }
  return left.replace(/\/+$/, '') === right.replace(/\/+$/, '');
}

/** Primary first, then extras; duplicate menu IDs are skipped. */
export function uniqueSdxMenuApiUrls(
  ...urls: Array<string | null | undefined>
): string[] {
  const unique: string[] = [];
  urls.forEach((url) => {
    const trimmed = url?.trim();
    if (!trimmed) {
      return;
    }
    if (unique.some((existing) => sdxMenuApiUrlsMatch(existing, trimmed))) {
      return;
    }
    unique.push(trimmed);
  });
  return unique;
}

export async function resolveSdxMenuApiUrl(
  locationPageUrl: string,
  fallbackApiUrl: string,
  fetchHtml: (url: string) => Promise<string> = defaultFetchHtml,
): Promise<string> {
  try {
    const html = await fetchHtml(locationPageUrl);
    const ids = parseSdxMenuIds(html);
    if (!ids) {
      return fallbackApiUrl;
    }
    return buildSdxMenuApiUrl(ids, fallbackApiUrl);
  } catch (error) {
    console.warn('[sdx-menu] Failed to resolve menu IDs from location page', error);
    return fallbackApiUrl;
  }
}

async function defaultFetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch location page: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
