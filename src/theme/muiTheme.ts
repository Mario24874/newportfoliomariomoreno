import { createTheme, ThemeOptions } from '@mui/material/styles';

// Función para crear tema basado en el modo
export const createPortfolioTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  
  const baseTheme: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: '#3b82f6', // Azul principal del portfolio
        light: '#60a5fa',
        dark: '#2563eb',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#764ba2', // Morado del gradiente
        light: '#9f6fc6',
        dark: '#5a3a7e',
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981', // Verde para WhatsApp y éxito
        light: '#34d399',
        dark: '#059669',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc', // Fondo principal
        paper: isDark 
          ? 'rgba(30, 41, 59, 0.8)' 
          : 'rgba(255, 255, 255, 0.9)', // Fondo de tarjetas
      },
      text: {
        primary: isDark ? '#f8fafc' : '#1e293b',
        secondary: isDark ? '#cbd5e1' : '#64748b',
      },
      divider: isDark 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
    },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    h1: {
      fontSize: 'clamp(3rem, 8vw, 6rem)',
      fontWeight: 800,
      lineHeight: 0.9,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
      fontWeight: 600,
    },
    body1: {
      fontSize: 'clamp(1rem, 2vw, 1.125rem)',
      lineHeight: 1.7,
      letterSpacing: '-0.005em',
    },
    button: {
      textTransform: 'none', // No uppercase en botones
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Border radius más suave
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: isDark 
            ? 'rgba(30, 41, 59, 0.5)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: isDark 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 20,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: isDark 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'transparent',
          backdropFilter: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&.scrolled': {
            background: isDark 
              ? 'rgba(15, 23, 42, 0.9)'
              : 'rgba(248, 250, 252, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
        filled: {
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          '&:hover': {
            background: 'rgba(59, 130, 246, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.875rem',
        },
      },
    },
  },
};

  return createTheme(baseTheme);
};

// Tema por defecto (modo oscuro)
const muiTheme = createPortfolioTheme('dark');

export default muiTheme;