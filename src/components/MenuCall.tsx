/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

// 'use client';

import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import '@/styles/Menu.css';

import MenuList from '@/components/MenuList';

import fetchOpenAI from '../app/utils/api/openai';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

interface MenuListProps {
  menu: DayMenu[];
}

interface MenuResponse {
  day_menus: DayMenu[];
}

const MenuCall: React.FC<MenuListProps> = async ({ menu }) => {
  // const [englishMenu, setEnglishMenu] = useState<DayMenu[]>(menu);
  // const [translatedMenu, setTranslatedMenu] = useState<DayMenu[]>([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const menuResponse: MenuResponse = await fetchOpenAI(englishMenu);
  //     const responseDayMenus: DayMenu[] = menuResponse.day_menus;
  //     console.log('Translated Menu:', responseDayMenus);

  //     setTranslatedMenu(responseDayMenus);
  //   };

  //   fetchData();
  // }, [englishMenu]);

  // console.log('Parsed Menu:', translatedMenu);

  const translatedMenu: MenuResponse = await fetchOpenAI(menu);
  const translatedDayMenus: DayMenu[] = translatedMenu.day_menus;
  console.log('Translated Menu:', translatedDayMenus);

  return (
    <Container fluid className="my-5 menu-container">
      <h1>Menu</h1>
      <MenuList menu={translatedDayMenus} />
    </Container>
  );
};

export default MenuCall;
