import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Home from '../Home/Home';
import MisTickets from './MisTickets';

/**
 * ClienteHub Component
 * 
 * Componente que actúa como hub para clientes.
 * Los TABs (Inicio / Mis Tickets) se controlan desde el Header.
 * Este componente solo renderiza el contenido basado en la ruta.
 * 
 * Solo accesible por usuarios con rol "Cliente" (id_rol = 3)
 */
export default function ClienteHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();

  // Determinar TAB actual basado en la ruta
  const currentTab = useMemo(() => {
    return location.pathname.includes('/cliente/mistickets')
      ? 'mistickets'
      : 'inicio';
  }, [location.pathname]);

  // Validar que el usuario sea cliente
  const isCliente = user?.rol?.toLowerCase() === 'cliente' || 
                    String(user?.id_rol) === '3';

  if (!isCliente) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {t('cliente.accessDenied') || 'Acceso denegado. Solo clientes pueden acceder a este módulo.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Renderizar contenido basado en ruta */}
      {currentTab === 'mistickets' ? <MisTickets /> : <Home />}
    </Box>
  );
}
