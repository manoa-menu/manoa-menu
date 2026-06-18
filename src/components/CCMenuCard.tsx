'use client';

import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid2';
import { UtensilsCrossed, ShoppingBag } from 'lucide-react';

import checkHoliday from '@/lib/checkHoliday';
import StarButton from '@/components/StarButton';
import { isFav } from '@/lib/menuHelper';
import { menuCardSx, menuCardTitleSx, menuSectionLabelSx } from '@/lib/menuUiStyles';

interface MenuCardProps {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  message: string;
  language: string;
  favArr: string[];
  userId: number;
  dayIndex: number;
}

const dayAccentColors = [
  '#1976d2',
  '#c2185b',
  '#2e7d32',
  '#ed6c02',
  '#7b1fa2',
  '#f9a825',
  '#00897b',
];

const CCMenuCard: React.FC<MenuCardProps> = ({
  name,
  plateLunch,
  grabAndGo,
  message,
  language,
  favArr = [],
  userId,
  dayIndex,
}) => {
  const displayTooltipNames = new Map<string, string>([
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

  const renderItemRow = (item: string) => (
    <Grid container spacing={1} alignItems="center" key={item} sx={{ py: 0.65 }}>
      <Grid size={userId === -21 ? 12 : 10}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.45, color: 'text.primary', fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
          {item}
        </Typography>
      </Grid>
      {item && userId !== -21 && !sdxFilter.includes(item) && (
        <Grid size={2} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={displayTooltipNames.get(language)} placement="bottom" arrow>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <StarButton
                item={item}
                isStarred={isFav(favArray, item)}
                onToggle={() => handleToggle(item)}
              />
            </Box>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );

  const headers = getSectionHeaders(language);
  const accentColor = dayAccentColors[dayIndex % dayAccentColors.length];

  return (
    <Card className="custom-scrollbar" sx={menuCardSx}>
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: { xs: 0.5, sm: 0.75 },
          borderBottom: 1,
          borderColor: 'divider',
          borderLeft: 4,
          borderLeftColor: accentColor,
          bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
        }}
      >
        <Typography variant="subtitle1" sx={menuCardTitleSx}>
          {name}
        </Typography>
      </Box>

      {(grabAndGo.length > 0 && plateLunch.length > 0) ? (
        <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
            <UtensilsCrossed size={14} strokeWidth={2.25} />
            <Typography sx={menuSectionLabelSx}>
              {headers[0]}
            </Typography>
          </Stack>
          <Box sx={{ mb: 2 }}>
            {plateLunch.map((item, index) => (
              <React.Fragment key={item}>
                {renderItemRow(item)}
                {index < plateLunch.length - 1 && (
                  <Divider sx={{ borderColor: 'divider' }} />
                )}
              </React.Fragment>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
            <ShoppingBag size={14} strokeWidth={2.25} />
            <Typography sx={menuSectionLabelSx}>
              {headers[1]}
            </Typography>
          </Stack>
          <Box>
            {grabAndGo.map((item, index) => (
              <React.Fragment key={item}>
                {renderItemRow(item)}
                {index < grabAndGo.length - 1 && (
                  <Divider sx={{ borderColor: 'divider' }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </CardContent>
      ) : (
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, px: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.75rem', lg: '2rem' },
              lineHeight: 1.3,
            }}
          >
            {`${message} ${checkHoliday(message)}`}
          </Typography>
        </CardContent>
      )}
    </Card>
  );
};

export default CCMenuCard;
