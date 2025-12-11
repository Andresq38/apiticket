import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TicketService from '../../services/TicketService';
import { useTranslation } from 'react-i18next';
import { 
  Container, Typography, CircularProgress, Box, Alert, 
  TextField, Button, Paper, Chip, Grid, Rating, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Snackbar
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import EditIcon from '@mui/icons-material/Edit';
// Se removieron iconos de carga/eliminación de imágenes para modo solo lectura
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import { getApiOrigin } from '../../utils/apiBase';
import { formatDateTime } from '../../utils/format';
import CambiarEstadoDialog from '../common/CambiarEstadoDialog';
import HistorialTimeline from '../common/HistorialTimeline';
import { useAuth } from '../../context/AuthContext';

// Componente para cargar y mostrar el historial
function HistorialTicketSection({ ticketId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const apiBase = getApiOrigin();

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiBase}/apiticket/historial_estado/ticket/${ticketId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setHistorial(data);
      } catch (err) {
        console.error('Error al cargar historial:', err);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchHistorial();
    }
  }, [ticketId, apiBase]);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <HistoryIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
          {t('tickets.history.title')}
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <HistorialTimeline historial={historial} />
      )}
    </Paper>
  );
}

export default function DetalleTicket() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // reset main image index when ticket changes
  useEffect(() => {
    setMainImageIndex(0);
  }, [ticket]);
  
  // Estados para el diálogo de cambio de estado
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Encuesta de satisfacción
  const [openSurvey, setOpenSurvey] = useState(false);
  const [surveyRating, setSurveyRating] = useState(0);
  const [surveyComment, setSurveyComment] = useState('');
  const hasSurvey = (surveyRating || 0) > 0 || (surveyComment || '').trim().length > 0;

  const normalizedRole = (user?.rol || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');


  const getApiBase = () => getApiOrigin();

  // Función reutilizable para cargar ticket
  const fetchTicket = async () => {
    try {
      setLoading(true);
      // Usar TicketService en lugar de axios directo
      const data = await TicketService.getById(id);
      setTicket(data || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('tickets.loadError') || t('createTicketForm.formIncomplete'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Cargar encuesta almacenada si existe
  useEffect(() => {
    if (ticket?.id_ticket) {
      const stored = localStorage.getItem(`survey_ticket_${ticket.id_ticket}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSurveyRating(parsed.rating || 0);
          setSurveyComment(parsed.comment || '');
        } catch (_) {
          setSurveyRating(0);
          setSurveyComment('');
        }
      } else {
        setSurveyRating(0);
        setSurveyComment('');
      }
    }
  }, [ticket?.id_ticket]);

  const fetchEstados = async () => {
    setLoadingEstados(true);
    try {
      // Usar TicketService en lugar de axios directo
      const estados = await TicketService.getEstados();
      const estadosArray = Array.isArray(estados) ? estados : (estados?.data || []);
      setEstadosDisponibles(estadosArray);
    } catch (err) {
      console.error('Error al cargar estados:', err);
      setSnackbar({ open: true, message: t('tickets.errorLoadStates') || 'Error al cargar estados disponibles', severity: 'error' });
    } finally {
      setLoadingEstados(false);
    }
  };

  const handleOpenDialog = () => {
    fetchEstados();
    setNuevoEstado(ticket?.id_estado || '');
    setObservaciones('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNuevoEstado('');
    setObservaciones('');
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) {
      setSnackbar({ open: true, message: t('tickets.selectStatePlease') || 'Por favor selecciona un estado', severity: 'warning' });
      return;
    }

    // VALIDACIÓN OBLIGATORIA DE OBSERVACIONES
    if (!observaciones || observaciones.trim() === '') {
      setSnackbar({ 
        open: true, 
        message: t('tickets.observationsRequired') || 'Las observaciones son obligatorias para cambiar el estado del tiquete', 
        severity: 'error' 
      });
      return;
    }

    try {
      // Obtener el ID del usuario desde localStorage
      let idUsuarioRemitente = null;
      try {
        const userStr = localStorage.getItem('authUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          idUsuarioRemitente = user.id;
        }
      } catch (e) {
        console.error('Error al obtener usuario:', e);
      }

      // Usar TicketService en lugar de axios directo
      const response = await TicketService.cambiarEstado({
        id_ticket: parseInt(id),
        id_estado: parseInt(nuevoEstado),
        observaciones: observaciones.trim(),
        id_usuario_remitente: idUsuarioRemitente
      });

      if (response.success) {
        setSnackbar({ open: true, message: response.message || t('tickets.stateUpdated') || 'Estado actualizado correctamente', severity: 'success' });
        handleCloseDialog();
        
        // Recargar el ticket para reflejar los cambios
        setTimeout(() => {
          fetchTicket();
        }, 500);
      } else {
        setSnackbar({ open: true, message: response.message || t('tickets.errorUpdateState') || 'Error al actualizar estado', severity: 'error' });
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      const errorMessage = err.response?.data?.message || err.message || t('tickets.changeState.error');
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Se removieron manejadores de carga de imágenes para modo solo lectura

  if (loading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  // If API returned no ticket
  if (!ticket) return <Alert severity="info">{t('tickets.notFound') || t('actions.notFound')}</Alert>;

  const isClosed = (ticket?.estado?.nombre || '').toLowerCase() === 'cerrado';
  const isTech = normalizedRole === 'tecnico';
  const isAssignedToTech = Boolean(ticket?.id_tecnico) && Boolean(user?.id_tecnico) && ticket.id_tecnico === user.id_tecnico;
  const disableActions = isClosed || (isTech && !isAssignedToTech);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('tickets.detailsTitle', { id: ticket.id_ticket })}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="warning"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/tickets/editar/${id}`)}
          disabled={disableActions}
        >
          {t('tickets.edit')}
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<ChangeCircleIcon />}
          onClick={handleOpenDialog}
          disabled={isClosed} /* permitir que cualquier técnico pueda cambiar estado mientras no esté cerrado */
        >
          {t('tickets.changeState')}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/')}>
          {t('home.backToHome')}
        </Button>
      </Box>

      {/* Alerta SLA Prominente */}
      {ticket?.sla?.tiempo_restante && ticket?.estado?.nombre !== 'Cerrado' && (() => {
        const slaText = ticket.sla.tiempo_restante;
        const match = slaText.match(/(-?\d+)h/);
        if (!match) return null;
        
        const horas = parseInt(match[1]);
        // legacy translations use `hours` placeholder — provide it for consistency
        const hours = horas;
        let urgencyConfig;
        
        if (horas < 0) {
          urgencyConfig = { 
            severity: 'error', 
            title: t('tickets.sla.overdueTitle'),
            color: '#d32f2f',
            bgColor: '#ffebee',
            message: t('tickets.sla.overdueMessage', { hours: Math.abs(horas) })
          };
        } else if (horas <= 2) {
          urgencyConfig = { 
            severity: 'error', 
            title: t('tickets.sla.criticalTitle'),
            color: '#d32f2f',
            bgColor: '#ffe0e0',
            message: t('tickets.sla.criticalMessage', { hours })
          };
        } else if (horas <= 4) {
          urgencyConfig = { 
            severity: 'warning', 
            title: t('tickets.sla.urgentTitle'),
            color: '#f57c00',
            bgColor: '#fff3e0',
            message: t('tickets.sla.urgentMessage', { hours })
          };
        } else if (horas <= 24) {
          urgencyConfig = { 
            severity: 'warning', 
            title: t('tickets.sla.nextTitle'),
            color: '#ed6c02',
            bgColor: '#fff8e1',
            message: t('tickets.sla.nextMessage', { hours })
          };
        }

        if (!urgencyConfig) return null;

        return (
          <Alert 
            severity={urgencyConfig.severity}
            icon={false}
            sx={{ 
              mb: 3, 
              p: 3,
              bgcolor: urgencyConfig.bgColor,
              borderLeft: `6px solid ${urgencyConfig.color}`,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: urgencyConfig.color
              }}
            >
              {urgencyConfig.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {urgencyConfig.message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Chip 
                label={`${t('tickets.sla.timeRemaining')}: ${slaText}`}
                sx={{ 
                  bgcolor: 'white',
                  fontWeight: 600,
                  borderLeft: `3px solid ${urgencyConfig.color}`
                }}
              />
              <Chip 
                label={`${t('tickets.sla.label')}: ${ticket.sla?.nombre || 'N/A'}`}
                variant="outlined"
              />
              <Chip 
                label={`${t('tickets.priority')}: ${ticket.prioridad || 'N/A'}`}
                color={ticket.prioridad === 'Alta' ? 'error' : ticket.prioridad === 'Media' ? 'warning' : 'default'}
              />
            </Box>
          </Alert>
        );
      })()}

      {/* Información General */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>{t('tickets.info.title')}</Typography>
        <Typography><strong>{t('tickets.fields.title')}:</strong> {ticket.titulo}</Typography>
        <Typography><strong>{t('tickets.fields.description')}:</strong> {ticket.descripcion}</Typography>
        <Typography><strong>{t('tickets.fields.priority')}:</strong> {ticket.prioridad}</Typography>
        <Typography><strong>{t('tickets.fields.status')}:</strong> {(() => {
            const raw = ticket.estado?.nombre || ticket.estado || '';
            const key = String(raw).toLowerCase();
            if (key.includes('pend')) return t('status.pending');
            if (key.includes('asign')) return t('status.assigned');
            if (key.includes('proceso') || key.includes('en proceso')) return t('status.inProgress');
            if (key.includes('resuel') || key.includes('resuelto')) return t('status.resolved');
            if (key.includes('cerr')) return t('status.closed');
            return raw || 'N/A';
          })()}</Typography>
      <Typography><strong>{t('tickets.fields.createdAt')}:</strong> {formatDateTime(ticket.fecha_creacion)}</Typography>
      <Typography><strong>{t('tickets.fields.closedAt')}:</strong> {ticket.fecha_cierre ? formatDateTime(ticket.fecha_cierre) : t('tickets.notClosed')}</Typography>
      </Paper>

      {/* Métricas de SLA y Cumplimiento */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f0f7ff', border: '2px solid #2196f3' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon />
          {t('tickets.sla.metricsTitle')}
        </Typography>

        {ticket.sla ? (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Columna 1: Información del SLA */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  {t('tickets.sla.level')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ticket.sla.nombre || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  {t('tickets.sla.response')}
                </Typography>
                <Typography variant="body1">
                  {ticket.sla.tiempo_respuesta_min && ticket.sla.tiempo_respuesta_max 
                    ? `${ticket.sla.tiempo_respuesta_min} - ${ticket.sla.tiempo_respuesta_max} minutos`
                    : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  {t('tickets.sla.resolution')}
                </Typography>
                <Typography variant="body1">
                  {ticket.sla.tiempo_resolucion_min && ticket.sla.tiempo_resolucion_max 
                    ? `${ticket.sla.tiempo_resolucion_min} - ${ticket.sla.tiempo_resolucion_max} minutos (${(ticket.sla.tiempo_resolucion_max / 60).toFixed(1)}h)`
                    : 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  {t('tickets.sla.timeRemainingTitle')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: ticket.sla.tiempo_restante?.includes('-') ? 'error.main' : 'success.main' }}>
                  {ticket.sla.tiempo_restante || 'N/A'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
                  {t('tickets.sla.responseLimit')}
                </Typography>
                <Typography variant="body2">
                  {ticket.sla_fecha_respuesta ? formatDateTime(ticket.sla_fecha_respuesta) : 'N/A'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
                  {t('tickets.sla.resolutionLimit')}
                </Typography>
                <Typography variant="body2">
                  {ticket.sla_fecha_resolucion ? formatDateTime(ticket.sla_fecha_resolucion) : 'N/A'}
                </Typography>
              </Box>
            </Grid>

            {/* Columna 2: Métricas de Cumplimiento */}
            <Grid item xs={12} md={6}>
              {(() => {
                // Calcular días de resolución
                const fechaCreacion = new Date(ticket.fecha_creacion);
                const fechaFin = ticket.fecha_cierre ? new Date(ticket.fecha_cierre) : new Date();
                const diasResolucion = Math.floor((fechaFin - fechaCreacion) / (1000 * 60 * 60 * 24));
                const horasResolucion = Math.floor((fechaFin - fechaCreacion) / (1000 * 60 * 60));
                const minutosTranscurridos = Math.floor((fechaFin - fechaCreacion) / (1000 * 60));

                // Calcular cumplimiento de respuesta (asumimos que la primera entrada en historial es la respuesta)
                const tiempoRespuestaMax = ticket.sla.tiempo_respuesta_max || 0;
                const primeraRespuesta = ticket.historial_estados && ticket.historial_estados.length > 0 
                  ? ticket.historial_estados[0] 
                  : null;
                
                let cumplimientoRespuesta = 'Pendiente';
                if (primeraRespuesta) {
                  const fechaRespuesta = new Date(primeraRespuesta.fecha_cambio);
                  const minutosHastaRespuesta = Math.floor((fechaRespuesta - fechaCreacion) / (1000 * 60));
                  cumplimientoRespuesta = minutosHastaRespuesta <= tiempoRespuestaMax ? 'Cumplido' : 'No Cumplido';
                }

                // Calcular cumplimiento de resolución
                const tiempoResolucionMax = ticket.sla.tiempo_resolucion_max || 0;
                let cumplimientoResolucion = 'En Proceso';
                
                if (ticket.estado?.nombre === 'Resuelto' || ticket.estado?.nombre === 'Cerrado') {
                  cumplimientoResolucion = minutosTranscurridos <= tiempoResolucionMax ? 'Cumplido' : 'No Cumplido';
                } else if (minutosTranscurridos > tiempoResolucionMax) {
                  cumplimientoResolucion = 'Vencido';
                }

                return (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Días de Resolución
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {diasResolucion} {diasResolucion === 1 ? 'día' : 'días'} ({horasResolucion}h)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ticket.fecha_cierre ? t('tickets.closed') : t('tickets.inProgress')}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Cumplimiento de Respuesta
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={cumplimientoRespuesta}
                          color={
                            cumplimientoRespuesta === 'Cumplido' ? 'success' : 
                            cumplimientoRespuesta === 'No Cumplido' ? 'error' : 
                            'default'
                          }
                          icon={cumplimientoRespuesta === 'Cumplido' ? <CheckCircleIcon /> : 
                                cumplimientoRespuesta === 'No Cumplido' ? <ErrorIcon /> : 
                                <AccessTimeIcon />}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Cumplimiento de Resolución
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={cumplimientoResolucion}
                          color={
                            cumplimientoResolucion === 'Cumplido' ? 'success' : 
                            cumplimientoResolucion === 'No Cumplido' || cumplimientoResolucion === 'Vencido' ? 'error' : 
                            'warning'
                          }
                          icon={cumplimientoResolucion === 'Cumplido' ? <CheckCircleIcon /> : 
                                (cumplimientoResolucion === 'No Cumplido' || cumplimientoResolucion === 'Vencido') ? <ErrorIcon /> : 
                                <AccessTimeIcon />}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      {cumplimientoResolucion === 'En Proceso' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Tiempo transcurrido: {Math.floor(minutosTranscurridos / 60)}h {minutosTranscurridos % 60}m
                        </Typography>
                      )}
                    </Box>
                  </>
                );
              })()}
            </Grid>
          </Grid>
          ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('tickets.sla.noInfo')}
          </Alert>
        )}
      </Paper>

      {/* Usuario Afectado */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Usuario Afectado</Typography>
        <Typography><strong>Nombre:</strong> {ticket.usuario?.nombre || ''}</Typography>
        <Typography><strong>Correo:</strong> {ticket.usuario?.correo || ''}</Typography>
        <Typography><strong>ID Usuario:</strong> {ticket.usuario?.id_usuario || ''}</Typography>
      </Paper>

      {/* Técnico Asignado */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Técnico Asignado</Typography>
        <Typography><strong>Nombre:</strong> {ticket.tecnico?.nombre_usuario || 'No asignado'}</Typography>
        <Typography><strong>Correo:</strong> {ticket.tecnico?.correo_usuario || 'No asignado'}</Typography>
        <Typography><strong>ID Técnico:</strong> {ticket.tecnico?.id_tecnico || 'N/A'}</Typography>
      </Paper>

      {/* Categoría */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Categoría</Typography>
        <Typography><strong>Descripción:</strong> {ticket.categoria?.nombre || 'N/A'}</Typography>
        <Typography><strong>ID Categoría:</strong> {ticket.categoria?.id_categoria || 'N/A'}</Typography>
      </Paper>

      {/* Etiqueta */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Etiqueta</Typography>
        <Typography><strong>Descripción:</strong> {ticket.etiqueta?.nombre ?? ticket.etiqueta?.etiqueta ?? 'N/A'}</Typography>
        <Typography><strong>ID Etiqueta:</strong> {ticket.etiqueta?.id_etiqueta ?? ticket.etiqueta?.id ?? 'N/A'}</Typography>
      </Paper>

      {/* Especialidad */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Especialidad</Typography>
        <Typography><strong>Descripción:</strong> {ticket.especialidad?.nombre ?? ticket.especialidad?.especialidad ?? 'N/A'}</Typography>
        <Typography><strong>ID Especialidad:</strong> {ticket.especialidad?.id_especialidad ?? ticket.especialidad?.id ?? 'N/A'}</Typography>
      </Paper>

      {/* Historial de Estados Completo */}
      <HistorialTicketSection ticketId={id} />

       {/* Imágenes (carrusel manual) */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>{t('tickets.images.title')}</Typography>
        {Array.isArray(ticket.imagenes) && ticket.imagenes.length > 0 ? (
          (() => {
            const apiBase = getApiOrigin();
            const UPLOADS_BASE = `${apiBase}/apiticket/uploads`;
            const toSrc = (img) => {
              const raw = img?.url || img?.imagen || img?.path || img?.image || '';
              if (!raw) return '';
              if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
              if (raw.startsWith('/apiticket/')) return `${apiBase}${raw}`; // backend already provided full path under api prefix
              return `${UPLOADS_BASE}/${raw}`; // assume it's just a filename
            };

            const imgs = ticket.imagenes;
            const safeIndex = ((mainImageIndex % imgs.length) + imgs.length) % imgs.length;
            const main = imgs[safeIndex];
            const mainSrc = toSrc(main);

            return (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button size="small" disabled={imgs.length <= 1} onClick={() => setMainImageIndex(i => (i - 1 + imgs.length) % imgs.length)}>&lt;</Button>
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Box
                      component="img"
                      src={mainSrc}
                      alt=""
                      loading="lazy"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.image-error-msg')) {
                          const msg = document.createElement('div');
                          msg.className = 'image-error-msg';
                          msg.textContent = 'Imagen no disponible';
                          msg.style.cssText = 'color: #999; padding: 40px; text-align: center;';
                          parent.appendChild(msg);
                        }
                      }}
                      sx={{ maxWidth: '100%', maxHeight: 420, borderRadius: 2 }}
                    />
                    {main?.descripcion && <Typography variant="caption" display="block">{main.descripcion}</Typography>}
                  </Box>
                  <Button size="small" disabled={imgs.length <= 1} onClick={() => setMainImageIndex(i => (i + 1) % imgs.length)}>&gt;</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
                  {imgs.map((im, idx) => (
                    <Box key={im.id_imagen ?? idx} onClick={() => setMainImageIndex(idx)} sx={{ cursor: 'pointer', border: idx === safeIndex ? '2px solid #1976d2' : '2px solid transparent', borderRadius: 1 }}>
                      <Box 
                        component="img" 
                        src={toSrc(im)} 
                        alt="" 
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        sx={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 1 }} 
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })()
        ) : (
          <Typography variant="body2">{t('tickets.images.none')}</Typography>
        )}
      </Paper>

      {/* Comentario y Encuesta de satisfacción */}
        <Box>
          <Paper sx={{ p: 2, bgcolor: 'white', borderLeft: '4px solid #1976d2' }} elevation={0}>
            <Typography variant="h6" color="primary" gutterBottom>
              Encuesta de satisfacción
            </Typography>

            {hasSurvey ? (
              <Box sx={{ p: 2, bgcolor: '#f5f8ff', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Calificación
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Rating name="survey-read" value={surveyRating} readOnly precision={1} />
                </Box>
                
                {surveyComment?.trim() && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Comentario
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontStyle: 'italic', color: 'text.primary' }}
                    >
                      "{surveyComment}"
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontStyle: 'italic' }}
              >
                Sin encuesta
              </Typography>
            )}
          </Paper>
        </Box>

      {/* Encuesta de satisfacción cuando el ticket está cerrado */}
      {isClosed && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, bgcolor: 'white' }} elevation={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Llenar encuesta de satisfacción
            </Typography>
            <Button variant="contained" color="secondary" onClick={() => setOpenSurvey(true)}>
              Llenar encuesta de satisfacción
            </Button>
          </Paper>
        </Box>
      )}

        
      {/* Diálogo para cambiar estado */}
      {/* Nuevo diálogo con carga de imágenes obligatoria */}
      <CambiarEstadoDialog
        open={openDialog}
        onClose={handleCloseDialog}
        ticket={ticket}
        estadoActual={ticket?.id_estado}
        onSuccess={() => {
          setSnackbar({ 
            open: true, 
            message: 'Estado actualizado correctamente con imágenes adjuntas', 
            severity: 'success' 
          });
          // Recargar ticket después de 500ms
          setTimeout(() => {
            fetchTicket();
          }, 500);
        }}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {snackbar.message}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Modal de encuesta */}
      <Dialog open={openSurvey} onClose={() => setOpenSurvey(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Encuesta de satisfacción</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography component="legend">Calificación</Typography>
            <Rating
              name="survey-rating"
              value={surveyRating}
              onChange={(_, newValue) => setSurveyRating(newValue || 0)}
              precision={1}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Comentario"
            value={surveyComment}
            onChange={(e) => setSurveyComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSurvey(false)}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const payload = { rating: surveyRating, comment: surveyComment, date: new Date().toISOString() };
              localStorage.setItem(`survey_ticket_${ticket.id_ticket}`, JSON.stringify(payload));
              setSnackbar({ open: true, message: 'Gracias por llenar la encuesta', severity: 'success' });
              setOpenSurvey(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
