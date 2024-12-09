import { DayMenu } from '@/types/menuTypes';

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

const fixDayNames = (menu: DayMenu[], language: string) => {
  const weekdayDates = getWeekdayDates(language);

  const englishWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const japaneseWeekDays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const koreanWeekDays = ['월요일', '화요일', '수요일', '목요일', '금요일'];
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
      name: koreanWeekDays[index % 5],
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

export default fixDayNames;
