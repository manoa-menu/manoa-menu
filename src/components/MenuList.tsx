import React from 'react';

import MenuCard from '@/components/MenuCard';

import { DayMenu } from '@/types/menuTypes';

interface MenuListProps {
  menu: DayMenu[];
  language: string;
}

const MenuList: React.FC<MenuListProps> = ({ menu, language }) => (
  <div className="container">
    <div className="row d-flex justify-content-center">
      {menu.map((day: DayMenu) => (
        <div key={day.name} className="my-2 col-12 col-sm-6 col-md-6 col-lg-4 flex-grow">
          <MenuCard
            name={day.name}
            plateLunch={day.plateLunch}
            grabAndGo={day.grabAndGo}
            message={day.specialMessage}
            language={language}
          />
        </div>
      ))}
    </div>
  </div>
);

export default MenuList;
