import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
// Fonts
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './themes/index.css';
import { UserProvider } from './context/UserContext';
import theme from './theme/theme';
import i18n from "i18next";
import { initReactI18next } from 'react-i18next';
import enTranslations from './components/Traducciones/Inglés/en.json';
import esTranslations from './components/Traducciones/Español/es.json';


i18n.use(initReactI18next).init({
  lng: 'en',
  interpolation: {
    escapeValue: false,  
  },
  resources: {
    es: {
      translation: esTranslations,
    },
    en: {
      translation: enTranslations,
    },
  },
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <App />
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);
export default i18n;