import { createTheme } from '@mui/material/styles';

// Shared MUI theme for all microfrontends.
// Reason: ensure a consistent brand/UI while allowing each MFE to evolve independently.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a1a1a', // Sophisticated black
      light: '#404040',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d4af37', // Luxury gold
      light: '#e6c866',
      dark: '#b8941f',
      contrastText: '#1a1a1a',
    },
    background: {
      default: '#fafafa', // Clean off-white
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.01em',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.01em',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.025em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.02em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.16)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.025em',
          padding: '14px 28px',
          fontSize: '0.9rem',
          boxShadow: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            '&::before': {
              left: '100%',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
            transition: 'transform 0.1s',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(26, 26, 26, 0.1)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #404040 100%)',
            color: '#ffffff',
            border: '1px solid transparent',
            '&:hover': {
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
              boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
              transform: 'translateY(0)',
            },
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(135deg, #d4af37 0%, #e6c866 100%)',
            color: '#1a1a1a',
            border: '1px solid transparent',
            '&:hover': {
              background: 'linear-gradient(135deg, #b8941f 0%, #d4af37 100%)',
              boxShadow: '0px 12px 30px rgba(212, 175, 55, 0.4)',
              border: '1px solid rgba(26, 26, 26, 0.1)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #b8941f 0%, #d4af37 100%)',
              transform: 'translateY(0)',
            },
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: 'rgba(0, 0, 0, 0.2)',
          background: 'transparent',
          '&:hover': {
            borderWidth: '2px',
            borderColor: '#1a1a1a',
            background: 'rgba(26, 26, 26, 0.02)',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            background: 'rgba(26, 26, 26, 0.05)',
            transform: 'translateY(0)',
          },
        },
        text: {
          color: 'text.primary',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            background: 'rgba(0, 0, 0, 0.08)',
            transform: 'translateY(0)',
          },
        },
        sizeLarge: {
          padding: '18px 36px',
          fontSize: '1.1rem',
          fontWeight: 700,
        },
        sizeSmall: {
          padding: '10px 20px',
          fontSize: '0.8rem',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(26, 26, 26, 0.02) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 1,
            pointerEvents: 'none',
          },
          '&:hover': {
            boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-6px)',
            '&::before': {
              opacity: 1,
            },
          },
          '&:active': {
            transform: 'translateY(-4px)',
            transition: 'transform 0.1s',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.24)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a1a1a',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: '#1a1a1a',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          '& .MuiRating-iconFilled': {
            color: '#d4af37',
          },
          '& .MuiRating-iconHover': {
            color: '#e6c866',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          background: 'linear-gradient(135deg, #d4af37 0%, #e6c866 100%)',
          color: '#1a1a1a',
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-root .Mui-completed': {
            color: '#2e7d32',
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: '#1a1a1a',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'scale(1.05)',
            transition: 'transform 0.1s',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.25)',
          },
          '&:active': {
            transform: 'scale(1.05)',
            transition: 'transform 0.1s',
          },
        },
      },
    },
  },
});

