import Box from '@mui/material/Box';
import { ReactNode } from 'react';

interface TabPanelTransitionProps {
  panelKey: string;
  children: ReactNode;
}

const TabPanelTransition = ({ panelKey, children }: TabPanelTransitionProps) => (
  <Box
    key={panelKey}
    sx={{
      animation: 'tabPanelEnter 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
      '@keyframes tabPanelEnter': {
        from: {
          opacity: 0,
          transform: 'translateY(10px)',
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    }}
  >
    {children}
  </Box>
);

export default TabPanelTransition;
