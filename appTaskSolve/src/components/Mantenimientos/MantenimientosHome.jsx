import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CategoryIcon from '@mui/icons-material/Category';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';

const rainbowShift = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
`;

export default function MantenimientosHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const modules = [
    {
      key: 'tecnicos',
      title: t('maintenance.modules.tecnicos.title'),
      description: t('maintenance.modules.tecnicos.description'),
      primary: '/tecnicos/listado',
      create: '/tecnicos/crear',
      color: 'info',
      Icon: EngineeringIcon,
    },
    {
      key: 'categorias',
      title: t('maintenance.modules.categorias.title'),
      description: t('maintenance.modules.categorias.description'),
      // Abrir módulo ahora lleva al catálogo (listado)
      primary: '/categorias',
      // Crear nuevo abre la vista de mantenimiento con el formulario
      create: '/mantenimientos/categorias',
      color: 'warning',
      Icon: CategoryIcon,
    },
    {
      key: 'tickets',
      title: t('maintenance.modules.tickets.title'),
      description: t('maintenance.modules.tickets.description'),
      // Panel ahora apunta al inicio (home) solicitado
      primary: '/',
      create: '/tickets/crear',
      color: 'success',
      Icon: ConfirmationNumberIcon,
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Header Profesional - Estilo Panel Ejecutivo */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 55%, #0d47a1 100%)',
          borderRadius: 3,
          p: 2.2,
          mb: 4,
          boxShadow: '0 6px 22px rgba(25,118,210,0.25)',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.14)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 65%)',
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #2e7d32, #1976d2, #ed6c02, #d32f2f)',
            backgroundSize: '300% 100%',
            animation: `${rainbowShift} 8s linear infinite`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{
              bgcolor: 'rgba(255, 255, 255, 0.28)',
              borderRadius: '50%',
              p: 1.3,
              display: 'flex',
              border: '2px solid rgba(255, 255, 255, 0.42)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <EngineeringIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 800, 
                color: 'white', 
                mb: 0.3, 
                letterSpacing: '-0.5px', 
                textShadow: '0 2px 6px rgba(0,0,0,0.25)',
                fontSize: '1.55rem'
              }}>
                {t('maintenance.title')}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontWeight: 600, 
                fontSize: '0.75rem'
              }}>
                {t('maintenance.subtitle')}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Grid container spacing={3}>
          {/* Primera fila: dos módulos destacados lado a lado */}
          {modules.slice(0,2).map(m => {
            const Icon = m.Icon;
            return (
              <Grid item xs={12} md={6} key={m.key}>
                <Card
                  elevation={0}
                  sx={theme => ({
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 4,
                    px: 3.5,
                    pt: 4,
                    pb: 3.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 220,
                    background: `linear-gradient(125deg, ${alpha(theme.palette[m.color].light,0.15)}, ${alpha(theme.palette.background.paper,1)})`,
                    border: `3px solid ${alpha(theme.palette[m.color].main,0.4)}`,
                    boxShadow: `0 8px 28px -6px ${alpha(theme.palette[m.color].main,0.35)}`,
                    transition: 'all .3s',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: -40,
                      right: -40,
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      background: alpha(theme.palette[m.color].main,0.12),
                      filter: 'blur(25px)'
                    },
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 16px 40px -4px ${alpha(theme.palette[m.color].main,0.45)}`,
                      borderColor: theme.palette[m.color].main
                    }
                  })}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={theme => ({
                      width: 80,
                      height: 80,
                      borderRadius: 3.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(140deg, ${theme.palette[m.color].main}, ${theme.palette[m.color].dark})`,
                      boxShadow: `0 8px 20px -4px ${alpha(theme.palette[m.color].main,0.5)}, inset 0 0 0 2px rgba(255,255,255,0.2)`,
                      color: theme.palette[m.color].contrastText,
                      border: '2px solid #fff'
                    })}>
                      <Icon sx={{ fontSize: 44, color: 'common.white' }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth:0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: .5 }}>{m.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.4 }}>{m.description}</Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ opacity: .3 }} />
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: .5 }}>
                    <Button
                      size="small"
                      color={m.color}
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => navigate(m.primary)}
                      sx={{ fontWeight:700, px:2.2 }}
                    >
                      {t('maintenance.actions.openModule')}
                    </Button>
                    <Button
                      size="small"
                      color={m.color}
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => navigate(m.create)}
                      sx={{ fontWeight:700, px:2 }}
                    >
                      {t('maintenance.actions.createNew')}
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
          {/* Segunda fila: tarjeta horizontal extendida para tickets */}
          <Grid item xs={12}>
            {modules.slice(2,3).map(m => {
              const Icon = m.Icon;
              return (
                <Card
                  key={m.key}
                  elevation={0}
                  sx={theme => ({
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 4,
                    px: 4,
                    pt: 3.5,
                    pb: 3.5,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 3,
                    alignItems: 'center',
                    background: `linear-gradient(95deg, ${alpha(theme.palette[m.color].light,0.18)}, ${alpha(theme.palette.background.paper,1)})`,
                    border: `3px solid ${alpha(theme.palette[m.color].main,0.4)}`,
                    boxShadow: `0 8px 28px -6px ${alpha(theme.palette[m.color].main,0.35)}`,
                    transition: 'all .3s',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: -60,
                      left: -60,
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: alpha(theme.palette[m.color].main,0.12),
                      filter: 'blur(30px)'
                    },
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 16px 40px -4px ${alpha(theme.palette[m.color].main,0.45)}`,
                      borderColor: theme.palette[m.color].main
                    }
                  })}
                >
                  <Box sx={theme => ({
                    width: 96,
                    height: 96,
                    borderRadius: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(140deg, ${theme.palette[m.color].main}, ${theme.palette[m.color].dark})`,
                    boxShadow: `0 8px 20px -4px ${alpha(theme.palette[m.color].main,0.5)}, inset 0 0 0 2px rgba(255,255,255,0.2)`,
                    border: '2px solid #fff'
                  })}>
                    <Icon sx={{ fontSize: 52, color: 'common.white' }} />
                  </Box>
                  <Box sx={{ flexGrow:1, minWidth:0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: .75 }}>{m.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, lineHeight:1.5 }}>{m.description}</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap:'wrap' }}>
                      <Tooltip title={t('maintenance.tooltips.viewPanel')}>
                        <Button size="small" color={m.color} variant="contained" startIcon={<OpenInNewIcon />} onClick={() => navigate(m.primary)} sx={{ fontWeight:700 }}>{t('maintenance.actions.panel')}</Button>
                      </Tooltip>
                      <Tooltip title={t('maintenance.tooltips.createTestTicket')}>
                        <Button size="small" color={m.color} variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate(m.create)} sx={{ fontWeight:700 }}>{t('maintenance.actions.newTicket')}</Button>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Grid>
        </Grid>
        <Typography variant="caption" sx={{ color: 'text.disabled', display:'block', textAlign:'center', mt: 6 }}>
          {t('footer.copy', { year: new Date().getFullYear() })}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display:'block', textAlign:'center' }}>
          {t('footer.developedBy')}
        </Typography>
      </Container>
    </Box>
  );
}
