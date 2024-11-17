/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

// 'use client';
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

interface MenuCallProps {
  menu: DayMenu[];
}

interface MenuResponse {
  day_menus: DayMenu[];
}

// eslint-disable-next-line react/prop-types
const MenuCall: React.FC<MenuCallProps> = async ({ menu }) => {
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
