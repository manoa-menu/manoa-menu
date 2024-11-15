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
  <div className="container">
    <div className="row d-flex justify-content-center">
      {menu.map((day: DayMenu) => (
        <div key={day.name} className="my-2 col-12 col-sm-6 col-md-6 col-lg-4 flex-grow">
          <MenuCard
            name={day.name}
            plateLunch={day.plateLunch}
            grabAndGo={day.grabAndGo}
            message={day.specialMessage}
          />
        </div>
      ))}
    </div>
  </div>
);

export default MenuList;
