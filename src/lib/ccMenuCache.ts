import { getCCMenu } from './dbActions';
import { isDayMenu } from './ccMenuResponse';

/** A missing or damaged cache must not prevent fetching the source menu. */
export async function readCcMenuCache(week: string, language: string) {
  try {
    const row = await getCCMenu(week, language);
    if (!row || !Array.isArray(row.menu) || !row.menu.length || !row.menu.every(isDayMenu)) return null;
    return row;
  } catch {
    console.warn('[cc-menu] Cache read failed; using the menu source');
    return null;
  }
}
