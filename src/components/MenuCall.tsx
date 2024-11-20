/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

// 'use client';
import { Container } from 'react-bootstrap';
import '@/styles/Menu.css';
import { getLatestMenu, getMenu, insertMenu, Location } from '@/lib/dbActions';

import MenuList from '@/components/MenuList';

import fetchOpenAI, { Option } from '../app/utils/api/openai';

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

function getCurrentWeek(): Date {
  const today = new Date();
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = today.getDay();
  // Calculate the start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  // Calculate the end of the week (Saturday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  return startOfWeek;
}

// eslint-disable-next-line react/prop-types
const MenuCall: React.FC<MenuCallProps> = async ({ menu }) => {
  const dbLatestMenu = await getLatestMenu();

  if ((dbLatestMenu?.week_of ?? 0) < getCurrentWeek()) {
    console.log('Inserting menu into database');
    await insertMenu(menu, Location.CAMPUS_CENTER, 'English', 'USA');
    const translatedMenu: MenuResponse = await fetchOpenAI(Option.CC, menu, 'Japanese', 'Japan');
    const translatedDayMenus: DayMenu[] = translatedMenu.day_menus;
    await insertMenu(translatedDayMenus, Location.CAMPUS_CENTER, 'Japanese', 'Japan');
    // console.log('Translated Menu:', translatedDayMenus);
    return (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <MenuList menu={translatedDayMenus} />
      </Container>
    );
  }
    console.log('Fetching menu from database');
    const dbMenu = await getMenu(getCurrentWeek(), 'English');
    if (dbMenu && typeof dbMenu.menu === 'string') {
      return (
        <Container fluid className="my-5 menu-container">
          <h1>Menu</h1>
          <MenuList menu={JSON.parse(dbMenu.menu)} />
        </Container>
      );
    }
    console.error('Failed to fetch menu from database');
    return (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <p>Failed to load menu. Please try again later.</p>
      </Container>
    );
};

export default MenuCall;
