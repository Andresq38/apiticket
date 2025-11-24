import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TicketService from '../../services/TicketService';
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

// Componente para cargar y mostrar el historial
function HistorialTicketSection({ ticketId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          Historial Completo de Cambios de Estado
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
  const { id } = useParams();
  const navigate = useNavigate();
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
      setError('No se pudo cargar la información del tiquete.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchEstados = async () => {
    setLoadingEstados(true);
    try {
      // Usar TicketService en lugar de axios directo
      const estados = await TicketService.getEstados();
      const estadosArray = Array.isArray(estados) ? estados : (estados?.data || []);
      setEstadosDisponibles(estadosArray);
    } catch (err) {
      console.error('Error al cargar estados:', err);
      setSnackbar({ open: true, message: 'Error al cargar estados disponibles', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Por favor selecciona un estado', severity: 'warning' });
      return;
    }

    // VALIDACIÓN OBLIGATORIA DE OBSERVACIONES
    if (!observaciones || observaciones.trim() === '') {
      setSnackbar({ 
        open: true, 
        message: 'Las observaciones son obligatorias para cambiar el estado del tiquete', 
        severity: 'error' 
      });
      return;
    }

    try {
      // Obtener el ID del usuario desde localStorage
      let idUsuarioRemitente = null;
      try {
        const userStr = localStorage.getItem('user');
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
        setSnackbar({ open: true, message: response.message || 'Estado actualizado correctamente', severity: 'success' });
        handleCloseDialog();
        
        // Recargar el ticket para reflejar los cambios
        setTimeout(() => {
          fetchTicket();
        }, 500);
      } else {
        setSnackbar({ open: true, message: response.message || 'Error al actualizar estado', severity: 'error' });
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al cambiar el estado del tiquete';
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
  if (!ticket) return <Alert severity="info">Tiquete no encontrado.</Alert>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Detalles del Ticket #{ticket.id_ticket}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="warning"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/tickets/editar/${id}`)}
          disabled={ticket?.estado?.nombre === 'Cerrado'}
        >
          Editar Tiquete
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<ChangeCircleIcon />}
          onClick={handleOpenDialog}
          disabled={ticket?.estado?.nombre === 'Cerrado'}
        >
          Cambiar Estado
        </Button>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Volver al Inicio
        </Button>
      </Box>

      {/* Alerta SLA Prominente */}
      {ticket?.sla?.tiempo_restante && ticket?.estado?.nombre !== 'Cerrado' && (() => {
        const slaText = ticket.sla.tiempo_restante;
        const match = slaText.match(/(-?\d+)h/);
        if (!match) return null;
        
        const horas = parseInt(match[1]);
        let urgencyConfig;
        
        if (horas < 0) {
          urgencyConfig = { 
            severity: 'error', 
            title: '⚠️ SLA VENCIDO', 
            color: '#d32f2f',
            bgColor: '#ffebee',
            message: `Este tiquete ha excedido su tiempo SLA por ${Math.abs(horas)} horas. Requiere atención inmediata.`
          };
        } else if (horas <= 2) {
          urgencyConfig = { 
            severity: 'error', 
            title: '🚨 SLA CRÍTICO', 
            color: '#d32f2f',
            bgColor: '#ffe0e0',
            message: `Solo quedan ${horas} horas para cumplir con el SLA. Acción urgente requerida.`
          };
        } else if (horas <= 4) {
          urgencyConfig = { 
            severity: 'warning', 
            title: '⚡ SLA URGENTE', 
            color: '#f57c00',
            bgColor: '#fff3e0',
            message: `Quedan ${horas} horas para el vencimiento del SLA. Prioridad alta.`
          };
        } else if (horas <= 24) {
          urgencyConfig = { 
            severity: 'warning', 
            title: '⏰ SLA PRÓXIMO A VENCER', 
            color: '#ed6c02',
            bgColor: '#fff8e1',
            message: `El SLA vence en ${horas} horas. Mantener seguimiento.`
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
                label={`Tiempo restante: ${slaText}`}
                sx={{ 
                  bgcolor: 'white',
                  fontWeight: 600,
                  borderLeft: `3px solid ${urgencyConfig.color}`
                }}
              />
              <Chip 
                label={`SLA: ${ticket.sla?.nombre || 'N/A'}`}
                variant="outlined"
              />
              <Chip 
                label={`Prioridad: ${ticket.prioridad || 'N/A'}`}
                color={ticket.prioridad === 'Alta' ? 'error' : ticket.prioridad === 'Media' ? 'warning' : 'default'}
              />
            </Box>
          </Alert>
        );
      })()}

      {/* Información General */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Información General</Typography>
        <Typography><strong>Título:</strong> {ticket.titulo}</Typography>
        <Typography><strong>Descripción:</strong> {ticket.descripcion}</Typography>
        <Typography><strong>Prioridad:</strong> {ticket.prioridad}</Typography>
        <Typography><strong>Estado:</strong> {ticket.estado?.nombre || 'N/A'}</Typography>
  <Typography><strong>Fecha creación:</strong> {formatDateTime(ticket.fecha_creacion)}</Typography>
  <Typography><strong>Fecha cierre:</strong> {ticket.fecha_cierre ? formatDateTime(ticket.fecha_cierre) : 'No cerrado'}</Typography>
      </Paper>

      {/* Métricas de SLA y Cumplimiento */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f0f7ff', border: '2px solid #2196f3' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon />
          Métricas de SLA y Cumplimiento
        </Typography>

        {ticket.sla ? (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Columna 1: Información del SLA */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  Nivel de SLA
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ticket.sla.nombre || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  SLA Respuesta
                </Typography>
                <Typography variant="body1">
                  {ticket.sla.tiempo_respuesta_min && ticket.sla.tiempo_respuesta_max 
                    ? `${ticket.sla.tiempo_respuesta_min} - ${ticket.sla.tiempo_respuesta_max} minutos`
                    : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  SLA de Resolución
                </Typography>
                <Typography variant="body1">
                  {ticket.sla.tiempo_resolucion_min && ticket.sla.tiempo_resolucion_max 
                    ? `${ticket.sla.tiempo_resolucion_min} - ${ticket.sla.tiempo_resolucion_max} minutos (${(ticket.sla.tiempo_resolucion_max / 60).toFixed(1)}h)`
                    : 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                  Tiempo Restante SLA
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: ticket.sla.tiempo_restante?.includes('-') ? 'error.main' : 'success.main' }}>
                  {ticket.sla.tiempo_restante || 'N/A'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
                  Límite de Respuesta
                </Typography>
                <Typography variant="body2">
                  {ticket.sla_fecha_respuesta ? formatDateTime(ticket.sla_fecha_respuesta) : 'N/A'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
                  Límite de Resolución
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
                        {ticket.fecha_cierre ? 'Tiquete cerrado' : 'En curso'}
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
            No hay información de SLA disponible para este ticket.
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

      {/* Etiquetas */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Etiquetas Asociadas</Typography>
        {ticket.etiquetas?.length > 0 ? (
          <Grid container direction="column" spacing={1} sx={{ mt: 1 }}>
            {ticket.etiquetas
              .slice()
              .sort((a, b) => (a?.id_etiqueta ?? a?.id ?? 0) - (b?.id_etiqueta ?? b?.id ?? 0))
              .map((et) => {
              const id = et?.id_etiqueta ?? et?.id ?? '';
              const descripcion = et?.etiqueta ?? et?.nombre ?? et?.label ?? 'Descripción no disponible';
              const key = id || descripcion;
              return (
                <Grid item xs={12} key={key}>
                  <Paper sx={{ bgcolor: 'white', color: '#000000ff', p: 2 }} elevation={2}>
                    <Typography variant="subtitle2">ID etiqueta: {id}</Typography>
                    <Typography variant="body2">Descripción: {descripcion}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography>No hay etiquetas asociadas</Typography>
        )}
      </Paper>

      {/* Historial de Estados Completo */}
      <HistorialTicketSection ticketId={id} />

       {/* Imágenes (carrusel manual) */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Imágenes del Tiquete</Typography>
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
          <Typography variant="body2">No hay imágenes asociadas a este tiquete.</Typography>
        )}
      </Paper>

      {/* Comentario existente (solo lectura) */}
        <Box>
          <Paper sx={{ p: 2, bgcolor: 'white', borderLeft: '4px solid #1976d2' }} elevation={0}>
            <Typography variant="h6" color="primary" gutterBottom>
              Comentario del cliente:
            </Typography>

            {ticket.comentario && ticket.comentario.trim().length > 0 ? (
              <Typography
                variant="body1"
                sx={{ fontStyle: 'italic', color: 'text.primary' }}
              >
                "{ticket.comentario}"
              </Typography>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontStyle: 'italic' }}
              >
                No hay comentarios asociados a este ticket.
              </Typography>
            )}
          </Paper>
        </Box>

        
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
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
