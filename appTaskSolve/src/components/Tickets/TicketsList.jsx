import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Snackbar
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getApiOrigin } from '../../utils/apiBase';

const getApiBase = () => `${getApiOrigin()}/apiticket`;

const statusColor = (estado) => {
  const map = {
    'Asignado': 'info',
    'En Proceso': 'warning',
    'Resuelto': 'success',
    'Cerrado': 'default'
  };
  return map[estado] || 'primary';
};

const getSlaUrgency = (slaText) => {
  if (!slaText) return null;
  const match = slaText.match(/(-?\d+)h/);
  if (!match) return null;
  const horas = parseInt(match[1]);
  if (horas < 0) return { level: 'vencido', color: '#d32f2f', bgColor: '#ffebee', icon: ErrorIcon, pulse: true };
  if (horas <= 2) return { level: 'critico', color: '#d32f2f', bgColor: '#ffe0e0', icon: ErrorIcon, pulse: true };
  if (horas <= 4) return { level: 'urgente', color: '#f57c00', bgColor: '#fff3e0', icon: WarningAmberIcon, pulse: false };
  if (horas <= 24) return { level: 'proximo', color: '#ed6c02', bgColor: '#fff8e1', icon: AccessTimeIcon, pulse: false };
  return { level: 'normal', color: '#2e7d32', bgColor: '#f1f8f4', icon: AccessTimeIcon, pulse: false };
};

const statusKey = (estado) => {
  const map = {
    'Asignado': 'status.assigned',
    'En Proceso': 'status.inProgress',
    'Resuelto': 'status.resolved',
    'Cerrado': 'status.closed'
  };
  return map[estado] || 'status.notFound';
};

// Robust translation helper: map backend state strings to i18n keys
const translateStatusLabel = (tfn, estadoRaw) => {
  if (!estadoRaw) return '';
  const raw = String(estadoRaw).toLowerCase();
  if (raw.includes('pend')) return tfn('status.pending');
  if (raw.includes('asign')) return tfn('status.assigned');
  if (raw.includes('proceso') || raw.includes('en proceso')) return tfn('status.inProgress');
  if (raw.includes('resuel') || raw.includes('resuelto')) return tfn('status.resolved');
  if (raw.includes('cerr')) return tfn('status.closed');
  return estadoRaw;
};

export default function TicketsList() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  // Manejar ausencia de AuthProvider: si useAuth() devuelve null, evitamos crash
  const { user } = useAuth() || {};
  const location = useLocation();

  const load = useCallback(async (abortSignal) => {
    try {
      setLoading(true);
      setError('');
      const apiBase = getApiBase();
      let url = `${apiBase}/ticket`;

      if (user) {
        if (user.rol?.toLowerCase() === 'cliente' && user.id_usuario) {
          url = `${apiBase}/ticket/getTicketByUsuario/${user.id_usuario}`;
        } else if (user.rol?.toLowerCase() === 'técnico' || user.rol?.toLowerCase() === 'tecnico') {
          if (user.id_tecnico) {
            url = `${apiBase}/ticket/getTicketByTecnico/${user.id_tecnico}`;
          }
        }
      }

      const res = await axios.get(url, { signal: abortSignal });
      const data = res.data;
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.name !== 'AbortError' && e.code !== 'ERR_CANCELED') {
        console.error('Error cargando tickets:', e);
        setError(e.response?.data?.message || e.message || 'Error al cargar tickets');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Refrescar al volver desde creación (state.refresh) y mostrar toast
  useEffect(() => {
    if (location.state?.refresh) {
      const controller = new AbortController();
      load(controller.signal);
      setSnackbar({ open: true, message: location.state.toast || 'Operación realizada con éxito', severity: 'success' });
  // limpiar state para evitar repetición (ruta absoluta para evitar edge cases)
  navigate('/tickets', { replace: true, state: {} });
      return () => controller.abort();
    }
  }, [location.state, load, navigate]);

  // Refrescar al recuperar el foco de la ventana
  useEffect(() => {
    const onFocus = () => {
      const controller = new AbortController();
      load(controller.signal);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);


  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          {t('header.tickets') || 'Tickets'}
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/tickets/crear')}>
          {t('home.createTicket') || 'Crear Ticket'}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && tickets.length === 0 && (
        <Alert severity="info">{t('home.noResults') || 'No hay tickets para mostrar.'}</Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {tickets.map((t, idx) => {
          const slaText = t['Tiempo restante SLA'] || t['Tiempo restante SLA (máx)'];
          const urgency = getSlaUrgency(slaText);
          const Icon = urgency?.icon;

          return (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card 
                elevation={urgency?.pulse ? 6 : 2} 
                sx={{ 
                  borderRadius: 2, 
                  cursor: 'pointer',
                  borderLeft: urgency ? `5px solid ${urgency.color}` : 'none',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8
                  },
                  ...(urgency?.pulse && {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { boxShadow: `0 0 0 0 ${urgency.color}40` },
                      '50%': { boxShadow: `0 0 0 10px ${urgency.color}00` }
                    }
                  })
                }} 
                onClick={() => navigate(`/tickets/${t['Identificador del Ticket']}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ticket #{t['Identificador del Ticket']}
                    </Typography>
                    {urgency?.pulse && (
                      <Chip size="small" label={t(`sla.${urgency.level}`)} sx={{ bgcolor: urgency.color, color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
                    )}
                  </Box>

                  <Typography variant="h6" sx={{ mb: 1.5 }}>{t['Categoría']}</Typography>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={translateStatusLabel(t, t['Estado actual'] || t.estado?.nombre || t.estado)} color={statusColor(t['Estado actual'] || t.estado?.nombre || t.estado)} />
                  </Box>

                  {urgency && (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1, 
                        bgcolor: urgency.bgColor,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      {Icon && <Icon sx={{ fontSize: 18, color: urgency.color }} />}
                      <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: urgency.color, display: 'block', lineHeight: 1.2 }}>
                            {t(`sla.${urgency.level}`)}
                          </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            display: 'block',
                            lineHeight: 1.2
                          }}
                        >
                          {slaText}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
