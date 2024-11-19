/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import React from 'react';
import '@/styles/Menu.css';

import getCCMenu from '@/lib/scrapeCCMenu';
import parseCampusCenterMenu from '@/lib/menuParse';
import MenuCall from '@/components/MenuCall';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

const Page = async () => {
  const menuURL: string = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';
  const menuPdf: string = await getCCMenu(menuURL);
  const parsedMenu: DayMenu[] = await parseCampusCenterMenu(menuPdf);
  console.log('Parsed Menu:', parsedMenu);

  return (
    <MenuCall menu={parsedMenu} />
  );
};

export default Page;
