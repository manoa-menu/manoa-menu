/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';

import MenuCard from '@/components/MenuCard';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

interface MenuListProps {
  menu: DayMenu[];
}

const MenuList: React.FC<MenuListProps> = ({ menu }) => (
  <>
    {menu.map((day: DayMenu) => (
      <MenuCard
        key={day.name}
        name={day.name}
        plateLunch={day.plateLunch}
        grabAndGo={day.grabAndGo}
        message={day.specialMessage}
      />
    ))}
  </>
);

export default MenuList;
