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

  const getDayColor = (index: number): string => {
    const colorPalette = [
      '#E3F2FD', // Light Blue
      '#FCE4EC', // Light Pink
      '#E8F5E9', // Light Green
      '#FFF3E0', // Light Orange
      '#F3E5F5', // Light Purple
      '#FFF9C4', // Light Yellow
      '#E0F2F1', // Light Teal
    ];
    return colorPalette[index % colorPalette.length];
  };

  const renderItemRow = (item: string) => (
    <Grid
      container
      spacing={1}
      alignItems="center"
      key={item}
      sx={{ py: 0.5, '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 0.5 } }}
    >
      <Grid size={userId === -21 ? 12 : 10}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
          {item}
        </Typography>
      </Grid>
      {item && userId !== -21 && !sdxFilter.includes(item) && (
        <Grid size={2} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={displayTooltipNames.get(language)} placement="bottom" arrow>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StarButton
                item={item}
                isStarred={isFav(favArray, item)}
                onToggle={() => handleToggle(item)}
              />
            </div>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );

  const headers = getSectionHeaders(language);

  return (
    <Card
      className="custom-scrollbar"
      sx={{
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          backgroundColor: getDayColor(dayIndex),
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {name}
        </Typography>
      </Box>

      {(grabAndGo.length > 0 && plateLunch.length > 0) ? (
        <CardContent sx={{ px: 1.75, py: 1.5 }}>
          {/* Plate Lunch Section */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
            <UtensilsCrossed size={16} color="#666" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444', fontSize: '0.95rem' }}>
              {headers[0]}
            </Typography>
          </Stack>
          <Box sx={{ mb: 1.75 }}>
            {plateLunch.map((item, index) => (
              <React.Fragment key={item}>
                {renderItemRow(item)}
                {index < plateLunch.length - 1 && (
                  <Divider sx={{ my: 0.125, borderColor: '#e0e0e0' }} />
                )}
              </React.Fragment>
            ))}
          </Box>

          <Divider sx={{ my: 1.25 }} />

          {/* Grab and Go Section */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, mt: 1 }}>
            <ShoppingBag size={16} color="#666" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444', fontSize: '0.95rem' }}>
              {headers[1]}
            </Typography>
          </Stack>
          <Box>
            {grabAndGo.map((item, index) => (
              <React.Fragment key={item}>
                {renderItemRow(item)}
                {index < grabAndGo.length - 1 && (
                  <Divider sx={{ my: 0.125, borderColor: '#e0e0e0' }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </CardContent>
      ) : (
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, textAlign: 'center', color: '#666' }}>
            {`${message} ${checkHoliday(message)}`}
          </Typography>
        </CardContent>
      )}
    </Card>
  );
};

export default CCMenuCard;
