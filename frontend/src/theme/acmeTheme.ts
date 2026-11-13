import { createTheme } from '@mui/material/styles';

export const acmeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B3D5C',
      dark: '#072A40',
      light: '#1F5F84',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F766E',
    },
    background: {
      default: '#F3F6F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#102A43',
      secondary: '#486581',
    },
    divider: '#D9E2EC',
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #D9E2EC',
        },
      },
    },
  },
});
