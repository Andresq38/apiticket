import React from 'react';
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
import { alpha } from '@mui/material/styles';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CategoryIcon from '@mui/icons-material/Category';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';

export default function MantenimientosHome() {
  const navigate = useNavigate();

  const modules = [
    {
      key: 'tecnicos',
      title: 'Usuarios',
      description: 'Crear usuarios (Administrador, Cliente y Técnico).',
      primary: '/tecnicos/listado',
      create: '/tecnicos/crear',
      color: 'info',
      Icon: EngineeringIcon,
    },
    {
      key: 'categorias',
      title: 'Categorías',
      description: 'Gestionar categorías y asociar etiquetas.',
      // Abrir módulo ahora lleva al catálogo (listado)
      primary: '/categorias',
      // Crear nuevo abre la vista de mantenimiento con el formulario
      create: '/mantenimientos/categorias',
      color: 'warning',
      Icon: CategoryIcon,
    },
    {
      key: 'tickets',
      title: 'Tiquetes',
      description: 'Crear Tiquetes.',
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
        {/* Hero */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Mantenimientos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700 }}>
            Centro de configuración: administra los bloques base del sistema antes de operar en producción.
          </Typography>
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
                    background: `linear-gradient(125deg, ${alpha(theme.palette[m.color].light,0.25)}, ${alpha(theme.palette.background.paper,0.95)})`,
                    border: `1px solid ${alpha(theme.palette[m.color].main,0.35)}`,
                    boxShadow: `0 6px 24px -6px ${alpha(theme.palette[m.color].main,0.45)}`,
                    transition: 'all .25s',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: -40,
                      right: -40,
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      background: alpha(theme.palette[m.color].main,0.15),
                      filter: 'blur(20px)'
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px -4px ${alpha(theme.palette[m.color].main,0.55)}`,
                      borderColor: theme.palette[m.color].main
                    }
                  })}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={theme => ({
                      width: 70,
                      height: 70,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(140deg, ${alpha(theme.palette[m.color].main,0.18)}, ${alpha(theme.palette[m.color].dark,0.25)})`,
                      boxShadow: `inset 0 0 0 1px ${alpha(theme.palette[m.color].dark,0.3)}, 0 6px 14px -4px ${alpha(theme.palette[m.color].main,0.6)}`,
                      color: theme.palette[m.color].contrastText
                    })}>
                      <Icon sx={{ fontSize: 38, color: 'common.white' }} />
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
                      Abrir módulo
                    </Button>
                    <Button
                      size="small"
                      color={m.color}
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => navigate(m.create)}
                      sx={{ fontWeight:700, px:2 }}
                    >
                      Crear nuevo
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
                    background: `linear-gradient(95deg, ${alpha(theme.palette[m.color].light,0.30)}, ${alpha(theme.palette.background.paper,0.95)})`,
                    border: `1px solid ${alpha(theme.palette[m.color].main,0.35)}`,
                    boxShadow: `0 6px 24px -6px ${alpha(theme.palette[m.color].main,0.45)}`,
                    transition: 'all .25s',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: -60,
                      left: -60,
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: alpha(theme.palette[m.color].main,0.18),
                      filter: 'blur(25px)'
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px -4px ${alpha(theme.palette[m.color].main,0.55)}`,
                      borderColor: theme.palette[m.color].main
                    }
                  })}
                >
                  <Box sx={theme => ({
                    width: 84,
                    height: 84,
                    borderRadius: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(140deg, ${alpha(theme.palette[m.color].main,0.2)}, ${alpha(theme.palette[m.color].dark,0.28)})`,
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette[m.color].dark,0.3)}, 0 6px 16px -4px ${alpha(theme.palette[m.color].main,0.6)}`,
                  })}>
                    <Icon sx={{ fontSize: 44, color: 'common.white' }} />
                  </Box>
                  <Box sx={{ flexGrow:1, minWidth:0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: .75 }}>{m.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, lineHeight:1.5 }}>{m.description}</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap:'wrap' }}>
                      <Tooltip title="Ver panel de tickets">
                        <Button size="small" color={m.color} variant="contained" startIcon={<OpenInNewIcon />} onClick={() => navigate(m.primary)} sx={{ fontWeight:700 }}>Panel</Button>
                      </Tooltip>
                      <Tooltip title="Crear tiquete de prueba">
                        <Button size="small" color={m.color} variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate(m.create)} sx={{ fontWeight:700 }}>Nuevo Tiquete</Button>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Grid>
        </Grid>
        <Typography variant="caption" sx={{ color: 'text.disabled', display:'block', textAlign:'center', mt: 6 }}>
          © 2025 Sistema de Tiquetes. Desarrollado por Joseph Segura, Andres Quesada y Andres Castillo
        </Typography>
      </Container>
    </Box>
  );
}
