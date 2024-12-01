'use client';

import React from 'react';
import MenuList from '@/components/MenuList';
import { Container } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';

interface MenuPageProps {
  menu: DayMenu[];
}

const Menu: React.FC<MenuPageProps> = ({ menu }) => {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const parsedMenu: DayMenu[] = menu.map((day, index) => (
    {
      name: weekDays[index % 5],
      grabAndGo: day.grabAndGo,
      plateLunch: day.plateLunch,
      specialMessage: day.specialMessage,
    }
  ));
  return (
    <Container fluid className="my-5 menu-container">
      <h1>Menu</h1>
      <MenuList menu={parsedMenu} />
    </Container>
  );
};

export default Menu;
