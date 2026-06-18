import { SxProps, Theme } from '@mui/material/styles';

export const premiumTabsSx: SxProps<Theme> = {
  mb: 1.5,
  minHeight: { xs: 36, sm: 40, md: 44 },
  width: '100%',
  '& .MuiTabs-scroller': {
    overflow: 'hidden !important',
  },
  '& .MuiTabs-flexContainer': {
    width: '100%',
    gap: { xs: 0.25, sm: 0.5 },
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    flex: '1 1 0',
    minWidth: 0,
    maxWidth: '100%',
    minHeight: { xs: 36, sm: 40, md: 44 },
    fontWeight: 500,
    fontSize: { xs: '0.65rem', sm: '0.72rem', md: '0.8125rem' },
    letterSpacing: '-0.01em',
    px: { xs: 0.25, sm: 0.5, md: 1 },
    py: 0.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s ease, background-color 0.2s ease',
    borderRadius: '10px 10px 0 0',
    '&.Mui-selected': {
      fontWeight: 600,
    },
  },
};

export const glassHeroSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: 960,
  mx: 'auto',
  p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
  borderRadius: { xs: 2.5, sm: 3, md: 4 },
  border: 1,
  borderColor: (theme) => (theme.palette.mode === 'light'
    ? 'rgba(15, 23, 42, 0.08)'
    : 'rgba(255, 255, 255, 0.12)'),
  background: (theme) => (theme.palette.mode === 'light'
    ? 'rgba(255, 255, 255, 0.78)'
    : 'rgba(20, 24, 34, 0.72)'),
  backdropFilter: 'blur(10px) saturate(120%)',
  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
  boxShadow: (theme) => (theme.palette.mode === 'light'
    ? '0 6px 20px rgba(15, 23, 42, 0.07)'
    : '0 6px 20px rgba(0, 0, 0, 0.26)'),
  position: 'relative',
  overflow: 'hidden',
};

export const menuCardSx: SxProps<Theme> = {
  height: '100%',
  borderRadius: 2,
  border: 1,
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper',
  overflow: 'hidden',
};

export const menuSectionLabelSx: SxProps<Theme> = {
  fontSize: { xs: '0.625rem', sm: '0.65rem', md: '0.72rem' },
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const menuCardTitleSx: SxProps<Theme> = {
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'text.primary',
  fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem', lg: '1.05rem' },
};

export const contentEnterSx: SxProps<Theme> = {
  animation: 'contentEnter 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes contentEnter': {
    from: {
      opacity: 0,
      transform: 'translateY(6px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
};
