import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Avatar, 
  Chip, 
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  Assignment as AssignIcon,
  CheckCircle as ResolveIcon,
  Schedule as ClockIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';

/**
 * Timeline de actividad en tiempo real
 * Muestra las últimas acciones en el sistema
 */
const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const apiBase = getApiOrigin();
      
      // Obtener historial reciente (últimas 10 acciones)
      const historialRes = await axios.get(`${apiBase}/apiticket/historial_estado`);
      const historialData = Array.isArray(historialRes.data) ? historialRes.data : [];
      
      // Formatear actividades
      const formattedActivities = historialData
        .slice(0, 10)
        .map(item => ({
          id: item.id_historial,
          type: getActivityType(item.estado_nombre),
          action: getActionText(item.estado_nombre),
          user: item.usuario_nombre || 'Sistema',
          ticketId: item.id_ticket,
          ticketTitle: item.ticket_titulo,
          timestamp: item.fecha_cambio,
          icon: getActionIcon(item.estado_nombre),
          color: getActionColor(item.estado_nombre)
        }));
      
      setActivities(formattedActivities);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActivityType = (estado) => {
    const types = {
      'Pendiente': 'created',
      'Asignado': 'assigned',
      'En Proceso': 'working',
      'Resuelto': 'resolved',
      'Cerrado': 'closed'
    };
    return types[estado] || 'update';
  };

  const getActionText = (estado) => {
    const actions = {
      'Pendiente': 'creó tiquete',
      'Asignado': 'asignó tiquete',
      'En Proceso': 'inició trabajo',
      'Resuelto': 'resolvió tiquete',
      'Cerrado': 'cerró tiquete'
    };
    return actions[estado] || 'actualizó';
  };

  const getActionIcon = (estado) => {
    const icons = {
      'Pendiente': TicketIcon,
      'Asignado': AssignIcon,
      'En Proceso': ClockIcon,
      'Resuelto': ResolveIcon,
      'Cerrado': ResolveIcon
    };
    return icons[estado] || TicketIcon;
  };

  const getActionColor = (estado) => {
    const colors = {
      'Pendiente': '#3b82f6',
      'Asignado': '#8b5cf6',
      'En Proceso': '#f59e0b',
      'Resuelto': '#10b981',
      'Cerrado': '#64748b'
    };
    return colors[estado] || '#6b7280';
  };

  const getRelativeTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: es 
      });
    } catch {
      return 'hace un momento';
    }
  };

  return (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2.5,
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 2, 
            p: 1, 
            display: 'flex' 
          }}>
            <DotIcon sx={{ fontSize: 24, animation: 'pulse 2s infinite' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.3 }}>
              Actividad en Tiempo Real
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
              Últimas acciones del sistema
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Actualizar">
          <IconButton 
            size="small" 
            onClick={fetchActivities}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
            }}
          >
            <RefreshIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Timeline */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        bgcolor: '#fafafa'
      }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Cargando actividades...
            </Typography>
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay actividad reciente
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Línea vertical del timeline */}
            <Box sx={{
              position: 'absolute',
              left: 42,
              top: 20,
              bottom: 20,
              width: 2,
              bgcolor: '#e0e0e0',
              zIndex: 0
            }} />

            {activities.map((activity, index) => {
              const IconComponent = activity.icon;
              
              return (
                <Box 
                  key={activity.id}
                  sx={{ 
                    position: 'relative',
                    pl: 9,
                    pr: 2.5,
                    py: 2,
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'white',
                      '& .activity-card': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                >
                  {/* Icono del evento */}
                  <Box sx={{
                    position: 'absolute',
                    left: 22,
                    top: 16,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: activity.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #fafafa',
                    zIndex: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <IconComponent sx={{ fontSize: 20, color: 'white' }} />
                  </Box>

                  {/* Contenido */}
                  <Box 
                    className="activity-card"
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#1e293b',
                            mb: 0.5
                          }}
                        >
                          <Box component="span" sx={{ color: activity.color }}>
                            {activity.user}
                          </Box>
                          {' '}{activity.action}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            display: 'block',
                            fontSize: '0.75rem'
                          }}
                        >
                          #{activity.ticketId} {activity.ticketTitle && `- ${activity.ticketTitle.substring(0, 40)}${activity.ticketTitle.length > 40 ? '...' : ''}`}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                      <Chip
                        icon={<ClockIcon sx={{ fontSize: 12, color: 'inherit !important' }} />}
                        label={getRelativeTime(activity.timestamp)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          bgcolor: '#f1f5f9',
                          color: '#64748b',
                          fontWeight: 500,
                          '& .MuiChip-icon': {
                            ml: 0.5
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Card>
  );
};

export default ActivityTimeline;
