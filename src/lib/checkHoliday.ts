const checkHoliday = (input: string): string => {
  const holidays: { [key: string]: string } = {
    "New Year's Day": '🎉',
    'Martin Luther King Jr. Day': '🕊️',
    // "Presidents' Day": '🇺🇸',
    // 'Memorial Day': '🇺🇸',
    'Independence Day': '🎆',
    'Labor Day': '⚒️',
    // 'Veterans Day': '🇺🇸',
    Thanksgiving: '🦃',
    感謝祭: '🦃',
    Christmas: '🎄',
    クリスマス: '🎄',
    'Prince Kuhio Day': '🌺',
    'Kamehameha Day': '🌺',
    'Statehood Day': '🌺',
    'Admissions Day': '🌺',
    'Good Friday': '',
    'Election Day': '🗳️',
    'Columbus Day': '🌎',
    Halloween: '🎃',
    "Valentine's Day": '❤️',
    "St. Patrick's Day": '☘️',
    Easter: '🐰',
    イースター: '🐰',
    "Mother's Day": '🌸',
    "Father's Day": '👔',
  };

  for (const holiday in holidays) {
    if (input.toLowerCase().includes(holiday.toLowerCase())) {
      return holidays[holiday];
    }
  }

  return '';
};

export default checkHoliday;
