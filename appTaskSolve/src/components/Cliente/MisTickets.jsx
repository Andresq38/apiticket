import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Card,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SuccessOverlay from '../common/SuccessOverlay';
import { alpha } from '@mui/material/styles';

/**
 * MisTickets Component
 * 
 * Muestra los tickets creados por el cliente actual.
 * Solo muestra tickets pertenecientes al usuario logueado.
 */
export default function MisTickets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiBase = getApiOrigin();
  const theme = useTheme();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetTicket, setTargetTicket] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedTicketInfo, setDeletedTicketInfo] = useState(null);

  /**
   * Cargar tickets del cliente actual
   */
  const fetchMyTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setError(t('misTickets.userNotFound') || 'Usuario no encontrado');
        setLoading(false);
        return;
      }

      // Obtener todos los tickets y filtrar por id_usuario
      const res = await axios.get(`${apiBase}/apiticket/ticket`);
      let allTickets = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      console.log('Todos los tickets:', allTickets);
      console.log('ID del usuario actual:', user.id, 'Tipo:', typeof user.id);

      // Mostrar estructura del primer ticket para debugging
      if (allTickets.length > 0) {
        console.log('Estructura del primer ticket:', allTickets[0]);
      }

      // Filtrar tickets del usuario actual
      const myTickets = allTickets.filter(ticket => {
        // Intentar diferentes campos donde podría estar el id_usuario
        const possibleIds = [
          ticket.id_usuario,
          ticket.ID_USUARIO,
          ticket.usuario_id,
          ticket.userId,
          ticket.user_id
        ];
        
        const ticketUserId = possibleIds.find(id => id !== undefined && id !== null);
        
        if (ticketUserId === undefined || ticketUserId === null) {
          console.warn('No se encontró id_usuario en ticket:', ticket);
          return false;
        }

        const userIdStr = String(user.id).trim();
        const ticketUserIdStr = String(ticketUserId).trim();
        const match = userIdStr === ticketUserIdStr;
        
        console.log('Comparando:', { ticketUserIdStr, userIdStr, match, ticket });
        return match;
      });

      console.log('Mis tickets filtrados:', myTickets);

      // Mapear campos según la estructura de respuesta
      const mapped = myTickets.map((t) => {
        const id = t.id_ticket ?? t['Identificador del Ticket'];
        const titulo = t.titulo || t['Título'] || '';
        const descripcion = t.descripcion || t['Descripción'] || '';
        const fecha = t.fecha_creacion || t['Fecha de creación'] || '';
        const estado = (t.estado && (t.estado.nombre || t.estado)) || t['Estado actual'] || 'Pendiente';
        const prioridad = t.prioridad || t['Prioridad'] || 'Media';

        return {
          id_ticket: parseInt(id, 10),
          titulo,
          descripcion,
          fecha_creacion: fecha,
          estado,
          prioridad
        };
      });

      setTickets(mapped);
    } catch (err) {
      console.error('Error al cargar mis tickets:', err);
      const msg = err?.response?.data?.error || 
                  err?.message || 
                  (t('misTickets.loadError') || 'Error al cargar tickets');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [user?.id]);

  // Auto-refresh cuando la ventana recibe focus o cuando se crea un ticket
  useEffect(() => {
    const onFocus = () => {
      fetchMyTickets();
    };
    
    const onTicketCreated = () => {
      fetchMyTickets();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('ticketCreated', onTicketCreated);
    
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('ticketCreated', onTicketCreated);
    };
  }, [user?.id, apiBase]);

  /**
   * Solicitar confirmación para eliminar ticket
   */
  const requestDelete = (ticket) => {
    setTargetTicket(ticket);
    setConfirmOpen(true);
  };

  /**
   * Confirmar eliminación del ticket
   */
  const confirmDelete = async () => {
    if (!targetTicket) return;
    const t = targetTicket;
    setConfirmOpen(false);
    setTargetTicket(null);
    try {
      await axios.delete(`${apiBase}/apiticket/ticket/delete/${t.id_ticket}`);
      setTickets(prev => prev.filter(x => x.id_ticket !== t.id_ticket));
      setDeletedTicketInfo(t);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error('Error eliminando ticket:', err);
      const msg = err?.response?.data?.error || 
                  (t('misTickets.deleteError') || 'No se pudo eliminar el ticket');
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  /**
   * Navegar a detalle del ticket
   */
  const handleViewTicket = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  /**
   * Traducir etiqueta de estado
   */
  const translateStatus = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('pend')) return t('status.pending');
    if (e.includes('asign')) return t('status.assigned');
    if (e.includes('proceso')) return t('status.inProgress');
    if (e.includes('resuel')) return t('status.resolved');
    if (e.includes('cerr')) return t('status.closed');
    return estado;
  };

  const getStatusVisual = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('pend')) return { color: theme.palette.warning.main, dot: theme.palette.warning.main };
    if (e.includes('asign')) return { color: theme.palette.primary.main, dot: theme.palette.primary.main };
    if (e.includes('proceso')) return { color: theme.palette.warning.dark || '#f57c00', dot: theme.palette.warning.dark || '#f57c00' };
    if (e.includes('resuel')) return { color: theme.palette.success.main, dot: theme.palette.success.main };
    if (e.includes('cerr')) return { color: theme.palette.secondary.main, dot: theme.palette.secondary.main };
    return { color: '#cbd5e1', dot: '#9ca3af' };
  };

  const getPriorityStyles = (prioridad) => {
    const p = (prioridad || '').toLowerCase();
    if (p.includes('alta')) {
      return {
        bg: alpha(theme.palette.error.main, 0.12),
        border: theme.palette.error.main,
        text: theme.palette.error.dark || '#b71c1c'
      };
    }
    if (p.includes('media')) {
      return {
        bg: alpha(theme.palette.warning.main, 0.12),
        border: theme.palette.warning.main,
        text: theme.palette.warning.dark || '#92400e'
      };
    }
    return {
      bg: alpha(theme.palette.success.main, 0.12),
      border: theme.palette.success.main,
      text: theme.palette.success.dark || '#166534'
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('misTickets.title') || 'Mis Tickets'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('misTickets.subtitle') || 'Aquí puedes ver y gestionar todos tus tickets'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchMyTickets()}
          disabled={loading}
        >
          {t('misTickets.refresh') || t('common.refresh') || 'Refrescar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && tickets.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('misTickets.noTickets') || 'No tienes tickets creados aún'}
        </Alert>
      ) : (
        <Box>
          {/* Lista de tickets en formato fila */}
          {tickets.map((ticket, index) => {
            const statusVisual = getStatusVisual(ticket.estado);
            const priorityStyles = getPriorityStyles(ticket.prioridad);

            return (
            <Card
              key={ticket.id_ticket}
              sx={{
                mb: 2.5,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: 'none',
                borderLeft: '5px solid',
                borderLeftColor: statusVisual.color,
                '&:hover': {
                  boxShadow: '0 10px 28px rgba(25, 118, 210, 0.18)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <Grid container spacing={0}>
                {/* Izquierda: Información principal */}
                <Grid item xs={12} sm={7} sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: { xs: 'none', sm: '1px solid #e5e7eb' } }}>
                  {/* Primera fila: ID, Prioridad, Estado */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {/* ID del Ticket */}
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#1e40af',
                        fontSize: '1.5rem',
                        minWidth: '90px'
                      }}
                    >
                      #{ticket.id_ticket}
                    </Typography>

                    {/* Prioridad Badge */}
                    <Box
                      sx={{
                        px: 2,
                        py: 0.6,
                        borderRadius: '6px',
                        backgroundColor: priorityStyles.bg,
                        border: '1.5px solid',
                        borderColor: priorityStyles.border
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: priorityStyles.text,
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {ticket.prioridad}
                      </Typography>
                    </Box>

                    {/* Estado */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: statusVisual.dot
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: '#374151'
                        }}
                      >
                        {translateStatus(ticket.estado)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Título */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: '#1a202c',
                      fontSize: '1.1rem',
                      lineHeight: 1.4
                    }}
                  >
                    {ticket.titulo}
                  </Typography>

                  {/* Descripción y Fecha */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748b',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      {ticket.descripcion || (
                        <em>{t('misTickets.noDescription') || 'Sin descripción'}</em>
                      )}
                    </Typography>

                    {/* Fecha */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        whiteSpace: 'nowrap',
                        ml: 2
                      }}
                    >
                      📅{' '}
                      {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Grid>

                {/* Derecha: Acciones */}
                <Grid
                  item
                  xs={12}
                  sm={5}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                  }}
                >
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewTicket(ticket.id_ticket)}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#115293'} 100%)`,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3.5,
                      py: 1.2,
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                      transition: 'all 0.3s ease',
                      flex: { xs: 1, sm: 'auto' },
                      '&:hover': {
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.38)}`,
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark || '#115293'} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {t('misTickets.viewDetailButton') || 'Ver Detalle'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => requestDelete(ticket)}
                    sx={{
                      fontWeight: 600,
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.error.main, 0.3),
                      borderWidth: '1.5px',
                      px: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                        borderColor: theme.palette.error.main,
                        borderWidth: '1.5px'
                      }
                    }}
                  >
                    {t('misTickets.deleteButton') || 'Eliminar'}
                  </Button>
                </Grid>
              </Grid>
            </Card>
          );
          })}
        </Box>
      )}

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('misTickets.confirmDelete') || '¿Eliminar ticket?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('misTickets.confirmDeleteMessage') || 'Esta acción no se puede deshacer.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {t('common.cancel') || 'Cancelar'}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete') || 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Overlay */}
      {showDeleteSuccess && (
        <SuccessOverlay
          open={showDeleteSuccess}
          onClose={() => setShowDeleteSuccess(false)}
          mode="delete"
          entity="Ticket"
          details={{
            id: deletedTicketInfo?.id_ticket,
            titulo: deletedTicketInfo?.titulo
          }}
        />
      )}

      {/* Snackbar para errores */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
