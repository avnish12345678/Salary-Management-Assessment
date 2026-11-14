import { alpha, createTheme } from '@mui/material/styles';

const ink = '#071926';
const navy = '#0B3D5C';
const teal = '#0F766E';
const mist = '#EEF4F8';
const line = '#D5E1EC';

export const acmeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: navy,
      dark: ink,
      light: '#1F5F84',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: teal,
      dark: '#0A5C56',
      light: '#14B8A6',
      contrastText: '#FFFFFF',
    },
    background: {
      default: mist,
      paper: '#FFFFFF',
    },
    text: {
      primary: '#102A43',
      secondary: '#5B738B',
    },
    divider: line,
    success: { main: '#0F766E' },
    info: { main: '#1F5F84' },
  },
  typography: {
    fontFamily: '"Sora", "Segoe UI", sans-serif',
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontFamily: '"Sora", "Segoe UI", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.14em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mist,
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${navy} ${mist}`,
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: mist,
          borderRadius: 999,
        },
        '*::-webkit-scrollbar-thumb': {
          background: `linear-gradient(180deg, ${navy} 0%, #1F5F84 100%)`,
          borderRadius: 999,
          border: `2px solid ${mist}`,
          backgroundClip: 'padding-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: `linear-gradient(180deg, ${teal} 0%, ${navy} 100%)`,
          border: `2px solid ${mist}`,
          backgroundClip: 'padding-box',
        },
        '*::-webkit-scrollbar-button': {
          display: 'none',
          width: 0,
          height: 0,
        },
        '*::-webkit-scrollbar-corner': {
          backgroundColor: mist,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 10px 24px rgba(11, 61, 92, 0.22)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(ink, 0.08)}`,
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.9))',
          boxShadow: '0 10px 30px rgba(7, 25, 38, 0.04)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(ink, 0.08)}`,
          backgroundImage: 'linear-gradient(180deg, #FFFFFF, #F8FBFD)',
          boxShadow: '0 10px 30px rgba(7, 25, 38, 0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: alpha('#FFFFFF', 0.72),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha(ink, 0.06)}`,
        },
        standardInfo: {
          backgroundColor: alpha(navy, 0.06),
          color: navy,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        slotProps: {
          backdrop: {
            sx: {
              backgroundColor: alpha(ink, 0.55),
              backdropFilter: 'blur(6px)',
            },
          },
        },
      },
      styleOverrides: {
        paper: {
          borderRadius: 18,
          border: `1px solid ${alpha(ink, 0.1)}`,
          backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F7FAFC 100%)',
          boxShadow: '0 28px 70px rgba(7, 25, 38, 0.28)',
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: navy,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '20px !important',
          backgroundColor: alpha(mist, 0.35),
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '14px 20px 18px',
          borderTop: `1px solid ${alpha(ink, 0.08)}`,
          backgroundColor: alpha('#FFFFFF', 0.92),
          gap: 8,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: `linear-gradient(180deg, ${alpha(navy, 0.08)} 0%, ${alpha(mist, 0.9)} 100%)`,
          '& .MuiTableCell-head': {
            color: navy,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${alpha(ink, 0.1)}`,
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:nth-of-type(even)': {
            backgroundColor: alpha(mist, 0.55),
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: `${alpha(teal, 0.08)} !important`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(ink, 0.06)}`,
          color: '#102A43',
          fontSize: '0.875rem',
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${alpha(ink, 0.08)}`,
          color: '#5B738B',
          backgroundColor: alpha('#FFFFFF', 0.9),
        },
        selectIcon: {
          color: navy,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
        },
        colorSuccess: {
          backgroundColor: alpha(teal, 0.14),
          color: teal,
        },
      },
    },
  },
});
