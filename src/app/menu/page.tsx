/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import React from 'react';
import '@/styles/Menu.css';

import parseCampusCenterMenu from '@/lib/menuParse';
import MenuCall from '@/components/MenuCall';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

const Page = async () => {
  const parsedMenu: DayMenu[] = await parseCampusCenterMenu('menu2');
  console.log('Parsed Menu:', parsedMenu);

  return (
    <MenuCall menu={parsedMenu} />
  );
};

export default Page;
