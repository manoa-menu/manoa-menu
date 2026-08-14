'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import type { TypographyProps } from '@mui/material/Typography';

import { englishSourceLabel } from '@/lib/englishSource';

interface TranslatedDishNameProps {
  name: string;
  englishName?: string;
  variant?: TypographyProps['variant'];
  nameSx?: SxProps<Theme>;
}

const TranslatedDishName: React.FC<TranslatedDishNameProps> = ({
  name,
  englishName,
  variant = 'body2',
  nameSx,
}) => {
  const source = englishSourceLabel(name, englishName);

  return (
    <Box>
      <Typography
        variant={variant}
        sx={{
          fontWeight: 600,
          lineHeight: 1.35,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          ...nameSx,
        }}
      >
        {name}
      </Typography>
      {source ? (
        <Typography
          variant="caption"
          component="div"
          lang="en"
          sx={{
            mt: 0.15,
            color: 'text.secondary',
            fontSize: '0.78rem',
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: 0,
          }}
        >
          {source}
        </Typography>
      ) : null}
    </Box>
  );
};

export default TranslatedDishName;
