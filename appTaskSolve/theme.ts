import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      light: '#2563eb',
      main: '#1e40af',
      dark: '#0f2c8c',
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#8b5cf6',
      main: '#6b21a8',
      dark: '#4c1d95',
      contrastText: '#ffffff'
    },
    info: {
      main: '#3b82f6',
      dark: '#1d4ed8'
    },
    success: {
      main: '#10b981',
      dark: '#059669'
    },
    warning: {
      light: '#fbbf24',
      main: '#f59e0b',
      dark: '#d97706'
    },
    error: {
      main: '#ef4444',
      dark: '#b91c1c'
    },
    background: {
      default: '#f6f8fb',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
});
