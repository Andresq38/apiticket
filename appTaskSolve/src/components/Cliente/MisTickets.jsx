import React, { useEffect, useState, useMemo } from 'react';
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
  Snackbar,
  Chip,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import SuccessOverlay from '../common/SuccessOverlay';
import CreateTicket from '../Tickets/CreateTicket';
import { alpha } from '@mui/material/styles';

/**
 * MisTickets Component
 * 
 * Muestra los tickets creados por el cliente actual en formato de tarjetas.
 * Incluye opción de crear nuevo ticket en un modal.
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState(new Set());

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
   * Toggle para seleccionar/deseleccionar un ticket
   */
  const toggleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  /**
   * Seleccionar todos los tickets
   */
  const selectAllTickets = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map(t => t.id_ticket)));
    }
  };

  /**
   * Solicitar confirmación para eliminar ticket
   */
  const requestDelete = (ticket) => {
    setTargetTicket(ticket);
    setConfirmOpen(true);
  };

  /**
   * Eliminar tickets seleccionados
   */
  const deleteSelectedTickets = () => {
    if (selectedTickets.size === 0) return;
    setTargetTicket(null);
    setConfirmOpen(true);
  };

  /**
   * Confirmar eliminación del ticket
   */
  const confirmDelete = async () => {
    setConfirmOpen(false);

    try {
      // Si tenemos un ticket específico (eliminación individual)
      if (targetTicket) {
        const t = targetTicket;
        setTargetTicket(null);
        await axios.delete(`${apiBase}/apiticket/ticket/delete/${t.id_ticket}`);
        setTickets(prev => prev.filter(x => x.id_ticket !== t.id_ticket));
        setDeletedTicketInfo(t);
        setShowDeleteSuccess(true);
      }
      // Si tenemos múltiples seleccionados (eliminación masiva)
      else if (selectedTickets.size > 0) {
        const ticketsToDelete = Array.from(selectedTickets);
        let deletedCount = 0;
        let failedCount = 0;

        for (const ticketId of ticketsToDelete) {
          try {
            await axios.delete(`${apiBase}/apiticket/ticket/delete/${ticketId}`);
            deletedCount++;
          } catch (err) {
            console.error(`Error eliminando ticket ${ticketId}:`, err);
            failedCount++;
          }
        }

        // Actualizar lista después de eliminar
        setTickets(prev => prev.filter(x => !selectedTickets.has(x.id_ticket)));
        setSelectedTickets(new Set());
        setDeleteMode(false);

        // Mostrar mensaje de resultado
        if (deletedCount > 0) {
          setSnackbar({
            open: true,
            message: `${deletedCount} ticket(s) eliminado(s) exitosamente${failedCount > 0 ? ` (${failedCount} falló)` : ''}`,
            severity: failedCount > 0 ? 'warning' : 'success'
          });
        } else if (failedCount > 0) {
          setSnackbar({
            open: true,
            message: `No se pudieron eliminar los tickets`,
            severity: 'error'
          });
        }
      }
    } catch (err) {
      console.error('Error eliminando tickets:', err);
      const msg = err?.response?.data?.error || 
                  'No se pudieron eliminar los tickets';
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
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
          {deleteMode ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedTickets(new Set());
                }}
                sx={{ fontWeight: 700 }}
              >
                {t('misTickets.cancel') || 'Cancelar'}
              </Button>
              <Button
                variant="contained"
                onClick={selectAllTickets}
                sx={{
                  background: selectedTickets.size === tickets.length 
                    ? `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`
                    : `linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)`,
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                {selectedTickets.size === tickets.length 
                  ? (t('misTickets.deselectAll') || 'Deseleccionar todo')
                  : (t('misTickets.selectAll') || 'Seleccionar todo')}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={deleteSelectedTickets}
                disabled={selectedTickets.size === 0}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('misTickets.deleteSelected') || 'Eliminar'} {selectedTickets.size > 0 && `(${selectedTickets.size})`}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark || '#1b5e20'} 100%)`,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.38)}`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {t('misTickets.createButton') || 'Crear Nuevo Ticket'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteMode(true)}
                disabled={tickets.length === 0}
                sx={{
                  color: theme.palette.error.main,
                  borderColor: theme.palette.error.main,
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                {t('misTickets.deleteMultiple') || 'Eliminar Múltiples'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchMyTickets()}
                disabled={loading}
              >
                {t('misTickets.refresh') || t('common.refresh') || 'Refrescar'}
              </Button>
            </>
          )}
        </Box>
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
                  {ticket.descripcion && (
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
                        {ticket.descripcion}
                      </Typography>
                    </Box>
                  )}

                  {/* Fecha */}
                  {ticket.fecha_creacion && !isNaN(new Date(ticket.fecha_creacion).getTime()) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        whiteSpace: 'nowrap',
                        mt: ticket.descripcion ? 0 : 0
                      }}
                    >
                      📅{' '}
                      {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  )}
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
                  {deleteMode && (
                    <Checkbox
                      checked={selectedTickets.has(ticket.id_ticket)}
                      onChange={() => toggleSelectTicket(ticket.id_ticket)}
                      sx={{
                        color: theme.palette.error.main,
                        '&.Mui-checked': {
                          color: theme.palette.error.main
                        }
                      }}
                    />
                  )}
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
                </Grid>
              </Grid>
            </Card>
          );
          })}
        </Box>
      )}

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          {selectedTickets.size > 0 
            ? `¿Eliminar ${selectedTickets.size} ticket(s)?` 
            : (t('misTickets.confirmDelete') || '¿Eliminar ticket?')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedTickets.size > 0 
              ? `Se eliminarán ${selectedTickets.size} ticket(s). Esta acción no se puede deshacer.`
              : (t('misTickets.confirmDeleteMessage') || 'Esta acción no se puede deshacer.')}
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

      {/* Modal para crear nuevo ticket */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#115293'} 100%)`,
            color: 'white',
            fontWeight: 700,
            fontSize: '1.3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2
          }}
        >
          {t('misTickets.createNewTicketTitle') || 'Crear Nuevo Ticket'}
          <IconButton
            size="small"
            onClick={() => setCreateModalOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3, maxHeight: 'calc(90vh - 200px)', overflow: 'auto' }}>
          <CreateTicket
            isFromHub={true}
            onSuccess={(ticketId) => {
              // Cerrar modal inmediatamente
              setCreateModalOpen(false);
              // Mostrar overlay de éxito después de cerrar el modal
              setCreatedTicketInfo({ id_ticket: ticketId });
              setSuccessMessage(`✓ Ticket #${ticketId} creado exitosamente`);
              setShowCreateSuccess(true);
              // NO se recarga automáticamente - el usuario decide qué hacer con los botones
            }}
            isModal={true}
          />
        </DialogContent>
      </Dialog>

      {/* Success Overlay para creación */}
      <SuccessOverlay
        open={showCreateSuccess}
        mode="create"
        entity="Ticket"
        variant="extended"
        details={{
          id: createdTicketInfo?.id_ticket
        }}
        onClose={() => {
          setShowCreateSuccess(false);
          setCreatedTicketInfo(null);
          // Refrescar lista cuando se cierre
          fetchMyTickets();
        }}
        actions={[
          { 
            label: 'Crear otro', 
            onClick: () => {
              setShowCreateSuccess(false);
              setCreatedTicketInfo(null);
              setCreateModalOpen(true);
            }, 
            variant: 'contained', 
            color: 'success' 
          },
          { 
            label: 'Ir a mis tickets', 
            onClick: () => {
              setShowCreateSuccess(false);
              setCreatedTicketInfo(null);
              fetchMyTickets();
            }, 
            variant: 'outlined', 
            color: 'success' 
          }
        ]}
      />
    </Container>
  );
}
