const fs = require('fs');
const pdf = require('pdf-parse');

interface PDFData {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  version: string;
  text: string;
}

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

const parseMenu = (fileName: string): DayMenu[] => {
  const dataBuffer = fs.readFileSync('../public/menus/cc.pdf');

  const weeklyMenu: DayMenu[] = [];

  const weekdays = ['Mon \n', 'Tue \n', 'Wed \n', 'Thurs \n', 'Fri \n', 'Thu\nrs\n'];
  const messageArr: string[] = [];

  pdf(dataBuffer).then(function (data: PDFData) {
    const parsedText = data.text;
    // Create a regular expression to match any of the weekdays
    const regex = new RegExp(weekdays.join('|'), 'g');
    const weeklyMenuPT = parsedText.split(regex).slice(1);

    // console.log(weeklyMenuPT);

    weeklyMenuPT.forEach((day, index) => {
      const dayOfWeek = weekdays[index].trim();

      const dayObject: DayMenu = {
        name: dayOfWeek,
        plateLunch: [],
        grabAndGo: [],
        specialMessage: '',
      };

      // Regular expression to match 'Value Bowl: {VARIABLE MENU ITEM HERE}' followed by a newline
      const valueBowlRegex = /Value Bowl: .*?\n/g;
      const valueBowlMatches = day.match(valueBowlRegex);

      // console.log(`valueBowlMatches: ${valueBowlMatches}`);

      let plateLunchOptions;
      let grabAndGoOptions;

      if (valueBowlMatches && valueBowlMatches.length > 0) {
        const startOfValue = valueBowlMatches[0];
        const valueLineLength = valueBowlMatches[0].length;
        const endOfValue = day.indexOf(startOfValue) + valueLineLength;

        // console.error((day.indexOf(startOfValue) + valueLineLength));

        plateLunchOptions = day.slice(day.indexOf('• '), endOfValue);
        plateLunchOptions = plateLunchOptions.split('• ').slice(1);

        grabAndGoOptions = day.slice(endOfValue);
        grabAndGoOptions = grabAndGoOptions.split('• ').slice(1);
      } else {
        plateLunchOptions = day.split('•').slice(1, 7);
        grabAndGoOptions = day.split('•').slice(7);
      }

      // console.log(plateLunchOptions);
      // console.log(grabAndGoOptions);

      const lastGGOption = grabAndGoOptions[grabAndGoOptions.length - 1];
      if (/\n\S/.test(lastGGOption)) {
        const message = lastGGOption.slice(lastGGOption.indexOf('\n') + 1);
        // message = message.replace(/\n/g, '').trim();
        messageArr.push(message);
      }

      plateLunchOptions?.forEach((option) => {
        const formattedOption = option.replace(/\n/g, '').trim();
        dayObject.plateLunch.push(formattedOption);
      });
      grabAndGoOptions?.forEach((option) => {
        const formattedOption = option.replace(/\n/g, '').trim();
        dayObject.grabAndGo.push(formattedOption);
      });

      weeklyMenu.push(dayObject);
    });

    const holidays = weeklyMenu.filter((day) => day.plateLunch.length === 0 && day.grabAndGo.length === 0);
    console.log(holidays);

    messageArr.forEach((message, index) => {
      holidays[index].specialMessage = message;
    });
    // console.log(weeklyMenu);
  });

  return weeklyMenu;
};
