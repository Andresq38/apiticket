import React, { useState, useEffect, useRef } from 'react';
import { 
  IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, 
  Button, ListItemIcon, ListItemText, Chip 
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';
import { formatDateTime } from '../../utils/format';
import NotificacionService from '../../services/NotificacionService';

export default function NotificacionesBadge({ userId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [countNoLeidas, setCountNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'connecting', 'disconnected', 'error'
  const [adminFallbackId, setAdminFallbackId] = useState(null);
  const [notificacionesMarcadasLeidas, setNotificacionesMarcadasLeidas] = useState(() => {
    try {
      const stored = localStorage.getItem('notificacionesMarcadasLeidas');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);

  const open = Boolean(anchorEl);
  const apiBase = getApiOrigin();

  // Resolver id efectivo (prop o fallback admin)
  const effectiveUserId = userId || adminFallbackId;

  // Sincronizar con localStorage cuando cambie el Set
  useEffect(() => {
    try {
      localStorage.setItem('notificacionesMarcadasLeidas', JSON.stringify([...notificacionesMarcadasLeidas]));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }, [notificacionesMarcadasLeidas]);

  // Obtener id de administrador por defecto si no se pasa userId
  const fetchAdminFallback = async () => {
    if (userId || adminFallbackId) return;
    try {
      const res = await axios.get(`${apiBase}/apiticket/notificacion/adminDefault`);
      const idAdmin = res.data?.id_admin;
      if (idAdmin) {
        setAdminFallbackId(idAdmin);
        // Luego de resolver, cargar notificaciones iniciales
        setTimeout(() => fetchNotificaciones(), 50);
      } else {
        console.warn('adminDefault endpoint no devolvió id_admin');
      }
    } catch (e) {
      console.error('Error obteniendo adminDefault:', e);
    }
  };

  // Cargar notificaciones no leídas y el contador
  const fetchNotificaciones = async () => {
    if (!effectiveUserId) return;
    
    try {
      setLoading(true);
      // Usar NotificacionService en lugar de axios directo
      const [notifs, count] = await Promise.all([
        NotificacionService.getNoLeidas(effectiveUserId),
        NotificacionService.contarNoLeidas(effectiveUserId)
      ]);

      const notificacionesList = Array.isArray(notifs) ? notifs : (notifs?.data || []);
      
      // Filtrar notificaciones que ya fueron marcadas como leídas localmente
      const notificacionesFiltradas = notificacionesList.filter(n => 
        !notificacionesMarcadasLeidas.has(String(n.id_notificacion))
      );
      
      setNotificaciones(notificacionesFiltradas);
      setCountNoLeidas(notificacionesFiltradas.length);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conectar a SSE para notificaciones en tiempo real
  useEffect(() => {
    // Intentar resolver admin primero si falta userId
    if (!userId && !adminFallbackId) {
      fetchAdminFallback();
      return; // esperar a que se resuelva adminFallbackId
    }
    if (!effectiveUserId) return;

    let reconnectTimeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 5000; // 5 segundos

    const connectSSE = () => {
      // Limpiar conexión anterior si existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        setConnectionStatus('connecting');
        const eventSource = new EventSource(`${apiBase}/apiticket/notificacion/stream/${effectiveUserId}`);
        eventSourceRef.current = eventSource;

        // Evento: conexión establecida
        eventSource.onopen = () => {
          setConnectionStatus('connected');
          reconnectAttempts = 0; // Reset contador de reintentos
        };

        // Evento: nueva notificación recibida
        eventSource.addEventListener('notification', (event) => {
          try {
            const data = JSON.parse(event.data);
            
            setCountNoLeidas(data.count || 0);
            
            // Si hay última notificación, actualizar lista completa
            if (data.latest) {
              fetchNotificaciones(); // Refrescar lista completa
            }
          } catch (error) {
            console.error('Error al procesar evento notification:', error);
          }
        });

        // Evento: heartbeat (servidor sigue activo)
        eventSource.addEventListener('heartbeat', (event) => {
          try {
            const data = JSON.parse(event.data);
            // Heartbeat recibido correctamente
          } catch (error) {
            console.error('Error al procesar heartbeat:', error);
          }
        });

        // Evento: error en servidor
        eventSource.addEventListener('error', (event) => {
          try {
            const data = JSON.parse(event.data);
            // Error SSE del servidor registrado
          } catch (error) {
            // Silenciar errores de parsing
          }
        });

        // Error de conexión
        eventSource.onerror = (error) => {
          console.error('❌ Error en conexión SSE:', error);
          setConnectionStatus('error');
          eventSource.close();

          // Intentar reconexión automática
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connectSSE, RECONNECT_INTERVAL);
          } else {
            setConnectionStatus('disconnected');
            // Fallback: polling cada 30 segundos
            reconnectTimeout = setInterval(fetchNotificaciones, 30000);
          }
        };

      } catch (error) {
        console.error('Error al crear EventSource:', error);
        setConnectionStatus('error');
      }
    };

    // Iniciar conexión SSE
    connectSSE();

    // Cargar notificaciones iniciales
    fetchNotificaciones();

    // Cleanup al desmontar
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        clearInterval(reconnectTimeout);
      }
    };
  }, [userId, adminFallbackId, effectiveUserId, apiBase]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotificaciones(); // Refrescar al abrir para obtener lista completa
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarcarComoLeida = async (id, event) => {
    event.stopPropagation();
    if (!effectiveUserId) return;
    try {
      // Agregar a la lista de marcadas como leídas
      setNotificacionesMarcadasLeidas(prev => new Set([...prev, String(id)]));
      
      // Eliminar de la lista (ya que mostramos solo no leídas)
      setNotificaciones(prev => {
        const filtered = prev.filter(n => String(n.id_notificacion) !== String(id));
        console.log('Filtrando notificación', id, 'Antes:', prev.length, 'Después:', filtered.length);
        return filtered;
      });
      setCountNoLeidas(prev => Math.max(0, prev - 1));
      
      // Hacer request al backend
      await NotificacionService.marcarComoLeida(id, effectiveUserId);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (!effectiveUserId) return;
    try {
      // Agregar todas las notificaciones actuales a la lista de marcadas
      const idsActuales = notificaciones.map(n => String(n.id_notificacion));
      setNotificacionesMarcadasLeidas(prev => new Set([...prev, ...idsActuales]));
      
      // Limpiar lista y contador inmediatamente
      setNotificaciones([]);
      setCountNoLeidas(0);
      
      // Hacer request al backend
      await NotificacionService.marcarTodasLeidas(effectiveUserId);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleVerTodas = () => {
    handleClose();
    navigate('/notificaciones');
  };

  const getTipoColor = (tipo) => {
    if (tipo?.includes('estado')) return 'primary';
    if (tipo?.includes('sesión') || tipo?.includes('sesi')) return 'success';
    if (tipo?.includes('asignación') || tipo?.includes('asignacion')) return 'warning';
    return 'default';
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1, position: 'relative' }}
        aria-label={`${countNoLeidas} notificaciones no leídas`}
      >
        <Badge badgeContent={countNoLeidas} color="error">
          {countNoLeidas > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
        {/* Indicador de estado de conexión SSE */}
        {connectionStatus === 'connected' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
              border: '2px solid white',
              boxShadow: 1
            }}
            title="Tiempo real activo"
          />
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 500,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notificaciones
          </Typography>
          <Typography variant="caption">
            {countNoLeidas} no leída{countNoLeidas !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Acciones rápidas */}
        {countNoLeidas > 0 && (
          <Box sx={{ p: 1, bgcolor: 'grey.50', display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarcarTodasLeidas}
              fullWidth
              variant="outlined"
            >
              Marcar todas leídas
            </Button>
          </Box>
        )}

        <Divider />

        {/* Lista de notificaciones */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                Cargando...
              </Typography>
            </MenuItem>
          ) : notificaciones.length === 0 ? (
            <MenuItem disabled>
              <Box sx={{ textAlign: 'center', py: 3, width: '100%' }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No tienes notificaciones nuevas
                </Typography>
              </Box>
            </MenuItem>
          ) : (
            notificaciones.slice(0, 5).map((notif) => (
              <MenuItem
                key={notif.id_notificacion}
                sx={{
                  display: 'block',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: notif.estado === 'No Leida' ? 'action.hover' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }}
                onClick={async (e) => {
                  e.stopPropagation();
                  
                  // Extraer id de ticket del mensaje primero
                  const msg = notif.mensaje || '';
                  const match = msg.match(/ticket #(\d+)/i);
                  const ticketId = match ? match[1] : null;
                  
                  // Marcar como leída si está 'No Leida'
                  if (notif.estado === 'No Leida' && effectiveUserId) {
                    try {
                      console.log('Marcando notificación como leída:', notif.id_notificacion);
                      
                      // Agregar a la lista de marcadas como leídas
                      setNotificacionesMarcadasLeidas(prev => new Set([...prev, String(notif.id_notificacion)]));
                      
                      // Actualizar UI inmediatamente
                      setNotificaciones(prev => {
                        const filtered = prev.filter(n => 
                          String(n.id_notificacion) !== String(notif.id_notificacion)
                        );
                        console.log('Click notif - Filtrando:', notif.id_notificacion, 'Antes:', prev.length, 'Después:', filtered.length);
                        return filtered;
                      });
                      setCountNoLeidas(prev => Math.max(0, prev - 1));
                      
                      // Luego hacer el request al backend
                      NotificacionService.marcarComoLeida(notif.id_notificacion, effectiveUserId).catch(error => {
                        console.error('Error al marcar notificación como leída:', error);
                      });
                    } catch (error) {
                      console.error('Error al procesar notificación:', error);
                    }
                  }
                  
                  // Navegar si hay ticket
                  if (ticketId) {
                    handleClose();
                    navigate(`/tickets/${ticketId}`);
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                  <Chip
                    label={notif.tipo_evento || 'Notificación'}
                    size="small"
                    color={getTipoColor(notif.tipo_evento)}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  {notif.estado === 'No Leida' && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMarcarComoLeida(notif.id_notificacion, e)}
                      sx={{ ml: 1 }}
                    >
                      <MarkEmailReadIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: notif.estado === 'No Leida' ? 600 : 400,
                    mb: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {notif.mensaje || 'Sin mensaje'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(notif.fecha_hora)}
                </Typography>
                {notif.nombre_remitente && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    De: {notif.nombre_remitente}
                  </Typography>
                )}
              </MenuItem>
            ))
          )}
        </Box>

        {/* Footer */}
        {notificaciones.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={handleVerTodas}
                size="small"
              >
                Ver todas las notificaciones
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
