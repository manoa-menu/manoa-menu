import { formatDateParts, getTodayInHST } from '@/lib/ccMenuParsing';

/** Calendar YYYY-MM-DD → UTC noon Date (stable weekday math, no local TZ shift). */
const utcNoonFromIsoDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

const formatUtcDate = (date: Date): string => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getCurrentWeekOf = (): string => getCurrentWeekDates()[0];

export const getNextWeekOf = (): string => {
  const sunday = utcNoonFromIsoDate(getCurrentWeekDates()[0]);
  sunday.setUTCDate(sunday.getUTCDate() + 7);
  return formatUtcDate(sunday);
};

export const getCurrentDayOf = (): string => formatDateParts(getTodayInHST());

export const getCurrentWeekDates = (): string[] => {
  const todayIso = getCurrentDayOf();
  const today = utcNoonFromIsoDate(todayIso);
  const dayOfWeek = today.getUTCDay();

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(today);
    currentDay.setUTCDate(today.getUTCDate() - dayOfWeek + i);
    weekDates.push(formatUtcDate(currentDay));
  }
  return weekDates;
};

export const getSevenDayDate = (): string => (getCurrentWeekDates()[6]);
