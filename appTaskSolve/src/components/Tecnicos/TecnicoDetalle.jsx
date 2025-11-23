import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      setError('No se pudo cargar la información del técnico.');
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
        message: `Disponibilidad cambiada a ${newDisponibilidad ? 'Disponible' : 'Ocupado'}`,
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
        message: 'Error al cambiar disponibilidad',
        severity: 'error'
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">Técnico no encontrado</Alert>;

  const ticketsAbiertos = data.tickets_abiertos ?? 0;
  const disponibleCalculada = ticketsAbiertos < 5;
  const disponibilidad = (data.disponibilidad_tabla ?? data.disponibilidad_calculada) ? 'Disponible' : 'Ocupado';
  
  // Calcular color de carga
  let cargaColor = 'success';
  let cargaLabel = 'Disponible';
  if (ticketsAbiertos >= 5) {
    cargaColor = 'error';
    cargaLabel = 'Saturado';
  } else if (ticketsAbiertos >= 3) {
    cargaColor = 'warning';
    cargaLabel = 'Ocupado';
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Técnico: {data.nombre_usuario}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/tecnicos/editar/${id}`)}
          >
            Editar
          </Button>
          <Button 
            variant="contained" 
            color={disponibilidad === 'Disponible' ? 'warning' : 'success'}
            startIcon={<ToggleOnIcon />}
            onClick={handleToggleDisponibilidad}
            disabled={toggling}
          >
            {toggling ? 'Cambiando...' : disponibilidad === 'Disponible' ? 'Marcar Ocupado' : 'Marcar Disponible'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/tecnicos')}>Volver al listado</Button>
        </Box>
      </Box>

      {/* Datos personales */}
      <Paper sx={{ p: 3, mb: 3, borderTop: 4, borderTopColor: disponibleCalculada ? 'success.main' : 'warning.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>Datos personales</Typography>
        <Typography><strong>Nombre:</strong> {data.nombre_usuario}</Typography>
        <Typography><strong>Correo:</strong> {data.correo_usuario}</Typography>
        <Typography><strong>ID Técnico:</strong> {data.id_tecnico}</Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Disponibilidad */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {disponibleCalculada ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
          <Typography variant="body2">
            <strong>Disponibilidad:</strong>
          </Typography>
          <Chip 
            size="small" 
            label={disponibilidad} 
            color={disponibilidad === 'Disponible' ? 'success' : 'warning'} 
            variant="filled"
          />
          <Typography variant="caption" color="text.secondary">
            ({disponibleCalculada ? 'Acepta nuevos tickets' : 'Carga alta'})
          </Typography>
        </Box>

        {/* Tickets abiertos */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon fontSize="small" color="action" />
          <Typography variant="body2">
            <strong>Tickets abiertos:</strong>
          </Typography>
          <Chip 
            size="small" 
            label={`${ticketsAbiertos} tickets`}
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
          <Typography variant="h6" color="primary">Carga de trabajo por estado</Typography>
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
          <Typography color="text.secondary">Sin tiquetes asignados</Typography>
        )}
      </Paper>

      {/* Especialidades */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h6" color="primary">Especialidades</Typography>
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
          <Alert severity="info" variant="outlined">No se registran especialidades</Alert>
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
