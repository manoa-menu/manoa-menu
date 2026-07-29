import { DayMenu } from '@/types/menuTypes';

const ENGLISH_DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ENGLISH_WEEKDAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const getWeekdayDates = (language: string): string[] => {
  const weekdays = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Monday

  for (let i = 0; i < 5; i++) {
    const weekday = new Date(startOfWeek);
    weekday.setDate(startOfWeek.getDate() + i);
    weekdays.push({ month: weekday.getMonth() + 1, day: weekday.getDate() });
  }
  let monthSymbol = '';
  let daySymbol = '';

  switch (language) {
    case 'Japanese':
      monthSymbol = '月';
      daySymbol = '日';
      break;
    case 'Korean':
      monthSymbol = '월';
      daySymbol = '일';
      break;
    case 'Chinese':
      monthSymbol = '月';
      daySymbol = '日';
      break;
    case 'Spanish':
      monthSymbol = '/';
      daySymbol = '';
      break;
    default:
      monthSymbol = '/';
      daySymbol = '';
      break;
  }

  const weekdayDates = weekdays.map((day) => `${day.month}${monthSymbol}${day.day}${daySymbol}`);

  return weekdayDates;
};

export const fixDayNames = (menu: DayMenu[], language: string) => {
  const weekdayDates = getWeekdayDates(language);

  const englishWeekDays = ENGLISH_WEEKDAYS_FULL;
  const japaneseWeekDays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const koreanWeekDays = ['월요일', '화요일', '수요일', '목요일', '금요일'];
  const chineseWeekDays = ['星期一', '星期二', '星期三', '星期四', '星期五'];
  const spanishWeekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  if (language === 'English') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${englishWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Japanese') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${japaneseWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Korean') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${koreanWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Chinese') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${chineseWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Spanish') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: spanishWeekDays[index % 5],
    }));
  }
  return menu;
};

const DAY_ABBR_BY_LANGUAGE: Record<string, string[]> = {
  English: ENGLISH_DAY_ABBR,
  Japanese: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  Korean: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  Chinese: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  Spanish: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

const formatMonthDay = (month: number, day: number, language: string): string => {
  switch (language) {
    case 'Japanese':
    case 'Chinese':
      return `${month}月${day}日`;
    case 'Korean':
      return `${month}월${day}일`;
    default:
      return `${month}/${day}`;
  }
};

/** Tab title from an API/menu ISO date (YYYY-MM-DD), not from filtered tab index. */
export const formatSdxDayTabTitle = (isoDate: string, language: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  // Noon UTC keeps the calendar day stable regardless of local timezone.
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const dayNames = DAY_ABBR_BY_LANGUAGE[language] ?? DAY_ABBR_BY_LANGUAGE.English;
  return `${dayNames[weekdayIndex]} (${formatMonthDay(month, day, language)})`;
};

export const getDayHeaders = (language: string): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Sunday

  const dayNames = DAY_ABBR_BY_LANGUAGE[language] ?? DAY_ABBR_BY_LANGUAGE.English;

  return dayNames.map((dayName, index) => {
    const weekday = new Date(startOfWeek);
    weekday.setDate(startOfWeek.getDate() + index);
    return `${dayName} (${formatMonthDay(weekday.getMonth() + 1, weekday.getDate(), language)})`;
  });
};

export const isFav = (favList: string[], name: string): boolean => favList.includes(name);

export const getDisplayMenuNames = (menuName: string, language: string): string => {
  const isEnglish = language === 'English';
  const isJapanese = language === 'Japanese';

  switch (menuName) {
    case 'cc':
      if (isEnglish) {
        return 'Campus Center Food Court';
      }
      if (isJapanese) {
        return 'キャンパスセンター';
      }
      if (language === 'Korean') {
        return '캠퍼스 센터 푸드 코트';
      }
      if (language === 'Chinese') {
        return '校园中心美食广场';
      }
      return 'Campus Center Food Court';
    case 'gw':
      if (isEnglish) {
        return 'Gateway Cafe';
      }
      if (isJapanese) {
        return 'ゲートウェイカフェ';
      }
      if (language === 'Korean') {
        return '게이트웨이 카페';
      }
      if (language === 'Chinese') {
        return '盖特威咖啡厅';
      }
      return 'Gateway Cafe';
    case 'ha':
      if (isEnglish) {
        return 'Hale Aloha Cafe';
      }
      if (isJapanese) {
        return 'ハレアロハカフェ';
      }
      if (language === 'Korean') {
        return '할레 알로하 카페';
      }
      if (language === 'Chinese') {
        return '哈雷阿洛哈咖啡厅';
      }
      return 'Hale Aloha Cafe';
    default:
      return '';
  }
};

const LOCATION_SWITCHER_SUFFIXES = [
  ' Food Court',
  ' 푸드 코트',
  '美食广场',
  '咖啡厅',
  ' Cafe',
  ' 카페',
  'カフェ',
];

/** Navbar labels — same as the page title, without cafe / food court suffixes. */
export const getLocationSwitcherLabel = (menuName: string, language: string): string => {
  const fullName = getDisplayMenuNames(menuName, language);
  const suffix = LOCATION_SWITCHER_SUFFIXES.find((part) => fullName.endsWith(part));
  return suffix ? fullName.slice(0, -suffix.length) : fullName;
};
