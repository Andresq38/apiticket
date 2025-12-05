import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TecnicosHub() {
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { label: t('menuLabels.equipo'), to: '/tecnicos/listado', value: 'listado' },
    { label: t('menuLabels.asignaciones'), to: '/tecnicos/asignaciones', value: 'asignaciones' },
    { label: t('menuLabels.bandeja'), to: '/tecnicos/tickets', value: 'tickets' },
  ];

  const current = tabs.find(t => location.pathname.includes(`/tecnicos/${t.value}`))?.value || 'listado';

  const hideTabs = location.pathname.includes('/tecnicos/crear');

  return (
    <Box sx={{ width: '100%' }}>
      {!hideTabs && (
        <Tabs
          value={current}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#fff', height: 3 } }}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 1,
            px: { xs: 1, md: 2 },
            pt: 0.5,
            mb: 2,
            '& .MuiTab-root': { fontWeight: 700, color: 'white' },
          }}
        >
          {tabs.map(t => (
            <Tab
              key={t.value}
              label={t.label}
              value={t.value}
              component={NavLink}
              to={t.to}
              sx={{
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            />
          ))}
        </Tabs>
      )}

      <Box sx={{ mt: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
