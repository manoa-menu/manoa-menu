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
