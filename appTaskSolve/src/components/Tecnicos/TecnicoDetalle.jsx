import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Container, Typography, CircularProgress, Box, Alert, Paper, Chip, Grid, Button, Divider, Snackbar } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import EditIcon from '@mui/icons-material/Edit';
import TecnicoService from '../../services/TecnicoService';
import { getApiOrigin } from '../../utils/apiBase';

const apiBase = getApiOrigin();

export default function TecnicoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/apiticket/tecnico/${id}`);
      setData(res.data || null);
    } catch (e) {
      console.error(e);
      setError(t('tecnicoDetail.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleDisponibilidad = async () => {
    if (toggling) return;

    // Optimistic update
    const previousData = { ...data };
    const newDisponibilidad = !data.disponibilidad_tabla;
    
    setData({
      ...data,
      disponibilidad_tabla: newDisponibilidad,
      disponibilidad_calculada: newDisponibilidad
    });

    setToggling(true);
    
    try {
      await TecnicoService.toggleDisponibilidad(id);
      setSnackbar({
        open: true,
        message: t('tecnicoDetail.availabilityChanged', { 
          status: newDisponibilidad ? t('tecnicoDetail.available') : 'Ocupado' 
        }),
        severity: 'success'
      });
      // Recargar datos actualizados del servidor
      await loadData();
    } catch (e) {
      console.error(e);
      // Rollback en caso de error
      setData(previousData);
      setSnackbar({
        open: true,
        message: t('tecnicoDetail.availabilityChangeError'),
        severity: 'error'
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">{t('tecnicoDetail.notFound')}</Alert>;

  const ticketsAbiertos = data.tickets_abiertos ?? 0;
  const disponibleCalculada = ticketsAbiertos < 5;
  const disponibilidad = (data.disponibilidad_tabla ?? data.disponibilidad_calculada) ? t('tecnicoDetail.available') : 'Ocupado';
  
  // Calcular color de carga
  let cargaColor = 'success';
  let cargaLabel = t('menuLabels.disponible');
  if (ticketsAbiertos >= 5) {
    cargaColor = 'error';
    cargaLabel = t('menuLabels.saturado');
  } else if (ticketsAbiertos >= 3) {
    cargaColor = 'warning';
    cargaLabel = t('menuLabels.ocupado');
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('tecnicoDetail.technician', { name: data.nombre_usuario })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/tecnicos/editar/${id}`)}
          >
            {t('tecnicoDetail.edit')}
          </Button>
          <Button 
            variant="contained" 
            color={disponibilidad === t('tecnicoDetail.available') ? 'warning' : 'success'}
            startIcon={<ToggleOnIcon />}
            onClick={handleToggleDisponibilidad}
            disabled={toggling}
          >
            {toggling ? t('tecnicoDetail.changing') : disponibilidad === t('tecnicoDetail.available') ? t('tecnicoDetail.markBusy') : t('technicianForm.available')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/tecnicos')}>{t('tecnicoDetail.backToList')}</Button>
        </Box>
      </Box>

      {/* Datos personales */}
      <Paper sx={{ p: 3, mb: 3, borderTop: 4, borderTopColor: disponibleCalculada ? 'success.main' : 'warning.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>{t('tecnicoDetail.personalData')}</Typography>
        <Typography><strong>{t('tecnicoDetail.fullName')}</strong> {data.nombre_usuario}</Typography>
        <Typography><strong>{t('tecnicoDetail.email')}</strong> {data.correo_usuario}</Typography>
        <Typography><strong>{t('tecnicoDetail.technicianId')}</strong> {data.id_tecnico}</Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Disponibilidad */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {disponibleCalculada ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
          <Typography variant="body2">
            <strong>{t('tecnicoDetail.availability')}</strong>
          </Typography>
          <Chip 
            size="small" 
            label={disponibilidad} 
            color={disponibilidad === t('tecnicoDetail.available') ? 'success' : 'warning'} 
            variant="filled"
          />
          <Typography variant="caption" color="text.secondary">
            ({disponibleCalculada ? t('tecnicoDetail.acceptsNewTickets') : t('tecnicoDetail.highLoad')})
          </Typography>
        </Box>

        {/* Tickets abiertos */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <strong>{t('tecnicoDetail.openTickets')}</strong>
          </Typography>
          <Chip 
            size="small" 
            label={`${ticketsAbiertos} ${ticketsAbiertos === 1 ? 'ticket' : 'tickets'}`}
            color={cargaColor}
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={cargaLabel}
            color={cargaColor}
          />
        </Box>
      </Paper>

      {/* Carga de trabajo */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" color="primary">{t('tecnicoDetail.workloadByStatus')}</Typography>
        </Box>
        {Array.isArray(data.carga_trabajo) && data.carga_trabajo.length > 0 ? (
          <Grid container spacing={2}>
            {data.carga_trabajo.map((r, idx) => {
              // Colores según estado
              let color = 'default';
              if (r.estado === 'Abierto') color = 'info';
              else if (r.estado === 'En progreso') color = 'warning';
              else if (r.estado === 'Cerrado') color = 'success';
              else if (r.estado === 'Pendiente') color = 'secondary';

              return (
                <Grid item xs={6} sm={4} md={3} key={idx}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h4" color={`${color}.main`}>
                      {r.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.estado}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography color="text.secondary">{t('tecnicoDetail.noTicketsAssigned')}</Typography>
        )}
      </Paper>

      {/* Especialidades */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h6" color="primary">{t('tecnicoDetail.specialties')}</Typography>
        </Box>
        {Array.isArray(data.especialidades) && data.especialidades.length > 0 ? (
          <Grid container spacing={2}>
            {data.especialidades.map((e) => (
              <Grid item key={e.id_especialidad} xs={12} sm={6} md={4}>
                <Paper 
                  elevation={2}
                  sx={{ 
                    p: 2, 
                    borderLeft: 3, 
                    borderLeftColor: 'primary.main',
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                    {e.nombre}
                  </Typography>
                  {e.descripcion && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {e.descripcion}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" variant="outlined">{t('tecnicoDetail.noSpecialties')}</Alert>
        )}
      </Paper>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
