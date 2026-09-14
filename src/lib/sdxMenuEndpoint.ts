import { fetchUpstreamText } from './upstreamFetch';

export type SdxMenuIds = {
  locationId: string;
  menuId: string;
};

export const SDX_LOCATION_PAGES = {
  gw: 'https://uhm.sodexomyway.com/en-us/locations/gateway-cafe',
  ha: 'https://uhm.sodexomyway.com/en-us/locations/hale-aloha-cafe',
} as const;

const API_PATH_IDS = /\/data\/menu\/(\d+)\/(\d+)(?=[/?#"\s]|$)/;

export function parseSdxMenuIds(html: string): SdxMenuIds | null {
  const decoded = html.replace(/\\"/g, '"').replace(/&quot;/g, '"').replace(/\\\//g, '/');
  // Keep both IDs in the same object so unrelated page metadata cannot be paired.
  for (const match of decoded.matchAll(/\{[^{}]*\}/g)) {
    const location = match[0].match(/"locationId"\s*:\s*"?(\d+)"?(?=\s*[,}])/);
    const menu = match[0].match(/"menuId"\s*:\s*"?(\d+)"?(?=\s*[,}])/);
    if (location && menu) return { locationId: location[1], menuId: menu[1] };
  }
  const path = decoded.match(API_PATH_IDS);
  return path ? { locationId: path[1], menuId: path[2] } : null;
}

export function parseSdxMenuIdsFromApiUrl(url: string): SdxMenuIds | null {
  const match = url.match(API_PATH_IDS);
  if (!match) {
    return null;
  }
  return { locationId: match[1], menuId: match[2] };
}

export function buildSdxMenuApiUrl(ids: SdxMenuIds, templateUrl: string): string {
  const url = new URL(templateUrl);
  url.pathname = url.pathname.replace(/\/data\/menu\/\d+\/\d+\/?$/,
    `/data/menu/${ids.locationId}/${ids.menuId}`);
  return url.toString();
}

export function sdxMenuApiUrlsMatch(left: string, right: string): boolean {
  try {
    const a = new URL(left);
    const b = new URL(right);
    return a.origin === b.origin && a.pathname.replace(/\/+$/, '') === b.pathname.replace(/\/+$/, '')
      && a.search === b.search;
  } catch {
    return left.replace(/\/+$/, '') === right.replace(/\/+$/, '');
  }
}

/** Primary first, then extras; preserve distinct hosts, API versions, and query parameters. */
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
  return fetchUpstreamText(url);
}
