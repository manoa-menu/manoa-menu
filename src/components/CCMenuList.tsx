import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import CCMenuCard from '@/components/CCMenuCard';
import TabPanelTransition from '@/components/TabPanelTransition';
import { getShortDayTabLabel } from '@/lib/menuHelper';
import { premiumTabsSx } from '@/lib/menuUiStyles';
import { DayMenu } from '@/types/menuTypes';

interface MenuListProps {
  menu: DayMenu[];
  language: string;
  userId: number;
  favArr: string[];
}

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
  const defaultTabIndex = menu.length > 0
    ? Math.max(0, Math.min(defaultTab, menu.length - 1))
    : 0;
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(null);
  const safeTabIndex = selectedTabIndex !== null
    ? Math.min(selectedTabIndex, Math.max(menu.length - 1, 0))
    : defaultTabIndex;

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
          width: '100%',
        }}
      >
        <Tabs
          value={safeTabIndex}
          onChange={(_, nextValue: number) => setSelectedTabIndex(nextValue)}
          variant="fullWidth"
          scrollButtons={false}
          sx={premiumTabsSx}
        >
          {menu.map((day: DayMenu, index: number) => (
            <Tab value={index} label={getShortDayTabLabel(day.name)} key={`cc-day-tab-${index}`} />
          ))}
        </Tabs>
        <Box sx={{ mt: 1 }}>
          {menu.map((day: DayMenu, index: number) => (
            index === safeTabIndex ? (
              <TabPanelTransition panelKey={`${index}-${language}`} key={`cc-day-panel-${index}`}>
                {renderCard(day, index)}
              </TabPanelTransition>
            ) : null
          ))}
        </Box>
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
