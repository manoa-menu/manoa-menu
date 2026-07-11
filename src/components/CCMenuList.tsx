'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { useMediaQuery, useTheme } from '@mui/material';
import { Tab, Tabs } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import CCMenuCard from '@/components/CCMenuCard';
import {
  getMenuDayTabsScrollSx,
  menuDayTabFadeSx,
  menuDayTabsDesktopSx,
} from '@/components/menuDayTabStyles';
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

const getGridSize = (count: number) => {
  switch (count) {
    case 1:
      return { lg: 6 };
    case 2:
    case 3:
    case 4:
    case 5:
    default:
      return { lg: 'grow' as const };
  }
};

const CCMenuList: React.FC<MenuListProps> = ({ menu, language, userId, favArr }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine today's weekday index (Mon=0 … Fri=4) for the default active tab
  const dayOfWeek = new Date().getDay(); // 0=Sun … 6=Sat
  const todayIndex = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : -1;
  const defaultTab = Math.max(0, Math.min(dayOfWeek - 1, menu.length - 1));
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [tabsOverflow, setTabsOverflow] = useState(false);

  const updateScrollFades = useCallback(() => {
    const nav = tabsRef.current?.querySelector<HTMLElement>('.nav');
    if (!nav) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setTabsOverflow(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = nav;
    setTabsOverflow(scrollWidth > clientWidth + 2);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  const scrollFadeOverlaySx = menuDayTabFadeSx;

  useEffect(() => {
    const root = tabsRef.current;
    const nav = root?.querySelector<HTMLElement>('.nav');
    if (!nav) return undefined;

    updateScrollFades();

    const activeTab = nav.querySelector<HTMLElement>('.nav-link.active');
    activeTab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' as ScrollBehavior });
    updateScrollFades();

    nav.addEventListener('scroll', updateScrollFades, { passive: true });
    window.addEventListener('resize', updateScrollFades);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScrollFades)
      : null;
    resizeObserver?.observe(nav);

    return () => {
      nav.removeEventListener('scroll', updateScrollFades);
      window.removeEventListener('resize', updateScrollFades);
      resizeObserver?.disconnect();
    };
  }, [menu, updateScrollFades]);

  const gridSize = getGridSize(menu.length);

  const renderCard = (day: DayMenu, index: number, useDaySwitcher: boolean) => (
    <CCMenuCard
      name={day.name}
      plateLunch={day.plateLunch}
      grabAndGo={day.grabAndGo}
      message={day.specialMessage}
      language={language}
      favArr={favArr}
      userId={userId}
      dayIndex={index}
      isToday={index === todayIndex}
      useDaySwitcher={useDaySwitcher}
    />
  );

  return (
    <>
      {/* Below desktop: day switcher */}
      <Box
        sx={{
          display: { xs: 'block', lg: 'none' },
          pt: 1.25,
          pb: 0.25,
          mx: { xs: 0, sm: 1, md: 0.5 },
          py: { sm: 1.5, md: 1 },
          px: { xs: 0, sm: 0.5, md: 0 },
        }}
      >
        <Box
          ref={tabsRef}
          sx={isMobile ? getMenuDayTabsScrollSx(tabsOverflow) : menuDayTabsDesktopSx}
        >
          <Box
            sx={{
              display: { xs: 'block', sm: 'none' },
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 44,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <Box sx={scrollFadeOverlaySx('left', canScrollLeft)} aria-hidden />
            <Box sx={scrollFadeOverlaySx('right', canScrollRight)} aria-hidden />
          </Box>
          <Tabs
            variant="underline"
            defaultActiveKey={defaultTab}
            id="ccMenuDateTabs"
            className="mb-0"
          >
            {menu.map((day: DayMenu, index: number) => (
              <Tab eventKey={index} title={getShortLabel(day.name)} key={day.name}>
                <Box sx={{ mt: 0.75, maxWidth: { sm: 560, md: '100%' }, mx: 'auto' }}>
                  {renderCard(day, index, true)}
                </Box>
              </Tab>
            ))}
          </Tabs>
        </Box>
      </Box>

      {/* Desktop: all 5 day cards in one row */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          mx: 1,
          py: 2,
          px: 0.5,
        }}
      >
        <Grid
          container
          spacing={2}
          justifyContent="center"
          sx={{ flexWrap: menu.length > 1 ? 'nowrap' : 'wrap' }}
        >
          {menu.map((day: DayMenu, index: number) => (
            <Grid size={gridSize} key={day.name} sx={{ minWidth: 0 }}>
              {renderCard(day, index, false)}
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default CCMenuList;
