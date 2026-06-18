import React, { useEffect, useMemo, useState } from 'react';
import { FilteredSodexoMeal, SdxAPIResponse } from '@/types/menuTypes';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { green, lightGreen } from '@mui/material/colors';

 
import { Vegan, Salad } from 'lucide-react';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import { getDayHeaders, getShortDayTabLabel, isFav } from '@/lib/menuHelper';
import { getCurrentDayOf } from '@/lib/dateFunctions';
import StarButton from '@/components/StarButton';
import TabPanelTransition from '@/components/TabPanelTransition';
import { menuCardSx, menuCardTitleSx, menuSectionLabelSx, premiumTabsSx } from '@/lib/menuUiStyles';

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
  console.log(`Favorite Array: ${favArr}`);

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

  const openDayMenus = useMemo(() => weekMenu.filter((day) => day.meals.length > 0), [weekMenu]);
  const daysOpen = openDayMenus.length;
  const defaultTab = openDayMenus.find((day) => day.date === currentDateOf)?.date ?? openDayMenus[0]?.date ?? '';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_, nextValue: string) => setActiveTab(nextValue)}
        variant="fullWidth"
        scrollButtons={false}
        sx={premiumTabsSx}
      >
        {openDayMenus.map((dayMenu, index) => (
          <Tab
            key={dayMenu.date}
            value={dayMenu.date}
            label={getShortDayTabLabel(getDayHeaders(language)[index + (daysOpen >= 7 ? 0 : 1)])}
          />
        ))}
      </Tabs>

      {openDayMenus.map((dayMenu) => {
        if (dayMenu.date !== activeTab) return null;

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
            case 4:
            default:
              return [
                { xs: 'none', md: 'none', lg: 840 },
                { xs: 'visible', md: 'visible', lg: 'auto' },
              ];
          }
        };

        const gridItemSize = getGridItemSize(dayMenu.meals.length);

        return (
          <TabPanelTransition panelKey={dayMenu.date} key={dayMenu.date}>
            <Grid container spacing={2} justifyContent="center">
            {dayMenu.meals.map((meal: FilteredSodexoMeal) => (
              <Grid size={gridItemSize} key={meal.name}>
                <Card
                  className="custom-scrollbar"
                  sx={{
                    ...menuCardSx,
                    m: 1.5,
                    maxHeight: getScrollProperties(dayMenu.meals.length)[0],
                    overflow: getScrollProperties(dayMenu.meals.length)[1],
                  }}
                >
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 0.75 },
                      borderBottom: 1,
                      borderColor: 'divider',
                      borderLeft: 4,
                      borderLeftColor: 'primary.main',
                      bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
                    }}
                  >
                    <Typography variant="h6" sx={menuCardTitleSx}>
                      {meal.name}
                    </Typography>
                  </Box>
                  <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    {meal.groups.map((group, groupIndex) => (
                      <Box key={group.name}>
                        {groupIndex > 0 && <Divider sx={{ my: 2 }} />}
                        <Typography sx={{ ...menuSectionLabelSx, mb: 1.25, display: 'block' }}>
                          {group.name}
                        </Typography>
                        <Stack spacing={0} divider={<Divider flexItem />}>
                          {group.items.map((item) => (
                            <Box key={item.formalName} sx={{ py: 1.1 }}>
                              <Grid container spacing={1}>
                                <Grid size={10}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.35, fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' } }}>
                                      {item.formalName}
                                    </Typography>
                                    {item.isVegan && <VeganIcon language={language} />}
                                    {item.isVegetarian && <VegetarianIcon language={language} />}
                                  </Stack>
                                  {item.description && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mt: 0.35, lineHeight: 1.45 }}
                                    >
                                      {item.description}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid size={2}>
                                  {(userId !== -21) && !sdxFilter.includes(item.formalName) && (
                                    <Tooltip title={favTooltipNames.get(language)} placement="bottom" arrow>
                                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <StarButton
                                          item={item.formalName}
                                          isStarred={isFav(favArray, item.formalName)}
                                          onToggle={() => handleToggle(item.formalName)}
                                        />
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            </Grid>
          </TabPanelTransition>
        );
      })}
    </Box>
  );
};

export default SdxMenu;
