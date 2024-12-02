// import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import { DayMenu, PDFData, MenuResponse } from '@/types/menuTypes';

// Resolve the absolute path
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pdfFilePath = path.resolve('./test/data/05-versions-space.pdf');

export default async function parseCampusCenterMenu(fileURL: string): Promise<MenuResponse> {
  const response = await fetch(fileURL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${fileURL}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const dataBuffer = Buffer.from(arrayBuffer);

  const weeklyMenu: DayMenu[] = [];

  const weekdays = ['Mon \n', 'Tue \n', 'Wed \n', 'Thurs \n', 'Fri \n', 'Thu\nrs\n'];
  const messageArr: string[] = [];

  let weekOne: DayMenu[] = [];
  let weekTwo: DayMenu[] = [];

  await pdf(dataBuffer).then(function (data: PDFData) {
    const parsedText = data.text;
    // Create a regular expression to match any of the weekdays
    const regex = new RegExp(weekdays.join('|'), 'g');
    const weeklyMenuPT = parsedText.split(regex).slice(1);

    // console.log(weeklyMenuPT);

    weeklyMenuPT.forEach((day, index) => {
      let dayOfWeek = '';
      const weekday = weekdays[index]?.trim(); // Add optional chaining to handle undefined values
      switch (weekday) {
        case 'Mon':
          dayOfWeek = 'Monday';
          break;
        case 'Tue':
          dayOfWeek = 'Tuesday';
          break;
        case 'Wed':
          dayOfWeek = 'Wednesday';
          break;
        case 'Thurs':
          dayOfWeek = 'Thursday';
          break;
        case 'Fri':
          dayOfWeek = 'Friday';
          break;
        default:
          dayOfWeek = '';
      }

      const dayObject: DayMenu = {
        name: dayOfWeek,
        grabAndGo: [],
        plateLunch: [],
        specialMessage: '',
      };

      // Regular expression to match 'Value Bowl: {VARIABLE MENU ITEM HERE}' followed by a newline
      const valueBowlRegex = /Value Bowl: .*?\n/g;
      const valueBowlMatches = day.match(valueBowlRegex);

      const specialMessageKeywords = [
        'closed', 'holiday', 'no service', 'canceled',
        'maintenance', 'event', 'break', 'vacation',
      ];

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

        grabAndGoOptions.forEach(option => {
          const miniIndex = option.lastIndexOf('Mini');
          const valueIndex = option.lastIndexOf('Value');

          if (miniIndex !== -1) {
            grabAndGoOptions.push(option.slice(miniIndex));
            // eslint-disable-next-line no-param-reassign
            option = option.slice(0, miniIndex).trim();
          } else if (valueIndex !== -1) {
            grabAndGoOptions.push(option.slice(valueIndex));
            // eslint-disable-next-line no-param-reassign
            option = option.slice(0, valueIndex).trim();
          }
        });
      } else {
        const splitDay = day.split('•');
        plateLunchOptions = splitDay.slice(1, 7);
        grabAndGoOptions = splitDay.slice(7);
        plateLunchOptions = Array.from(new Set(plateLunchOptions));
        grabAndGoOptions = Array.from(new Set(grabAndGoOptions));
      }

      let lastGGOption = grabAndGoOptions[grabAndGoOptions.length - 1];
      if (/\n\S/.test(lastGGOption)) {
        const message = lastGGOption.slice(lastGGOption.indexOf('\n') + 1);

        if (specialMessageKeywords.some((keyword) => message.toLowerCase().includes(keyword))) {
          messageArr.push(message);
          lastGGOption = lastGGOption.slice(0, lastGGOption.indexOf('\n'));
        } else {
          lastGGOption = message;
        }
      }
      grabAndGoOptions[grabAndGoOptions.length - 1] = lastGGOption;

      plateLunchOptions?.forEach((option) => {
        const formattedOption = option.replace(/\n/g, '').trim();
        dayObject.plateLunch.push(formattedOption);
      });
      grabAndGoOptions?.forEach((option) => {
        const formattedOption = option.replace(/\n/g, '').trim();
        dayObject.grabAndGo.push(formattedOption);
      });

      // console.log(dayObject.plateLunch);
      // console.log(dayObject.grabAndGo);

      weeklyMenu.push(dayObject);
    });
    const holidays = weeklyMenu.filter((day) => day.plateLunch.length === 0 && day.grabAndGo.length === 0);

    if (holidays.length > 0) {
      messageArr.forEach((message, index) => {
        holidays[index].specialMessage = message;
      });
    }

    weekOne = weeklyMenu.slice(0, 5);
    weekTwo = weeklyMenu.length >= 7 ? weeklyMenu.slice(5) : [];
  });

  // console.log(weekOne);
  // console.log(weekTwo);

  return {
    weekOne,
    weekTwo,
  };
}
