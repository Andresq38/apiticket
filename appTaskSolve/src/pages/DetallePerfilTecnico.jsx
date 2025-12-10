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
  const [ticketsAbiertos, setTicketsAbiertos] = useState(0);
  const [telefono, setTelefono] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');

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
    const loadInfo = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBaseWithPrefix();
        // Especialidades
        const espRes = await axios.get(`${apiBase}/tecnico/obtenerEspecialidades/${user?.id}`);
        setEspecialidades(espRes.data?.especialidades || []);
        // Tickets abiertos
        const ticketRes = await axios.get(`${apiBase}/tecnico/ticketsAbiertos/${user?.id}`);
        setTicketsAbiertos(ticketRes.data?.count || 0);
        // Info adicional (teléfono, fecha ingreso)
        const infoRes = await axios.get(`${apiBase}/tecnico/${user?.id}`);
        setTelefono(infoRes.data?.telefono || '');
        setFechaIngreso(infoRes.data?.fecha_ingreso || '');
      } catch (error) {
        setEspecialidades([]);
        setTicketsAbiertos(0);
        setTelefono('');
        setFechaIngreso('');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
      loadInfo();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('profile.userNotFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {t('profile.panelTitle', 'Información profesional del técnico')}
        </Typography>
      </Box>

      {/* Card principal */}
      <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            {/* Avatar genérico */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'white', fontWeight: 700 }}>
                {user?.name?.charAt(0) || 'T'}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {user?.name || 'N/A'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {user?.email || 'N/A'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={t('profile.role') + ': ' + (user?.rol || 'N/A')} color="primary" />
              <Chip label={t('profile.userId') + ': ' + (user?.id || 'N/A')} color="default" />
              {telefono && <Chip label={t('profile.phone') + ': ' + telefono} color="info" />}
              {fechaIngreso && <Chip label={t('profile.entryDate') + ': ' + fechaIngreso} color="success" />}
              <Chip
                label={ticketsAbiertos === 0
                  ? t('profile.noOpenTickets')
                  : t('profile.openTickets', { count: ticketsAbiertos })}
                color={ticketsAbiertos === 0 ? 'success' : 'warning'}
                sx={{ fontWeight: 700, fontSize: 16, px: 2, py: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Botones fuera del cuadro principal */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/editar-tecnico/${user?.id}`)}
        >
          {t('profile.update')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          {t('profile.goBack')}
        </Button>
      </Box>

      {/* Especialidades */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {t('profile.specialties')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : Array.isArray(especialidades) && especialidades.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {especialidades.map((esp, idx) => (
              <Chip
                key={idx}
                label={esp.nombre || esp}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: 16, px: 2, py: 1 }}
              />
            ))}
          </Box>
        ) : (
          <Typography color="textSecondary" variant="body2">
            {t('profile.noSpecialties')}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
