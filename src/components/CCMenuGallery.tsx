import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { Tab, Tabs } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';
import { isFav } from '@/lib/menuHelper';
import ImageMenuCard from './ImageMenuCard';
import { UtensilsCrossed, ShoppingBag } from 'lucide-react';
import Stack from '@mui/material/Stack';

interface CCMenuGalleryProps {
  menu: DayMenu[];
  language: string;
  userId: number;
  favArr: string[];
}

const getShortLabel = (name: string): string => {
  const dateMatch = name.match(/\(([^)]+)\)/);
  const date = dateMatch ? dateMatch[1] : '';
  const isLatin = /^[A-Za-z]/.test(name);
  const abbr = isLatin ? name.substring(0, 3) : name.substring(0, 1);
  return date ? `${abbr} ${date}` : abbr;
};

const getSectionHeaders = (lang: string): string[] => {
  switch (lang) {
    case 'English':
      return ['Plate Lunch', 'Grab and Go'];
    case 'Japanese':
      return ['セットメニュー', 'クイックメニュー'];
    case 'Korean':
      return ['백반', '포장 메뉴'];
    case 'Chinese':
      return ['套餐', '外带餐'];
    default:
      return ['Plate Lunch', 'Grab and Go'];
  }
};

const CCMenuGallery: React.FC<CCMenuGalleryProps> = ({ menu, language, userId, favArr }) => {
  const dayOfWeek = new Date().getDay(); 
  const defaultTab = Math.max(0, Math.min(dayOfWeek - 1, menu.length - 1));
  
  const [favArray, setFavArray] = useState(favArr);

  const handleToggle = (item: string) => {
    setFavArray((prev) => 
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const headers = getSectionHeaders(language);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Tabs
        variant="underline"
        defaultActiveKey={defaultTab}
        id="ccMenuGalleryTabs"
        className="mb-4 d-flex justify-content-center custom-scrollbar flex-nowrap overflow-auto"
      >
        {menu.map((day: DayMenu, index: number) => (
          <Tab eventKey={index} title={getShortLabel(day.name)} key={day.name}>
            <Box sx={{ mt: 2, pb: 2, px: { xs: 1, sm: 2, md: 4 } }}>
              {(day.plateLunch.length > 0 || day.grabAndGo.length > 0) ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, borderBottom: '2px solid #eaeaea', pb: 0.5 }}>
                      <UtensilsCrossed size={20} color="#333" />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                        {headers[0]}
                      </Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                      {day.plateLunch.map((item, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} key={`${item}-${i}`}>
                          <ImageMenuCard
                            name={item}
                            language={language}
                            userId={userId}
                            isStarred={isFav(favArray, item)}
                            onToggleStar={() => handleToggle(item)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, borderBottom: '2px solid #eaeaea', pb: 0.5 }}>
                      <ShoppingBag size={20} color="#333" />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                        {headers[1]}
                      </Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                      {day.grabAndGo.map((item, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} key={`${item}-${i}`}>
                          <ImageMenuCard
                            name={item}
                            language={language}
                            userId={userId}
                            isStarred={isFav(favArray, item)}
                            onToggleStar={() => handleToggle(item)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h5" color="text.secondary">
                    {day.specialMessage}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tab>
        ))}
      </Tabs>
    </Box>
  );
};

export default CCMenuGallery;
