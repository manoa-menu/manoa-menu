import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';

import CCMenuCard from '@/components/CCMenuCard';
import { DayMenu } from '@/types/menuTypes';

interface MenuListProps {
  menu: DayMenu[];
  language: string;
  userId: number;
  favArr: string[];
}

const CCMenuList: React.FC<MenuListProps> = ({ menu, language, userId, favArr }) => {
  const getGridSize = (count: number) => {
    switch (count) {
      case 1:
        return { xs: 12, md: 8, lg: 6 };
      case 2:
        return { xs: 12, md: 6, lg: 6 };
      case 3:
        return { xs: 12, md: 6, lg: 4 };
      case 4:
        return { xs: 12, md: 6, lg: 3 };
      case 5:
        return { xs: 12, sm: 6, md: 6, lg: 4 };
      default:
        return { xs: 12, sm: 6, md: 4 };
    }
  };

  const gridSize = getGridSize(menu.length);

  return (
    <Box sx={{ mx: 5, py: 2, px: { xs: 0, sm: 1, md: 2 } }}>
      <Grid container spacing={2} justifyContent="center">
        {menu.map((day: DayMenu, index: number) => (
          <Grid size={gridSize} key={day.name}>
            <CCMenuCard
              name={day.name}
              plateLunch={day.plateLunch}
              grabAndGo={day.grabAndGo}
              message={day.specialMessage}
              language={language}
              favArr={favArr}
              userId={userId}
              dayIndex={index}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CCMenuList;
