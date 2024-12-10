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

interface SdxMenuProps {
  weekMenu: SdxAPIResponse[];
  language: string;
}

interface TooltipIconProps {
  language: string;
}

const displayTooltipNames = new Map<string, string[]>([
  ['English', ['Vegan', 'Vegetarian']],
  ['Japanese', ['ビーガン', 'ベジタリアン']],
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

const SdxMenu: React.FC<SdxMenuProps> = ({ weekMenu, language }) => {
  const currentDateOf = getCurrentDayOf();

  return (
    <Box sx={{ padding: 2 }}>
      <Tabs
        defaultActiveKey={currentDateOf}
        id="menuDateTabs"
        className="mb-3 d-flex justify-content-center"
      >
        {weekMenu.map((dayMenu, index) => {
          const getGridItemSize = (mealCount: number) => {
            switch (mealCount) {
              case 1:
                return { xs: 12, md: 12, lg: 12, xl: 12 };
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

          const gridItemSize = getGridItemSize(dayMenu.meals.length);

          return (
            (dayMenu.meals.length > 0) ? (
              <Tab eventKey={dayMenu.date} title={getDayHeaders(language)[index]}>
                <Grid
                  container
                  spacing={2}
                  justifyContent="center"
                >
                  {dayMenu.meals.map((meal: FilteredSodexoMeal) => (
                    <Grid size={gridItemSize} key={meal.name}>
                      <Card
                        className="custom-scrollbar"
                        sx={{ m: 2, height: '100%', maxHeight: { lg: 850 }, overflow: { lg: 'auto' } }}
                      >
                        <CardHeader className="p-3" style={{ backgroundColor: '#EEEEEE' }}>
                          <Typography variant="h4">
                            {meal.name}
                          </Typography>
                        </CardHeader>
                        <CardContent>
                          {meal.groups.map((group) => (
                            <Box key={group.name} sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>
                              {group.name}
                            </Typography>
                              <ul>
                              {group.items.map((item) => (
                                <div key={item.formalName} className="py-2">
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                      {item.formalName}
                                    </Typography>
                                    {item.isVegan && <VeganIcon language={language} />}
                                    {item.isVegetarian && <VegetarianIcon language={language} />}
                                  </Stack>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {item.description}
                                  </Typography>
                                </div>
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
                  Closed/Menu Unavailable
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
