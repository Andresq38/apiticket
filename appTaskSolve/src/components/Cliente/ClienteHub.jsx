import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import CreateTicket from '../Tickets/CreateTicket';
import MisTickets from './MisTickets';
import TicketsIcon from '@mui/icons-material/Assignment';
import AddCircleIcon from '@mui/icons-material/AddCircle';

/**
 * ClienteHub Component
 * 
 * Componente que actúa como hub para clientes con dos TABs:
 * 1. Mis Tickets - muestra los tickets que ha creado el cliente
 * 2. Nuevo Ticket - formulario para crear un nuevo ticket
 * 
 * Solo accesible por usuarios con rol "Cliente" (id_rol = 3)
 */
export default function ClienteHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determinar TAB actual basado en la ruta
  const currentTab = location.pathname.includes('/cliente/nuevo')
    ? 'nuevo'
    : 'mistickets';

  const [activeTab, setActiveTab] = useState(currentTab);

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

  const tabs = [
    {
      label: t('cliente.myTickets') || 'Mis Tickets',
      value: 'mistickets',
      icon: <TicketsIcon />,
      component: <MisTickets />
    },
    {
      label: t('cliente.newTicket') || 'Nuevo Ticket',
      value: 'nuevo',
      icon: <AddCircleIcon />,
      component: <CreateTicket isFromHub={true} />
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const activeTabData = tabs.find(t => t.value === activeTab);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="inherit"
        TabIndicatorProps={{
          style: {
            backgroundColor: '#fff',
            height: 3
          }
        }}
        sx={{
          bgcolor: 'primary.main',
          borderBottom: `2px solid ${theme.palette.divider}`,
          '& .MuiTab-root': {
            minWidth: isMobile ? 'auto' : 150,
            fontSize: isMobile ? '0.85rem' : '1rem',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#fff',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ pt: 0 }}>
        {activeTabData?.component}
      </Box>
    </Box>
  );
}
