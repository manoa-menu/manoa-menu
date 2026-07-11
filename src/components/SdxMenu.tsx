/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { FilteredSodexoMeal, SdxAPIResponse } from '@/types/menuTypes';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { green, lightGreen } from '@mui/material/colors';
import { useMediaQuery, useTheme } from '@mui/material';

import { Vegan, Salad } from 'lucide-react';

import { CardHeader, Tab, Tabs } from 'react-bootstrap';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';

import 'bootstrap/dist/css/bootstrap.min.css';
import { getDayHeaders, isFav } from '@/lib/menuHelper';
import { getCurrentDayOf } from '@/lib/dateFunctions';
import StarButton from '@/components/StarButton';
import { menuDayTabFadeSx, getMenuDayTabsScrollSx, menuDayTabsDesktopSx } from '@/components/menuDayTabStyles';
import { useMenuDayTabScrollFades } from '@/components/useMenuDayTabScrollFades';

interface SdxMenuProps {
  weekMenu: SdxAPIResponse[];
  language: string;
  favArr: string[];
  userId: number;
}

const displayTooltipNames = new Map<string, string[]>([
  ['English', ['Vegan', 'Vegetarian']],
  ['Japanese', ['ビーガン', 'ベジタリアン']],
  ['Korean', ['비건', '채식주의']],
  ['Chinese', ['纯素', '素食']],
]);

const favTooltipNames = new Map<string, string>([
  ['English', 'Favorite?'],
  ['Japanese', 'お気に？'],
  ['Korean', '즐겨찾기?'],
  ['Chinese', '收藏?'],
  ['english', 'Favorite?'],
  ['japanese', 'お気に？'],
]);

const sdxFilter = [
  'White Rice',
  'Brown Rice',
  'Sour Cream',
  'Steamed White Rice',
  'Steamed Brown Rice',
  "Lay's Potato Chips",
];

interface DietaryBadgeProps {
  language: string;
  isVegan?: boolean;
  isVegetarian?: boolean;
}

const DietaryBadges: React.FC<DietaryBadgeProps> = ({
  language,
  isVegan,
  isVegetarian,
}) => {
  if (!isVegan && !isVegetarian) return null;

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
      {isVegan && (
        <Tooltip title={displayTooltipNames.get(language)?.[0] || 'Vegan'} placement="top" arrow>
          <Avatar sx={{ bgcolor: green[400], width: 24, height: 24 }}>
            <Vegan color={green[50]} size={16} />
          </Avatar>
        </Tooltip>
      )}
      {isVegetarian && (
        <Tooltip title={displayTooltipNames.get(language)?.[1] || 'Vegetarian'} placement="top" arrow>
          <Avatar sx={{ bgcolor: lightGreen[500], width: 24, height: 24 }}>
            <Salad color={green[50]} size={16} />
          </Avatar>
        </Tooltip>
      )}
    </Stack>
  );
};

const SdxMenu: React.FC<SdxMenuProps> = ({ weekMenu, language, favArr = [], userId }) => {
  const currentDateOf = getCurrentDayOf();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [favArray, setFavArray] = useState(favArr);

  const handleToggle = (item: string) => {
    const updatedFavArr = (prevFavArray: string[]) => {
      if (prevFavArray.includes(item)) {
        return prevFavArray.filter((favItem) => favItem !== item);
      }
      return [...prevFavArray, item];
    };
    setFavArray(updatedFavArr);
  };

  const [daysOpen, setDaysOpen] = useState(
    weekMenu.filter((day) => day.meals.length > 0).length,
  );

  const { tabsRef, canScrollLeft, canScrollRight, tabsOverflow } = useMenuDayTabScrollFades(weekMenu);

  const scrollFadeOverlaySx = menuDayTabFadeSx;

  return (
    <Box sx={{ mt: { xs: 1.25, sm: 0 }, width: '100%', maxWidth: '100%', minWidth: 0 }}>
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
          defaultActiveKey={currentDateOf}
          id="menuDateTabs"
          className="mb-2"
        >
        {weekMenu
          .filter((dayMenu) => {
            console.log(`daysOpen: ${daysOpen}`);
            return (dayMenu.meals.length > 0);
          })
          .map((dayMenu, index) => {
            const getGridItemSize = (mealCount: number) => {
              switch (mealCount) {
                case 1:
                  return { xs: 12, md: 10, lg: 8, xl: 7 };
                case 2:
                  return { xs: 12, md: 6, lg: 6, xl: 6 };
                case 3:
                  return { xs: 12, md: 12, lg: 6, xl: 4 };
                case 4:
                  return { xs: 12, md: 12, lg: 4, xl: 3 };
                default:
                  return { xs: 12, md: 12, lg: 4, xl: 4 };
              }
            };

            const getScrollProperties = (mealCount: number) => {
              switch (mealCount) {
                case 1:
                  return [
                    { xs: 'none', md: 'none', lg: 'none' },
                    { xs: 'visible', md: 'visible', lg: 'visible' },
                  ];
                case 2:
                  return [
                    { xs: 'none', md: 'none', lg: 820 },
                    { xs: 'visible', md: 'visible', lg: 'auto' },
                  ];
                case 3:
                  return [
                    { xs: 'none', md: 'none', lg: 840 },
                    { xs: 'visible', md: 'visible', lg: 'auto' },
                  ];
                case 4:
                  return [
                    { xs: 'none', md: 'none', lg: 840 },
                    { xs: 'visible', md: 'visible', lg: 'auto' },
                  ];
                default:
                  return [
                    { xs: 'none', md: 'none', lg: 840 },
                    { xs: 'visible', md: 'visible', lg: 'auto' },
                  ];
              }
            };

            const gridItemSize = getGridItemSize(dayMenu.meals.length);

            return (
              (dayMenu.meals.length > 0) ? (
                <Tab
                  key={dayMenu.date}
                  eventKey={dayMenu.date}
                  title={
                    getDayHeaders(language)[index + (daysOpen >= 7 ? 0 : 1)]
                  }
                >
                  <Grid
                    container
                    spacing={isMobile ? 0 : 2}
                    justifyContent="center"
                  >
                    {dayMenu.meals.map((meal: FilteredSodexoMeal) => (
                      <Grid size={gridItemSize} key={meal.name}>
                        <Card
                          className="custom-scrollbar"
                          elevation={isMobile ? 0 : undefined}
                          sx={{
                            m: isMobile ? 0 : 2,
                            height: '100%',
                            maxHeight: isMobile ? 'none' : getScrollProperties(dayMenu.meals.length)[0],
                            overflow: isMobile ? 'visible' : getScrollProperties(dayMenu.meals.length)[1],
                            borderRadius: isMobile ? 0 : undefined,
                            animation: 'fadeIn 0.3s ease-in',
                            '@keyframes fadeIn': {
                              from: { opacity: 0 },
                              to: { opacity: 1 },
                            },
                          }}
                        >
                          {isMobile ? (
                            <Box
                              sx={{
                                px: 1.25,
                                py: 0.75,
                                textAlign: 'center',
                                bgcolor: '#ECECEC',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {meal.name}
                              </Typography>
                            </Box>
                          ) : (
                            <CardHeader className="px-3 py-2" style={{ backgroundColor: '#ECECEC' }}>
                              <Typography variant="h4">
                                {meal.name}
                              </Typography>
                            </CardHeader>
                          )}
                          <CardContent
                            sx={{
                              px: isMobile ? 1.5 : undefined,
                              py: isMobile ? 0.5 : undefined,
                              '&:last-child': { pb: isMobile ? 1.5 : undefined },
                            }}
                          >
                            {meal.groups
                              .filter((group) => group.items.length > 0)
                              .map((group) => (
                              <Box key={group.name} sx={{ mb: isMobile ? 1 : 1.5 }}>
                                <Typography
                                  variant={isMobile ? 'overline' : 'h6'}
                                  sx={{
                                    display: 'block',
                                    mb: isMobile ? 0.5 : 1,
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    letterSpacing: '0.08em',
                                  }}
                                >
                                  {group.name}
                                </Typography>
                                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                                  {group.items.map((item) => (
                                    <Box
                                      component="li"
                                      key={item.formalName}
                                      sx={{
                                        py: isMobile ? 0.5 : 1,
                                        borderBottom: isMobile ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        '&:last-child': { borderBottom: 'none' },
                                      }}
                                    >
                                      <Grid container spacing={1} alignItems="flex-start">
                                        <Grid size={userId === -21 ? 12 : 10}>
                                          <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={0.75}
                                            sx={{ flexWrap: 'wrap' }}
                                          >
                                            <Typography
                                              variant={isMobile ? 'body2' : 'subtitle1'}
                                              sx={{
                                                fontWeight: 600,
                                                lineHeight: 1.35,
                                                overflowWrap: 'anywhere',
                                                wordBreak: 'break-word',
                                              }}
                                            >
                                              {item.formalName}
                                            </Typography>
                                            <DietaryBadges
                                              language={language}
                                              isVegan={item.isVegan}
                                              isVegetarian={item.isVegetarian}
                                            />
                                          </Stack>
                                          {item.description && (
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                mt: 0.5,
                                                color: 'text.secondary',
                                                lineHeight: 1.4,
                                              }}
                                            >
                                              {item.description}
                                            </Typography>
                                          )}
                                        </Grid>
                                        {userId !== -21 && !sdxFilter.includes(item.formalName) && (
                                          <Grid size={2}>
                                            <Tooltip title={favTooltipNames.get(language)} placement="bottom" arrow>
                                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <StarButton
                                                  item={item.formalName}
                                                  isStarred={isFav(favArray, item.formalName)}
                                                  onToggle={() => handleToggle(item.formalName)}
                                                />
                                              </div>
                                            </Tooltip>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Tab>
              ) : (
                <Tab eventKey={dayMenu.date} title={getDayHeaders(language)[index]} key={dayMenu.date} disabled>
                  <Typography variant="h3" className="text-center">
                    Closed or Menu Unavailable
                  </Typography>
                </Tab>
              )
            );
          })}

      </Tabs>
      </Box>
    </Box>
  );
};

export default SdxMenu;
