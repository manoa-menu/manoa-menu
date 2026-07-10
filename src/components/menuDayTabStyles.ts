import type { SxProps, Theme } from '@mui/material';

const MENU_GREEN = '#035a3e';
const MENU_GREEN_SOFT = 'rgba(3, 90, 62, 0.08)';
const MENU_GREEN_MUTED = 'rgba(3, 90, 62, 0.68)';
const MENU_GREEN_HOVER = 'rgba(3, 90, 62, 0.12)';

const dayTabLinkSx = {
  fontSize: '0.875rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  px: 1.35,
  py: 0.7,
  color: MENU_GREEN_MUTED,
  border: 'none !important',
  borderBottom: '2px solid transparent !important',
  borderRadius: '8px 8px 0 0',
  transition: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    color: MENU_GREEN,
    backgroundColor: MENU_GREEN_HOVER,
    borderBottomColor: 'transparent !important',
    isolation: 'isolate',
  },
  '&.active': {
    color: `${MENU_GREEN} !important`,
    backgroundColor: 'rgba(3, 90, 62, 0.1) !important',
    borderBottomColor: `${MENU_GREEN} !important`,
    fontWeight: 700,
  },
} as const;

/** Horizontally scrollable day tabs — mobile */
export const getMenuDayTabsScrollSx = (tabsOverflow: boolean): SxProps<Theme> => ({
  position: 'relative',
  '& .nav': {
    flexWrap: 'nowrap',
    justifyContent: tabsOverflow ? 'flex-start' : 'center',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    gap: 0.25,
    px: 0.5,
    py: 0.35,
    mb: '0 !important',
    borderRadius: '12px',
    backgroundColor: MENU_GREEN_SOFT,
    borderBottom: `1px solid rgba(3, 90, 62, 0.14) !important`,
    '&::-webkit-scrollbar': { display: 'none' },
  },
  '& .nav-link': dayTabLinkSx,
  '& .tab-content': {
    mt: 1,
  },
});

/** Wrapped day tabs — desktop / tablet */
export const menuDayTabsDesktopSx: SxProps<Theme> = {
  position: 'relative',
  backgroundColor: '#fff',
  '& .nav': {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 0.25,
    px: 0.5,
    py: 0.35,
    mb: '0 !important',
    borderRadius: '12px',
    backgroundColor: MENU_GREEN_SOFT,
    borderBottom: `1px solid rgba(3, 90, 62, 0.14) !important`,
  },
  '& .nav-link': dayTabLinkSx,
  '& .tab-content': {
    mt: 1,
  },
};

/** Pill-style day tabs — matches location/language switchers */
export const menuDayTabsSx: SxProps<Theme> = {
  position: 'relative',
  '& .nav': {
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    gap: 0.5,
    pb: 0.25,
    px: 0.25,
    mb: '0 !important',
    borderBottom: 'none !important',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  '& .nav-link': {
    fontSize: '0.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    px: 1.5,
    py: 0.65,
    borderRadius: '999px',
    border: 'none !important',
    color: MENU_GREEN_MUTED,
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&:hover': {
      color: MENU_GREEN,
      backgroundColor: MENU_GREEN_HOVER,
      isolation: 'isolate',
    },
    '&.active': {
      color: '#fff !important',
      backgroundColor: `${MENU_GREEN} !important`,
      fontWeight: 700,
    },
  },
  '& .tab-content': {
    mt: 1,
  },
};

export const menuDayTabFadeSx = (side: 'left' | 'right', visible: boolean) => ({
  position: 'absolute' as const,
  top: 0,
  [side]: 0,
  width: 48,
  height: '100%',
  pointerEvents: 'none' as const,
  zIndex: 2,
  opacity: visible ? 1 : 0,
  transition: 'opacity 0.25s ease',
  background: side === 'left'
    ? 'linear-gradient(to right, rgba(237, 244, 241, 1) 0%, rgba(237, 244, 241, 0.95) 40%,'
      + ' rgba(237, 244, 241, 0.45) 70%, rgba(237, 244, 241, 0) 100%)'
    : 'linear-gradient(to left, rgba(237, 244, 241, 1) 0%, rgba(237, 244, 241, 0.95) 40%,'
      + ' rgba(237, 244, 241, 0.45) 70%, rgba(237, 244, 241, 0) 100%)',
});
