export const getCurrentWeekOf = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const yyyy = startOfWeek.getFullYear();
  const mm = String(startOfWeek.getMonth() + 1).padStart(2, '0');
  const dd = String(startOfWeek.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getNextWeekOf = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 7);
  const yyyy = startOfWeek.getFullYear();
  const mm = String(startOfWeek.getMonth() + 1).padStart(2, '0');
  const dd = String(startOfWeek.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getCurrentDayOf = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getCurrentWeekDates = (): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + i);
    const yyyy = currentDay.getFullYear();
    const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDay.getDate()).padStart(2, '0');
    weekDates.push(`${yyyy}-${mm}-${dd}`);
  }
  return weekDates;
};

export const getSevenDayDate = (): string => (getCurrentWeekDates()[6]);
