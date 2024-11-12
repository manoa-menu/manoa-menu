import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { NextResponse } from 'next/server';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

const parseCampusCenterMenu = async (fileName: string): Promise<DayMenu[]> => {
  const filePath = path.join(process.cwd(), 'public', 'menus', 'cc-menus', `${fileName}.pdf`);
  const dataBuffer = fs.readFileSync(filePath);
  const weeklyMenu: DayMenu[] = [];
  const weekdays = ['Mon \n', 'Tue \n', 'Wed \n', 'Thurs \n', 'Fri \n', 'Thu\nrs\n'];
  const messageArr: string[] = [];

  const data = await pdf(dataBuffer);
  const parsedText = data.text;
  const regex = new RegExp(weekdays.join('|'), 'g');
  const weeklyMenuPT = parsedText.split(regex).slice(1);

  weeklyMenuPT.forEach((day, index) => {
    const dayOfWeek = weekdays[index].trim();
    const dayObject: DayMenu = { name: dayOfWeek, plateLunch: [], grabAndGo: [], specialMessage: '' };

    const valueBowlRegex = /Value Bowl: .*?\n/g;
    const valueBowlMatches = day.match(valueBowlRegex);
    let plateLunchOptions;
    let grabAndGoOptions;

    if (valueBowlMatches && valueBowlMatches.length > 0) {
      const startOfValue = valueBowlMatches[0];
      const valueLineLength = valueBowlMatches[0].length;
      const endOfValue = day.indexOf(startOfValue) + valueLineLength;
      plateLunchOptions = day.slice(day.indexOf('• '), endOfValue).split('• ').slice(1);
      grabAndGoOptions = day.slice(endOfValue).split('• ').slice(1);
    } else {
      plateLunchOptions = day.split('•').slice(1, 7);
      grabAndGoOptions = day.split('•').slice(7);
    }

    const lastGGOption = grabAndGoOptions[grabAndGoOptions.length - 1];
    if (/\n\S/.test(lastGGOption)) {
      const message = lastGGOption.slice(lastGGOption.indexOf('\n') + 1);
      messageArr.push(message);
    }

    plateLunchOptions?.forEach((option) => {
      dayObject.plateLunch.push(option.replace(/\n/g, '').trim());
    });
    grabAndGoOptions?.forEach((option) => {
      dayObject.grabAndGo.push(option.replace(/\n/g, '').trim());
    });

    weeklyMenu.push(dayObject);
  });

  const holidays = weeklyMenu.filter((day) => day.plateLunch.length === 0 && day.grabAndGo.length === 0);
  messageArr.forEach((message, index) => {
    holidays[index].specialMessage = message;
  });

  return weeklyMenu;
};

// eslint-disable-next-line import/prefer-default-export
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  try {
    const menu = await parseCampusCenterMenu(fileName);
    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
