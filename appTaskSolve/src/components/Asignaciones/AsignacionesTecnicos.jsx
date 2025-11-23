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
import PersonIcon from '@mui/icons-material/Person';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getApiOrigin } from '../../utils/apiBase';

const AsignacionesTecnicos = () => {
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
          📋 Tablero de Asignaciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista de tiquetes asignados por técnico con indicadores de urgencia según SLA
        </Typography>
      </Box>

      {/* Leyenda de colores */}
      <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Leyenda de Urgencia:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<WarningIcon />} label="Vencido / Urgente (< 4h)" color="error" size="small" />
          <Chip icon={<AccessTimeIcon />} label="Próximo a vencer (< 24h)" color="warning" size="small" />
          <Chip icon={<CheckCircleIcon />} label="Normal (> 24h)" color="success" size="small" />
        </Box>
      </Box>

      {/* Grid de técnicos con sus tickets */}
      <Grid container spacing={3}>
        {tecnicos.map((tecnico) => {
          const tickets = ticketsPorTecnico[tecnico.id_tecnico] || [];
          const ticketsActivos = tickets.filter(t => 
            t['Estado actual'] === 'Asignado' || t['Estado actual'] === 'En Proceso'
          );

          return (
            <Grid item xs={12} md={6} lg={4} key={tecnico.id_tecnico}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header del técnico */}
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {tecnico.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {ticketsActivos.length} tiquete{ticketsActivos.length !== 1 ? 's' : ''} activo{ticketsActivos.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Lista de tickets */}
                <Box sx={{ p: 2, flex: 1, overflow: 'auto', maxHeight: 600 }}>
                  {ticketsActivos.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
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
                            variant="outlined"
                            sx={{
                              borderLeft: `4px solid ${borderColor}`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              {/* ID del ticket y urgencia */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Chip
                                  icon={<ConfirmationNumberIcon />}
                                  label={`#${ticket['Identificador del Ticket']}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={urgencia.label}
                                  size="small"
                                  color={urgencia.color}
                                  sx={{ fontWeight: 700 }}
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
                                  {ticket['Categoría']}
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
                                  SLA: {ticket['Tiempo restante SLA'] || 'No disponible'}
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
                                Ver Detalle
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
          No hay técnicos registrados en el sistema.
        </Alert>
      )}
    </Container>
  );
};

export default AsignacionesTecnicos;
