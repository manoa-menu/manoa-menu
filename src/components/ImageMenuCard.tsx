import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import { green, lightGreen } from '@mui/material/colors';
import { Vegan, Salad, UtensilsCrossed } from 'lucide-react';
import StarButton from '@/components/StarButton';

interface ImageMenuCardProps {
  name: string;
  description?: string;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isStarred?: boolean;
  onToggleStar?: () => void;
  language?: string;
  userId?: number;
  tags?: string[];
  hideStar?: boolean;
}

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1484723091791-c0e7e147c301?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
];

const getStableImage = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FOOD_IMAGES[hash % FOOD_IMAGES.length];
};

const displayTooltipNames = new Map<string, string[]>([
  ['English', ['Vegan', 'Vegetarian']],
  ['Japanese', ['ビーガン', 'ベジタリアン']],
  ['Korean', ['비건', '채식주의']],
  ['Chinese', ['纯素', '素食']],
]);

const ImageMenuCard: React.FC<ImageMenuCardProps> = ({
  name,
  description,
  isVegan,
  isVegetarian,
  isStarred,
  onToggleStar,
  language = 'English',
  userId = -21,
  hideStar = false,
}) => {
  const imageUrl = getStableImage(name);
  
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        animation: 'fadeIn 0.4s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="100"
          image={imageUrl}
          alt={name}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* Badges container */}
        <Box sx={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 0.5 }}>
          {isVegan && (
            <Tooltip title={displayTooltipNames.get(language)?.[0] || 'Vegan'} placement="top" arrow>
              <Avatar sx={{ bgcolor: green[500], width: 22, height: 22, boxShadow: 1 }}>
                <Vegan color={green[50]} size={14} />
              </Avatar>
            </Tooltip>
          )}
          {isVegetarian && !isVegan && (
            <Tooltip title={displayTooltipNames.get(language)?.[1] || 'Vegetarian'} placement="top" arrow>
              <Avatar sx={{ bgcolor: lightGreen[500], width: 22, height: 22, boxShadow: 1 }}>
                <Salad color={green[50]} size={14} />
              </Avatar>
            </Tooltip>
          )}
        </Box>

        {/* Favorite Star Button */}
        {!hideStar && userId !== -21 && (
          <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
             <Box sx={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.85)', 
               borderRadius: '50%', 
               width: 28, 
               height: 28, 
               display: 'flex', 
               justifyContent: 'center', 
               alignItems: 'center',
               boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
             }}>
               <StarButton
                  item={name}
                  isStarred={!!isStarred}
                  onToggle={onToggleStar || (() => {})}
                />
             </Box>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography 
          variant="subtitle2" 
          component="h3" 
          sx={{ 
            fontWeight: 700, 
            lineHeight: 1.15, 
            mb: description ? 0.5 : 0,
            color: '#2d3748',
            fontSize: '0.9rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {name}
        </Typography>
        
        {description && description !== name && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.75rem',
              lineHeight: 1.2
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageMenuCard;
