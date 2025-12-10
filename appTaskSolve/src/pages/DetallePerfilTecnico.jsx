import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getApiBaseWithPrefix } from '../utils/apiBase';

export default function DetallePerfilTecnico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Si no hay usuario o no es técnico, redirigir
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const normalizedRole = (user?.rol || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    
    if (normalizedRole !== 'tecnico') {
      navigate('/');
    }
  }, [user, navigate]);

  // Cargar especialidades del técnico
  useEffect(() => {
    const loadEspecialidades = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBaseWithPrefix();
        console.log('📡 Cargando especialidades para user.id:', user?.id);
        const res = await axios.get(`${apiBase}/tecnico/obtenerEspecialidades/${user?.id}`);
        console.log('📡 Respuesta del servidor:', res.data);
        setEspecialidades(res.data?.especialidades || []);
      } catch (error) {
        console.warn('❌ Error cargando especialidades:', error?.message);
        setEspecialidades([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadEspecialidades();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Usuario no encontrado</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t('header.myProfile') || 'Mi Perfil'}
        </Typography>
      </Box>

      {/* Información Personal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información Personal
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                Nombre
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.name || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                Correo
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.email || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                ID de Usuario
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.id || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                Rol
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.rol || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Botones */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/editar-tecnico/${user?.id}`)}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Volver
          </Button>
        </Box>
      </Paper>

      {/* Especialidades */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Especialidades
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : especialidades.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {especialidades.map((esp, idx) => (
              <Chip
                key={idx}
                label={esp.nombre || esp}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        ) : (
          <Typography color="textSecondary" variant="body2">
            No hay especialidades asignadas
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
