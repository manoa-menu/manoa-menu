'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';
import { MenuProvider } from '@/lib/MenuContext';

type Props = {
  children?: React.ReactNode;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#035a3e',
    },
  },
});

const Providers = ({ children }: Props) => (
  <SessionProvider>
    <ThemeProvider theme={theme}>
      <MenuProvider>{children}</MenuProvider>
    </ThemeProvider>
  </SessionProvider>
);

export default Providers;
