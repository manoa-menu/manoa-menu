import React from 'react';

import CCMenuCard from '@/components/CCMenuCard';

import { DayMenu } from '@/types/menuTypes';

interface MenuListProps {
  menu: DayMenu[];
  language: string;
  userId: number;
}

const CCMenuList: React.FC<MenuListProps> = ({ menu, language, userId }) => {
  const [favArr, setFavArr] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchFav = async () => {
      const response = await fetch(`/api/userFavorites?userId=${userId}`);
      const data = await response.json();
      setFavArr(data);
    };
    fetchFav();
  }, [userId]);

  return (
    <div className="container">
      <div className="row d-flex justify-content-center">
        {menu.map((day: DayMenu) => (
          <div key={day.name} className="my-2 col-12 col-sm-6 col-md-6 col-lg-4 flex-grow">
            <CCMenuCard
              name={day.name}
              plateLunch={day.plateLunch}
              grabAndGo={day.grabAndGo}
              message={day.specialMessage}
              language={language}
              favArr={favArr}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CCMenuList;
