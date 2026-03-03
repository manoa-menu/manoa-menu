import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Tab, Tabs } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import CCMenuCard from '@/components/CCMenuCard';
import { DayMenu } from '@/types/menuTypes';

interface MenuListProps {
  menu: DayMenu[];
  language: string;
  userId: number;
  favArr: string[];
}

/** Extract a short tab label from a full day name like "Monday (3/2)" → "Mon 3/2" */
const getShortLabel = (name: string): string => {
  const dateMatch = name.match(/\(([^)]+)\)/);
  const date = dateMatch ? dateMatch[1] : '';
  // For CJK languages the "abbreviation" is the first 1-2 chars; for English take 3
  const isLatin = /^[A-Za-z]/.test(name);
  const abbr = isLatin ? name.substring(0, 3) : name.substring(0, 1);
  return date ? `${abbr} ${date}` : abbr;
};

const CCMenuList: React.FC<MenuListProps> = ({ menu, language, userId, favArr }) => {
  // Determine today's weekday index (Mon=0 … Fri=4) for the default active tab
  const dayOfWeek = new Date().getDay(); // 0=Sun … 6=Sat
  const defaultTab = Math.max(0, Math.min(dayOfWeek - 1, menu.length - 1));

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

  const renderCard = (day: DayMenu, index: number) => (
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
  );

  return (
    <>
      {/*  Mobile: day-picker tabs */}
      <Box
        sx={{
          display: { xs: 'block', sm: 'none' },
          mx: 0,
          py: 2,
          '& .nav-link': { fontSize: '0.85rem' },
        }}
      >
        <Tabs
          variant="underline"
          defaultActiveKey={defaultTab}
          id="ccMenuDateTabs"
          className="mb-2 d-flex justify-content-center"
        >
          {menu.map((day: DayMenu, index: number) => (
            <Tab eventKey={index} title={getShortLabel(day.name)} key={day.name}>
              <Box sx={{ mt: 1 }}>
                {renderCard(day, index)}
              </Box>
            </Tab>
          ))}
        </Tabs>
      </Box>

      {/*  Desktop / tablet: original grid  */}
      <Box sx={{
        display: { xs: 'none', sm: 'block' },
        mx: { xs: 1, sm: 2, md: 5 },
        py: 2,
        px: { xs: 0, sm: 1, md: 2 },
      }}
      >
        <Grid container spacing={2} justifyContent="center">
          {menu.map((day: DayMenu, index: number) => (
            <Grid size={gridSize} key={day.name}>
              {renderCard(day, index)}
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default CCMenuList;
