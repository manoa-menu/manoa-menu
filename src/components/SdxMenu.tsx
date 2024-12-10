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

// eslint-disable-next-line import/no-extraneous-dependencies
import { Vegan, Salad } from 'lucide-react';

import { CardHeader, Tab, Tabs } from 'react-bootstrap';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';

import 'bootstrap/dist/css/bootstrap.min.css';
import { getDayHeaders } from '@/lib/menuHelper';
import { getCurrentDayOf } from '@/lib/dateFunctions';
import StarButton from '@/app/campus-cravings/StarButton';

interface SdxMenuProps {
  weekMenu: SdxAPIResponse[];
  language: string;
  favArr: string[];
  userId: number;
}

interface TooltipIconProps {
  language: string;
}

const displayTooltipNames = new Map<string, string[]>([
  ['English', ['Vegan', 'Vegetarian']],
  ['Japanese', ['ビーガン', 'ベジタリアン']],
]);

const favTooltipNames = new Map<string, string>([
  ['English', 'Favorite?'],
  ['Japanese', 'お気に？'],
  ['english', 'Favorite?'],
  ['japanese', 'お気に？'],
]);

const VeganIcon: React.FC<TooltipIconProps> = ({ language }) => (
  <Tooltip title={displayTooltipNames.get(language)?.[0] || 'Vegan'} placement="top" arrow>
    <Avatar sx={{ bgcolor: green[400], width: 28, height: 28 }}>
      <Vegan color={green[50]} size={19} />
    </Avatar>
  </Tooltip>
);

const VegetarianIcon: React.FC<TooltipIconProps> = ({ language }) => (
  <Tooltip title={displayTooltipNames.get(language)?.[1] || 'Vegetarian'} placement="top" arrow>
    <Avatar sx={{ bgcolor: lightGreen[500], width: 28, height: 28 }}>
      <Salad color={green[50]} size={19} />
    </Avatar>
  </Tooltip>
);

const SdxMenu: React.FC<SdxMenuProps> = ({ weekMenu, language, favArr = [], userId }) => {
  const currentDateOf = getCurrentDayOf();

  const handleToggle = (item: string) => {
    console.log(`Toggled favorite for ${item}`);
  };

  const [daysOpen, setDaysOpen] = useState(
    weekMenu.filter((day) => day.meals.length > 0).length,
  );

  return (
    <Box sx={{ padding: 2 }}>
      <Tabs
        variant="underline"
        defaultActiveKey={currentDateOf}
        id="menuDateTabs"
        className="mb-2 d-flex justify-content-center"
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
                  return { xs: 12, md: 12, lg: 6, xl: 6 };
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
                  eventKey={dayMenu.date}
                  title={
                    getDayHeaders(language)[index + (daysOpen >= 7 ? 0 : 1)]
                  }
                >
                  <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                  >
                    {dayMenu.meals.map((meal: FilteredSodexoMeal) => (
                      <Grid size={gridItemSize} key={meal.name}>
                        <Card
                          className="custom-scrollbar"
                          sx={{
                            m: 2,
                            height: '100%',
                            maxHeight: getScrollProperties(dayMenu.meals.length)[0],
                            overflow: getScrollProperties(dayMenu.meals.length)[1],
                          }}
                        >
                          <CardHeader className="px-3 py-2" style={{ backgroundColor: '#ECECEC' }}>
                            <Typography variant="h4">
                              {meal.name}
                            </Typography>
                          </CardHeader>
                          <CardContent>
                            {meal.groups.map((group) => (
                              <Box key={group.name}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                  {group.name}
                                </Typography>
                                <ul>
                                  {group.items.map((item) => (
                                    <Grid container spacing={1} className="py-2" key={item.formalName}>
                                      <Grid size={10}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {item.formalName}
                                          </Typography>
                                          {item.isVegan && <VeganIcon language={language} />}
                                          {item.isVegetarian && <VegetarianIcon language={language} />}
                                        </Stack>
                                        <Typography variant="body2" sx={{ my: 1 }}>
                                          {item.description}
                                        </Typography>
                                      </Grid>
                                      <Grid size={2}>
                                        {(userId !== -21) && (
                                        <Tooltip title={favTooltipNames.get(language)} placement="bottom" arrow>
                                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <StarButton
                                              item={item.formalName}
                                              isStarred={favArr.includes(item.formalName)}
                                              onToggle={() => handleToggle(item.formalName)}
                                            />
                                          </div>
                                        </Tooltip>
                                        )}
                                      </Grid>
                                    </Grid>
                                  ))}
                                </ul>
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
  );
};

export default SdxMenu;
