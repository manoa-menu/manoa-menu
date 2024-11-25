interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

interface MenuResponse {
  day_menus: DayMenu[];
}

const jpDaysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];

const jpManualReplace = (original: MenuResponse): MenuResponse => {
  const replacedMenu: MenuResponse = {
    day_menus: [],
  };
  original.day_menus.forEach((dayMenu, index) => {
    const replacedDayMenu: DayMenu = {
      name: jpDaysOfWeek[index],
      plateLunch: dayMenu.plateLunch.map((item) => {
        // Replace Value Bowl
        if (item.includes('バリューボウル')) {
          return item.replace('バリューボウル', 'お得サイズボウル');
        }
        return item;
      }),
      grabAndGo: dayMenu.grabAndGo.map((item) => {
        // Replace Value Bowl
        if (item.includes('バリューボウル')) {
          return item.replace('バリューボウル', 'お得サイズボウル');
        }
        // Add Sandwich to Club
        if (item.endsWith('クラブ')) {
          return `${item}サンドイッチ`;
        }
        // Replace Tater Tots with Fried Potato
        if (item.includes('テイタートッツ') || item.includes('テイタートット') || item.includes('テイタートツ')
        || item.includes('タタートッツ')) {
          return item.replace(/テイタートッツ|テイタートット|テイタートツ|タタートッツ/g, 'ポテトフライド');
        }
        // Replace Loaded with Lots of Toppings
        if (item.includes('ロード')) {
          return item.replace('ロード', 'トッピング盛りだくさん');
        }
        // Replace Blackened with Seasoned
        if (item.includes('ブラックニング') || item.includes('ブラックニン') || item.includes('ブラックニング')
        || item.includes('ブラック')) {
          return item.replace(/ブラック|ブラックニング|ブラックニン|ブラックニング/g, 'ブラック（味付鶏肉）');
        }
        // Replace Mixed Plate
        if (item.includes('ミックスプレート') || item.includes('ミクスプレート')) {
          return item.replace('ミックスプレート', '２種類プレート');
        }
        return item;
      }),
      specialMessage: dayMenu.specialMessage,
    };
    replacedMenu.day_menus.push(replacedDayMenu);
  });

  return replacedMenu;
};

export default jpManualReplace;
