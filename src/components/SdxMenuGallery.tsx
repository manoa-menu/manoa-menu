import React, { useState } from 'react';
import { FilteredSodexoMeal, SdxAPIResponse } from '@/types/menuTypes';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Tab, Tabs } from 'react-bootstrap';
import { getCurrentDayOf } from '@/lib/dateFunctions';
import { getDayHeaders, isFav } from '@/lib/menuHelper';
import Grid from '@mui/material/Grid2';
import ImageMenuCard from './ImageMenuCard';

interface SdxMenuGalleryProps {
  weekMenu: SdxAPIResponse[];
  language: string;
  favArr: string[];
  userId: number;
}

const SdxMenuGallery: React.FC<SdxMenuGalleryProps> = ({ weekMenu, language, favArr = [], userId }) => {
  const currentDateOf = getCurrentDayOf();
  const [favArray, setFavArray] = useState(favArr);

  const handleToggle = (item: string) => {
    setFavArray((prev) => 
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const daysOpen = weekMenu.filter((day) => day.meals.length > 0).length;

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Tabs
        variant="underline"
        defaultActiveKey={currentDateOf}
        id="menuDateTabsGallery"
        className="mb-4 d-flex justify-content-center custom-scrollbar flex-nowrap overflow-auto"
      >
        {weekMenu
          .filter((dayMenu) => dayMenu.meals.length > 0)
          .map((dayMenu, index) => (
            <Tab
              key={dayMenu.date}
              eventKey={dayMenu.date}
              title={getDayHeaders(language)[index + (daysOpen >= 7 ? 0 : 1)]}
            >
              <Box sx={{ mt: 2, pb: 2 }}>
                {dayMenu.meals.map((meal: FilteredSodexoMeal) => (
                  <Box key={meal.name} sx={{ mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 1.5, 
                        fontWeight: 700, 
                        borderBottom: '2px solid #eaeaea', 
                        paddingBottom: 0.5, 
                        color: '#333'
                      }}
                    >
                      {meal.name}
                    </Typography>
                    
                    {meal.groups.map((group) => (
                      <Box key={group.name} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#666' }}>
                          {group.name}
                        </Typography>
                        <Grid container spacing={1.5}>
                          {group.items.map((item, i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} key={`${item.formalName}-${i}`}>
                              <ImageMenuCard
                                name={item.formalName}
                                description={item.description}
                                isVegan={item.isVegan}
                                isVegetarian={item.isVegetarian}
                                language={language}
                                userId={userId}
                                isStarred={isFav(favArray, item.formalName)}
                                onToggleStar={() => handleToggle(item.formalName)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Tab>
          ))}
      </Tabs>
    </Box>
  );
};

export default SdxMenuGallery;
