import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PersonIcon from '@mui/icons-material/Person';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getApiOrigin } from '../../utils/apiBase';

const AsignacionesTecnicos = () => {
  const { t } = useTranslation();
  const [tecnicos, setTecnicos] = useState([]);
  const [ticketsPorTecnico, setTicketsPorTecnico] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getApiBase = () => getApiOrigin();

  useEffect(() => {
    fetchAsignaciones();
  }, []);

  const fetchAsignaciones = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBase();
      
      // Obtener todos los técnicos
      const tecnicosRes = await axios.get(`${apiBase}/apiticket/tecnico`);
      const tecnicosData = Array.isArray(tecnicosRes.data) ? tecnicosRes.data : (tecnicosRes.data?.data || []);
      setTecnicos(tecnicosData);

      // Obtener tickets para cada técnico
      const ticketsMap = {};
      for (const tecnico of tecnicosData) {
        try {
          const ticketsRes = await axios.get(`${apiBase}/apiticket/ticket/getTicketByTecnico/${tecnico.id_tecnico}`);
          const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.data || []);
          ticketsMap[tecnico.id_tecnico] = ticketsData;
        } catch (err) {
          console.error(`Error al cargar tickets del técnico ${tecnico.id_tecnico}:`, err);
          ticketsMap[tecnico.id_tecnico] = [];
        }
      }
      
      setTicketsPorTecnico(ticketsMap);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
      setError(`Error al cargar datos. Código: ${err.response?.status || 'desconocido'}`);
      setLoading(false);
    }
  };

  // Función para calcular la urgencia basada en el tiempo SLA restante
  const getUrgenciaColor = (tiempoRestante) => {
    if (!tiempoRestante) return { color: 'default', label: 'Sin SLA' };
    
    const match = tiempoRestante.match(/(-?\d+)/);
    if (!match) return { color: 'default', label: 'Sin datos' };
    
    const horas = parseInt(match[1]);
    
    if (horas < 0) {
      return { color: 'error', label: 'Vencido', severity: 'high' };
    } else if (horas <= 4) {
      return { color: 'error', label: 'Urgente', severity: 'high' };
    } else if (horas <= 24) {
      return { color: 'warning', label: 'Próximo', severity: 'medium' };
    } else {
      return { color: 'success', label: 'Normal', severity: 'low' };
    }
  };

  // Función para obtener el color del borde de la card
  const getBorderColor = (urgencia) => {
    switch (urgencia.severity) {
      case 'high':
        return '#d32f2f'; // Rojo
      case 'medium':
        return '#ed6c02'; // Naranja
      case 'low':
        return '#2e7d32'; // Verde
      default:
        return '#757575'; // Gris
    }
  };

  // Función para obtener color distintivo por técnico (rotativo según ID)
  const getTecnicoColor = (idTecnico) => {
    const colors = [
      { gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)', bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' }, // Verde
      { gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' }, // Azul
      { gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)', bg: '#fff3e0', text: '#f57c00', border: '#ffcc80' }, // Naranja
      { gradient: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)', bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' }, // Púrpura
      { gradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', bg: '#ffebee', text: '#d32f2f', border: '#ef9a9a' }, // Rojo
      { gradient: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)', bg: '#e1f5fe', text: '#0288d1', border: '#81d4fa' }, // Cyan
    ];
    const index = (idTecnico - 1) % colors.length;
    return colors[index];
  };

  const handleVerDetalle = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Cargando asignaciones...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Profesional - Estilo Panel Ejecutivo */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 55%, #0d47a1 100%)',
        borderRadius: 3,
        p: 2.2,
        mb: 3,
        boxShadow: '0 6px 22px rgba(25,118,210,0.25)',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.14)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 65%)',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #2e7d32, #1976d2, #ed6c02, #d32f2f)',
          backgroundSize: '300% 100%',
          animation: 'rainbowShift 8s linear infinite'
        },
        '@keyframes rainbowShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '300% 50%' }
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.28)',
            borderRadius: '50%',
            p: 1.3,
            display: 'flex',
            border: '2px solid rgba(255, 255, 255, 0.42)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <ConfirmationNumberIcon sx={{ fontSize: 30, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 800, 
              color: 'white', 
              mb: 0.3, 
              letterSpacing: '-0.5px', 
              textShadow: '0 2px 6px rgba(0,0,0,0.25)',
              fontSize: '1.55rem'
            }}>
              Tablero de Asignaciones
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: 600, 
              fontSize: '0.75rem'
            }}>
              Vista de tiquetes asignados por técnico con indicadores de urgencia según SLA
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Leyenda de colores - Mejorada */}
      <Box sx={{ 
        mb: 3, 
        p: 2.5, 
        bgcolor: 'white', 
        borderRadius: 3, 
        border: '2px solid #e0e7ff',
        boxShadow: '0 2px 8px rgba(25,118,210,0.08)'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b', fontSize: '0.9rem' }}>
          Leyenda de Urgencia:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<WarningIcon />} 
            label="Vencido / Urgente (< 4h)" 
            sx={{
              bgcolor: '#ffebee',
              color: '#d32f2f',
              border: '2px solid #ef9a9a',
              fontWeight: 700,
              height: 28
            }}
          />
          <Chip 
            icon={<AccessTimeIcon />} 
            label="Próximo a vencer (< 24h)" 
            sx={{
              bgcolor: '#fff3e0',
              color: '#f57c00',
              border: '2px solid #ffcc80',
              fontWeight: 700,
              height: 28
            }}
          />
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Normal (> 24h)" 
            sx={{
              bgcolor: '#e8f5e9',
              color: '#2e7d32',
              border: '2px solid #a5d6a7',
              fontWeight: 700,
              height: 28
            }}
          />
        </Box>
      </Box>

      {/* Grid de técnicos con sus tickets */}
      <Grid container spacing={3}>
        {tecnicos.map((tecnico) => {
          const tickets = ticketsPorTecnico[tecnico.id_tecnico] || [];
          const ticketsActivos = tickets.filter(t => 
            t['Estado actual'] === 'Asignado' || t['Estado actual'] === 'En Proceso'
          );
          const tecnicoColor = getTecnicoColor(tecnico.id_tecnico);

          return (
            <Grid item xs={12} md={6} lg={4} key={tecnico.id_tecnico}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: `2px solid ${tecnicoColor.border}`,
                  boxShadow: `0 4px 12px ${tecnicoColor.text}20`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${tecnicoColor.text}30`,
                    borderColor: tecnicoColor.text
                  }
                }}
              >
                {/* Header del técnico - Estilo mejorado con color único */}
                <Box 
                  sx={{ 
                    p: 2.5, 
                    background: tecnicoColor.gradient,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: '10px 10px 0 0',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '200px',
                      height: '100%',
                      background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 70%)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <Avatar sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    width: 48,
                    height: 48,
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <PersonIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.3 }}>
                      {tecnico.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 600, fontSize: '0.85rem' }}>
                      {ticketsActivos.length} tiquete{ticketsActivos.length !== 1 ? 's' : ''} activo{ticketsActivos.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Lista de tickets */}
                <Box sx={{ p: 2.5, flex: 1, overflow: 'auto', maxHeight: 600, bgcolor: '#fafafa' }}>
                  {ticketsActivos.length === 0 ? (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 1,
                        borderRadius: 2,
                        border: '2px solid #90caf9',
                        fontWeight: 600
                      }}
                    >
                      No hay tiquetes asignados
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {ticketsActivos.map((ticket) => {
                        const urgencia = getUrgenciaColor(ticket['Tiempo restante SLA']);
                        const borderColor = getBorderColor(urgencia);

                        return (
                          <Card
                            key={ticket['Identificador del Ticket']}
                            sx={{
                              borderLeft: `5px solid ${borderColor}`,
                              borderRadius: 2.5,
                              bgcolor: 'white',
                              boxShadow: `0 2px 8px ${borderColor}20`,
                              border: `2px solid ${borderColor}30`,
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: `0 6px 16px ${borderColor}35`,
                                borderColor: borderColor
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              {/* Chip de urgencia centrado arriba */}
                              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.2 }}>
                                <Chip
                                  label={urgencia.label}
                                  size="small"
                                  sx={{ 
                                    fontWeight: 800,
                                    bgcolor: urgencia.severity === 'high' ? '#ffebee' : urgencia.severity === 'medium' ? '#fff3e0' : '#e8f5e9',
                                    color: borderColor,
                                    border: `2px solid ${borderColor}`,
                                    fontSize: '0.7rem',
                                    height: 24
                                  }}
                                />
                              </Box>
                              
                              {/* ID del ticket */}
                              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                                <Chip
                                  icon={<ConfirmationNumberIcon sx={{ fontSize: 16 }} />}
                                  label={`#${ticket['Identificador del Ticket']}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontWeight: 700,
                                    border: '2px solid #90caf9',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Box>

                              {/* Título del ticket */}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 1,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {ticket.Título || 'Sin título'}
                              </Typography>

                              {/* Categoría */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CategoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {ticket['Categoría'] || t('tickets.fields.category', 'Categoría')}
                                </Typography>
                              </Box>

                              {/* Estado */}
                              <Box sx={{ mb: 1 }}>
                                <Chip
                                  label={ticket['Estado actual']}
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>

                              {/* Tiempo SLA */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: borderColor }} />
                                <Typography variant="caption" sx={{ color: borderColor, fontWeight: 600 }}>
                                  {t('assignments.slaLabel', 'SLA')}: {ticket['Tiempo restante SLA'] || t('assignments.noSla', 'No disponible')}
                                </Typography>
                              </Box>

                              {/* Botón ver detalle */}
                              <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleVerDetalle(ticket['Identificador del Ticket'])}
                                sx={{ mt: 1 }}
                              >
                                {t('actions.viewDetail')}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Mensaje si no hay técnicos */}
      {tecnicos.length === 0 && (
        <Alert severity="info">
          {t('assignments.noTechnicians', 'No hay técnicos registrados en el sistema.')}
        </Alert>
      )}
    </Container>
  );
};

export default AsignacionesTecnicos;
