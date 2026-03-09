'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';

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
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </SessionProvider>
);

export default Providers;
