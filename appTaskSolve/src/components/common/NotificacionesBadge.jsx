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
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);

  const open = Boolean(anchorEl);
  const apiBase = getApiOrigin();

  // Cargar notificaciones no leídas y el contador (fallback manual)
  const fetchNotificaciones = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // Usar NotificacionService en lugar de axios directo
      const [notifs, count] = await Promise.all([
        NotificacionService.getNoLeidas(userId),
        NotificacionService.contarNoLeidas(userId)
      ]);

      const notificaciones = Array.isArray(notifs) ? notifs : (notifs?.data || []);
      setNotificaciones(notificaciones);
      setCountNoLeidas(count);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conectar a SSE para notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

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
        const eventSource = new EventSource(`${apiBase}/apiticket/notificationstream/stream/${userId}`);
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
  }, [userId, apiBase]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotificaciones(); // Refrescar al abrir para obtener lista completa
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarcarComoLeida = async (id, event) => {
    event.stopPropagation();
    try {
      // Usar NotificacionService en lugar de axios directo
      await NotificacionService.marcarComoLeida(id, userId);
      fetchNotificaciones(); // Recargar lista
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      // Usar NotificacionService en lugar de axios directo
      await NotificacionService.marcarTodasLeidas(userId);
      fetchNotificaciones();
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
