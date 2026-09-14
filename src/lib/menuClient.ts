import type { DayMenu, SdxAPIResponse } from '@/types/menuTypes';
import { isDayMenu } from './ccMenuResponse';
import { parseSdxMeals } from './sdxMenuSource';
import { readUpstream } from './upstreamFetch';
import { validCalendarDate } from './menuDateRange';

export type MenuNotice = 'unavailable' | 'english-fallback' | 'partial' | null;

export function validateSdxWeek(value: unknown): SdxAPIResponse[] {
  if (!Array.isArray(value)) throw new Error('Invalid weekly menu response');
  const seen = new Set<string>();
  return value.map(day => {
    if (!day || typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)
      || seen.has(day.date)) throw new Error('Invalid menu day');
    const [year, month, date] = day.date.split('-').map(Number);
    if (!validCalendarDate(year, month - 1, date)) throw new Error('Invalid calendar date');
    seen.add(day.date);
    return { date: day.date, meals: parseSdxMeals(day.meals),
      ...(day.status === 'unavailable' || day.status === 'english-fallback' ? { status: day.status } : {}) };
  });
}

export async function requestMenu(url: string, kind: 'cc' | 'sdx', signal: AbortSignal) {
  return readUpstream(url, async response => {
    const data: unknown = await response.json();
    if (kind === 'cc') {
      if (!Array.isArray(data) || !data.every(isDayMenu)) throw new Error('Invalid Campus Center menu');
      return { kind: 'cc' as const, menu: data as DayMenu[],
        notice: response.headers.get('X-Menu-Language') === 'English' ? 'english-fallback' as const : null };
    }
    const menu = validateSdxWeek(data);
    const notice: MenuNotice = menu.some(day => day.status === 'unavailable') ? 'partial'
      : menu.some(day => day.status === 'english-fallback') ? 'english-fallback' : null;
    return { kind: 'sdx' as const, menu, notice };
  }, { signal }, { timeoutMs: 185_000, attempts: 2 });
}

export const menuNoticeText: Record<string, Record<Exclude<MenuNotice, null> | 'retry', string>> = {
  English: {
    unavailable: 'We couldn’t load this menu. Please try again.',
    partial: 'Some days couldn’t be loaded. Available menus are shown below.',
    'english-fallback': 'Some translations are unavailable. English menu items are shown where needed.',
    retry: 'Try again',
  },
  Japanese: {
    unavailable: 'メニューを読み込めませんでした。もう一度お試しください。',
    partial: '一部の日のメニューを読み込めませんでした。取得できたメニューを表示しています。',
    'english-fallback': '一部の翻訳を利用できないため、該当する料理を英語で表示しています。',
    retry: '再試行',
  },
  Korean: {
    unavailable: '메뉴를 불러오지 못했습니다. 다시 시도해 주세요.',
    partial: '일부 날짜의 메뉴를 불러오지 못했습니다. 불러온 메뉴를 표시합니다.',
    'english-fallback': '일부 번역을 사용할 수 없어 해당 메뉴를 영어로 표시합니다.',
    retry: '다시 시도',
  },
  Chinese: {
    unavailable: '无法加载菜单，请重试。',
    partial: '部分日期的菜单无法加载，以下显示可用菜单。',
    'english-fallback': '部分翻译暂时不可用，相关菜品将以英语显示。',
    retry: '重试',
  },
};
