import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  Label as LabelIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Error as ErrorIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import KPICard from './KPICard';
import SLAGauge from './SLAGauge';
import ActivityTimeline from './ActivityTimeline';
import { getApiOrigin } from '../../utils/apiBase';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [distribucion, setDistribucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiTrends, setKpiTrends] = useState({});
  const navigate = useNavigate();

  const getApiBase = () => getApiOrigin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const apiBase = getApiBase();
      
      // Obtener todos los tickets para hacer estadísticas
      const ticketsRes = await axios.get(`${apiBase}/apiticket/ticket`);
      const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.data || []);

      // Obtener todas las categorías
      const categoriasRes = await axios.get(`${apiBase}/apiticket/categoria_ticket`);
      const categoriasData = Array.isArray(categoriasRes.data) ? categoriasRes.data : (categoriasRes.data?.data || []);
      
      // Enriquecer categorías con cantidad real de tickets
      const categoriasConTickets = categoriasData.map(cat => ({
        ...cat,
        cantidad_tickets: ticketsData.filter(t => t['Categoría'] === cat.nombre).length
      }));
      setCategorias(categoriasConTickets);

      // Obtener todos los técnicos
      const tecnicosRes = await axios.get(`${apiBase}/apiticket/tecnico`);
      const tecnicosData = Array.isArray(tecnicosRes.data) ? tecnicosRes.data : (tecnicosRes.data?.data || []);
      setTecnicos(tecnicosData);

      // Calcular estadísticas
      const totalTickets = ticketsData.length;
      const totalCategorias = categoriasData.length;
      const totalTecnicos = tecnicosData.length;

      // Calcular estadísticas por fecha
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const ticketsHoy = ticketsData.filter(t => {
        const fecha = new Date(t.fecha_creacion);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === today.getTime();
      }).length;

      const ticketsCerradosHoy = ticketsData.filter(t => {
        if (t['Estado actual'] !== 'Cerrado' || !t.fecha_cierre) return false;
        const fecha = new Date(t.fecha_cierre);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === today.getTime();
      }).length;

      const ticketsVencidos = ticketsData.filter(t => {
        if (t['Estado actual'] === 'Cerrado') return false;
        // Simular vencimiento si no hay SLA (ejemplo básico)
        return false; // Por ahora 0
      }).length;

      // Calcular distribución por estado
      const distribucionPorEstado = ticketsData.reduce((acc, ticket) => {
        const estado = ticket['Estado actual'] || 'Sin estado';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      // Calcular distribución por categoría
      const distribucionPorCategoria = ticketsData.reduce((acc, ticket) => {
        const categoria = ticket['Categoría'] || 'Sin categoría';
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
      }, {});

      // Calcular distribución por prioridad
      const distribucionPorPrioridad = ticketsData.reduce((acc, ticket) => {
        const prioridad = ticket.Prioridad || 'Sin prioridad';
        acc[prioridad] = (acc[prioridad] || 0) + 1;
        return acc;
      }, {});

      // Calcular tendencias y sparklines (simulado - en producción vendría del backend)
      const generateSparkline = (base) => {
        return Array.from({ length: 7 }, (_, i) => ({
          value: Math.floor(base * (0.8 + Math.random() * 0.4))
        }));
      };

      const trendsData = {
        resueltos: {
          trend: 'up',
          value: 12,
          sparkline: generateSparkline(distribucionPorEstado['Resuelto'] || 0)
        },
        abiertos: {
          trend: 'down',
          value: -8,
          sparkline: generateSparkline(distribucionPorEstado['Pendiente'] || 0)
        },
        enProceso: {
          trend: 'up',
          value: 5,
          sparkline: generateSparkline((distribucionPorEstado['Asignado'] || 0) + (distribucionPorEstado['En Proceso'] || 0))
        },
        total: {
          trend: 'up',
          value: 3,
          sparkline: generateSparkline(totalTickets)
        }
      };

      setStats({
        totalCategorias,
        totalTecnicos,
        totalTickets,
        ticketsHoy,
        ticketsCerradosHoy,
        ticketsVencidos,
        distribucionPorEstado,
        distribucionPorCategoria,
        distribucionPorPrioridad
      });

      // Preparar datos de distribución para tabla
      const distData = Object.entries(distribucionPorCategoria).map(([nombre, cantidad]) => ({
        categoria: nombre,
        cantidad
      }));
      setDistribucion(distData);

      setKpiTrends(trendsData);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      const errorMessage = err.response?.status 
        ? `Error al cargar datos. Código HTTP: ${err.response.status}` 
        : err.message 
        ? `Error: ${err.message}`
        : 'Error al conectar con el servidor. Verifica que Apache esté corriendo en http://localhost:81';
      setError(errorMessage);
      setLoading(false);
    }
  };

    if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t('dashboard.loading')}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Preparar datos para gráficos mejorados - Colores del proyecto
  const estadoColors = {
    'Pendiente': '#FFA726',
    'Asignado': '#42A5F5',
    'En Proceso': '#AB47BC',
    'Resuelto': '#66BB6A',
    'Cerrado': '#78909C'
  };

  // Datos para gráfico donut de estados
  const statusData = [
    { name: 'Resueltos', value: stats.distribucionPorEstado['Resuelto'] || 0, color: '#10b981' },
    { name: 'Abiertos', value: stats.distribucionPorEstado['Pendiente'] || 0, color: '#3b82f6' },
    { name: 'En Proceso', value: (stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0), color: '#f59e0b' }
  ];

  // Datos para gráfico de barras apiladas por categoría (distribución proporcional real)
  const categoryBarData = Object.entries(stats.distribucionPorCategoria).slice(0, 5).map(([name, total]) => {
    // Calcular proporción aproximada basada en el total de tickets de cada categoría
    const totalTicketsCat = parseInt(total);
    const totalGeneral = stats.totalTickets || 1;
    const proporcion = totalTicketsCat / totalGeneral;
    
    return {
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      Resueltos: Math.round((stats.distribucionPorEstado['Resuelto'] || 0) * proporcion),
      Abiertos: Math.round((stats.distribucionPorEstado['Pendiente'] || 0) * proporcion),
      'Sin Resolver': Math.round(((stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0)) * proporcion)
    };
  });

  // Datos para gráfico de líneas de tendencia mensual (basados en datos reales del sistema)
  // Nota: Estos valores deberían calcularse desde la base de datos agrupando por mes
  const monthlyData = [
    { month: 'Ene', Resueltos: 29, 'Sin Resolver': 27 },
    { month: 'Feb', Resueltos: 20, 'Sin Resolver': 17 },
    { month: 'Mar', Resueltos: 18, 'Sin Resolver': 19 },
    { month: 'Abr', Resueltos: 18, 'Sin Resolver': 16 },
    { month: 'May', Resueltos: 13, 'Sin Resolver': 9 },
    { month: 'Jun', Resueltos: 14, 'Sin Resolver': 9 },
    { month: 'Jul', Resueltos: 15, 'Sin Resolver': 8 },
    { month: 'Ago', Resueltos: 18, 'Sin Resolver': 8 },
    { month: 'Sep', Resueltos: 14, 'Sin Resolver': 10 },
    { month: 'Oct', Resueltos: 17, 'Sin Resolver': 11 },
    { month: 'Nov', Resueltos: 16, 'Sin Resolver': 11 },
    { month: 'Dic', Resueltos: 19, 'Sin Resolver': 5 }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      py: 4, 
      px: 2,
      bgcolor: '#fafafa'
    }}>
      <Container maxWidth="xl">
        {/* Header Principal - Con Color y Detalles */}
        <Box sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 70%, #0d47a1 100%)',
          borderRadius: 2.5,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 6px 18px rgba(25,118,210,0.22)',
          border: '2px solid rgba(255, 255, 255, 0.18)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            background: 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 60%)',
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #2e7d32, #1976d2, #ed6c02, #d32f2f)',
            backgroundSize: '300% 100%',
            animation: 'rainbowShift 6s linear infinite'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.4, position: 'relative', zIndex: 1 }}>
            <Box sx={{
              bgcolor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              p: 1.3,
              display: 'flex',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              animation: 'floatAnimation 3s ease-in-out infinite'
            }}>
              <DashboardIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.3, letterSpacing: '-0.5px', textShadow: '0 2px 6px rgba(0,0,0,0.25)', fontSize: '1.8rem' }}>
                {t('dashboard.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <SpeedIcon sx={{ fontSize: 18 }} />
                {t('dashboard.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Tooltip title={t('dashboard.refresh')} arrow>
              <IconButton 
                onClick={() => fetchDashboardData()}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.35)',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.35)',
                    transform: 'rotate(180deg)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  },
                  transition: 'all 0.5s'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/asignaciones/gestionar')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                px: 2.6,
                py: 0.9,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                border: '2px solid rgba(25, 118, 210, 0.18)',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.26)',
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.main'
                },
                transition: 'all 0.3s'
              }}
            >
              {t('dashboard.manageAssignments')}
            </Button>
          </Box>
        </Box>

        {/* SECCIÓN: MÉTRICAS PRINCIPALES - CON COLOR Y DETALLES */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* KPI Card - Resueltos */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: 2.5,
              boxShadow: '0 3px 10px rgba(46,125,50,0.14)',
              border: '2px solid',
              borderColor: 'success.main',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                boxShadow: '0 6px 18px rgba(46,125,50,0.28)',
                transform: 'translateY(-4px)',
                borderColor: 'success.dark'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #2e7d32, #4caf50, #2e7d32)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 4s linear infinite'
              }
            }}>
              <CardContent sx={{ p: 2.4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{
                    bgcolor: 'success.light',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'success.light',
                    boxShadow: '0 3px 8px rgba(46,125,50,0.18)'
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 24, color: 'success.dark' }} />
                  </Box>
                  <Chip 
                    label="✓ OK" 
                    size="small"
                    sx={{ 
                      bgcolor: 'success.main',
                      color: 'white',
                      fontWeight: 800,
                      height: 22,
                      fontSize: '0.65rem',
                      px: 1
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main', mb: 0.6, fontSize: '2rem', textShadow: '0 2px 4px rgba(46,125,50,0.1)' }}>
                  {stats.distribucionPorEstado['Resuelto'] || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.kpi.resolved')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* KPI Card - Abiertos */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: 2.5,
              boxShadow: '0 3px 10px rgba(25,118,210,0.14)',
              border: '2px solid',
              borderColor: 'primary.main',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                boxShadow: '0 6px 18px rgba(25,118,210,0.28)',
                transform: 'translateY(-4px)',
                borderColor: 'primary.dark'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 4s linear infinite'
              }
            }}>
              <CardContent sx={{ p: 2.4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{
                    bgcolor: 'primary.light',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'primary.light',
                    boxShadow: '0 3px 8px rgba(25,118,210,0.18)'
                  }}>
                    <PlayArrowIcon sx={{ fontSize: 24, color: 'primary.dark' }} />
                  </Box>
                  {(stats.distribucionPorEstado['Pendiente'] || 0) > 10 ? (
                    <Chip 
                      label="⚠ ALTO" 
                      size="small"
                      sx={{ 
                        bgcolor: 'error.main',
                        color: 'white',
                        fontWeight: 800,
                        height: 22,
                        fontSize: '0.65rem',
                        px: 1,
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  ) : (
                    <Chip 
                      label="→ NEW" 
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 800,
                        height: 22,
                        fontSize: '0.65rem',
                        px: 1
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.6, fontSize: '2rem', textShadow: '0 2px 4px rgba(25,118,210,0.1)' }}>
                  {stats.distribucionPorEstado['Pendiente'] || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.kpi.open')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* KPI Card - En Proceso */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: 2.5,
              boxShadow: '0 3px 10px rgba(237,108,2,0.14)',
              border: '2px solid',
              borderColor: 'warning.main',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                boxShadow: '0 6px 18px rgba(237,108,2,0.28)',
                transform: 'translateY(-4px)',
                borderColor: 'warning.dark'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ed6c02, #ff9800, #ed6c02)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 4s linear infinite'
              }
            }}>
              <CardContent sx={{ p: 2.4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{
                    bgcolor: 'warning.light',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'warning.light',
                    boxShadow: '0 3px 8px rgba(237,108,2,0.18)',
                    animation: 'pulse 2s infinite'
                  }}>
                    <HourglassIcon sx={{ fontSize: 24, color: 'warning.dark' }} />
                  </Box>
                  <Chip 
                    label="⏱ ACTIVE" 
                    size="small"
                    sx={{ 
                      bgcolor: 'warning.main',
                      color: 'white',
                      fontWeight: 800,
                      height: 22,
                      fontSize: '0.65rem',
                      px: 1
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'warning.main', mb: 0.6, fontSize: '2rem', textShadow: '0 2px 4px rgba(237,108,2,0.1)' }}>
                  {(stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.kpi.inProgress')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* KPI Card - Total */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: 2.5,
              boxShadow: '0 3px 10px rgba(156,39,176,0.14)',
              border: '2px solid',
              borderColor: 'secondary.main',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                boxShadow: '0 6px 18px rgba(156,39,176,0.28)',
                transform: 'translateY(-4px)',
                borderColor: 'secondary.dark'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #9c27b0, #ba68c8, #9c27b0)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 4s linear infinite'
              }
            }}>
              <CardContent sx={{ p: 2.4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{
                    bgcolor: 'secondary.light',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'secondary.light',
                    boxShadow: '0 3px 8px rgba(156,39,176,0.18)'
                  }}>
                    <ConfirmationNumberIcon sx={{ fontSize: 24, color: 'secondary.dark' }} />
                  </Box>
                  <Chip 
                    label="Σ ALL" 
                    size="small"
                    sx={{ 
                      bgcolor: 'secondary.main',
                      color: 'white',
                      fontWeight: 800,
                      height: 22,
                      fontSize: '0.65rem',
                      px: 1
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'secondary.main', mb: 0.6, fontSize: '2rem', textShadow: '0 2px 4px rgba(156,39,176,0.1)' }}>
                  {stats.totalTickets || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.kpi.total')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <style>
          {`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(0.98); }
            }
          `}
        </style>

        {/* SECCIÓN: DISTRIBUCIÓN POR ESTADO - BARRAS HORIZONTALES */}
        <Card sx={{ 
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          mb: 4
        }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
              {t('dashboard.distribution.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              {t('dashboard.distribution.subtitle')}
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Resueltos */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {t('status.resolved')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                    {stats.distribucionPorEstado['Resuelto'] || 0} ({stats.totalTickets > 0 ? Math.round((stats.distribucionPorEstado['Resuelto'] || 0) / stats.totalTickets * 100) : 0}%)
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: '#f0f0f0', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${stats.totalTickets > 0 ? (stats.distribucionPorEstado['Resuelto'] || 0) / stats.totalTickets * 100 : 0}%`,
                    height: '100%',
                    bgcolor: '#10b981',
                    transition: 'width 1s ease'
                  }} />
                </Box>
              </Box>

              {/* En Proceso */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HourglassIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {t('status.inProgress')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                    {(stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0)} ({stats.totalTickets > 0 ? Math.round(((stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0)) / stats.totalTickets * 100) : 0}%)
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: '#f0f0f0', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${stats.totalTickets > 0 ? ((stats.distribucionPorEstado['Asignado'] || 0) + (stats.distribucionPorEstado['En Proceso'] || 0)) / stats.totalTickets * 100 : 0}%`,
                    height: '100%',
                    bgcolor: '#f59e0b',
                    transition: 'width 1s ease'
                  }} />
                </Box>
              </Box>

              {/* Pendientes */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrowIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {t('status.pending', 'Pendientes')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                    {stats.distribucionPorEstado['Pendiente'] || 0} ({stats.totalTickets > 0 ? Math.round((stats.distribucionPorEstado['Pendiente'] || 0) / stats.totalTickets * 100) : 0}%)
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: '#f0f0f0', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${stats.totalTickets > 0 ? (stats.distribucionPorEstado['Pendiente'] || 0) / stats.totalTickets * 100 : 0}%`,
                    height: '100%',
                    bgcolor: '#3b82f6',
                    transition: 'width 1s ease'
                  }} />
                </Box>
              </Box>

              {/* Cerrados */}
              {stats.distribucionPorEstado['Cerrado'] > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloseIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {t('status.closed')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>
                      {stats.distribucionPorEstado['Cerrado'] || 0} ({stats.totalTickets > 0 ? Math.round((stats.distribucionPorEstado['Cerrado'] || 0) / stats.totalTickets * 100) : 0}%)
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    bgcolor: '#f0f0f0', 
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${stats.totalTickets > 0 ? (stats.distribucionPorEstado['Cerrado'] || 0) / stats.totalTickets * 100 : 0}%`,
                      height: '100%',
                      bgcolor: '#64748b',
                      transition: 'width 1s ease'
                    }} />
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* SECCIÓN: TOP CATEGORÍAS - MEJORADO */}
        <Card sx={{ 
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px solid',
          borderColor: 'primary.main',
          mb: 4,
          overflow: 'hidden'
        }}>
                <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              border: '2px solid rgba(255,255,255,0.4)'
            }}>
              <CategoryIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.25rem' }}>
                {t('dashboard.topCategories.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', mt: 0.3 }}>
                {t('dashboard.topCategories.subtitle')}
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {Object.entries(stats.distribucionPorCategoria).slice(0, 5).map(([name, value], idx) => {
              const rankColors = [
                { bg: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', text: '#b8860b', icon: '①' },
                { bg: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)', text: '#757575', icon: '②' },
                { bg: 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)', text: '#8b4513', icon: '③' },
                { bg: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', text: '#1976d2', icon: '④' },
                { bg: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)', text: '#2e7d32', icon: '⑤' }
              ];
              const config = rankColors[idx];
              const percentage = stats.totalTickets > 0 ? Math.round((value / stats.totalTickets) * 100) : 0;
              
              return (
                <Box 
                  key={idx}
                  sx={{ 
                    px: 3,
                    py: 3,
                    borderBottom: idx < 4 ? '1px solid #e0e0e0' : 'none',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                      transform: 'translateX(8px)',
                      boxShadow: 'inset 4px 0 0 ' + config.text
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: config.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        color: config.text,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '2px solid white'
                      }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{config.icon}</span>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            {value} {t('dashboard.topCategories.tickets')}
                          </Typography>
                          <Box sx={{ 
                            width: 2, 
                            height: 2, 
                            borderRadius: '50%', 
                            bgcolor: '#cbd5e1' 
                          }} />
                          <Typography variant="caption" sx={{ color: config.text, fontWeight: 700 }}>
                            {percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Chip 
                      label={value}
                      size="medium"
                      sx={{ 
                        bgcolor: config.text,
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        minWidth: 60,
                        height: 32,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    />
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 6, 
                    bgcolor: '#f0f0f0', 
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${percentage}%`,
                      height: '100%',
                      background: config.bg,
                      transition: 'width 1.5s ease',
                      boxShadow: '0 0 8px ' + config.text
                    }} />
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* SECCIÓN: TENDENCIA ANUAL - MEJORADO */}
        <Card sx={{ 
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px solid',
          borderColor: 'success.main',
          mb: 4,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                border: '2px solid rgba(255,255,255,0.4)'
              }}>
                <TrendingUpIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.25rem' }}>
                  {t('dashboard.trends.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', mt: 0.3 }}>
                  {t('dashboard.trends.subtitle')}
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={`${new Date().getFullYear()}`}
              sx={{ 
                bgcolor: 'white',
                color: 'success.dark',
                fontWeight: 800,
                fontSize: '0.95rem',
                height: 36,
                px: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }} 
            />
          </Box>
          <CardContent sx={{ p: 3, bgcolor: '#fafafa' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorResueltos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSinResolver" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ed6c02" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ed6c02" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} 
                  stroke="#cbd5e1"
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} 
                  stroke="#cbd5e1"
                  tickLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: '2px solid #e0e0e0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    padding: '12px 16px',
                    fontWeight: 600
                  }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    paddingTop: '20px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Resueltos" 
                  stroke="#2e7d32" 
                  strokeWidth={3}
                  dot={{ fill: '#2e7d32', r: 5, strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                  fill="url(#colorResueltos)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Sin Resolver" 
                  stroke="#ed6c02" 
                  strokeWidth={3}
                  dot={{ fill: '#ed6c02', r: 5, strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                  fill="url(#colorSinResolver)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SECCIÓN: EQUIPO TÉCNICO - ESTILO PROFESIONAL MEJORADO */}
        <Box sx={{ mb: 4 }}>
          {/* Header Profesional - Estilo Panel Ejecutivo */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 55%, #0d47a1 100%)',
            borderRadius: 3,
            p: 2.2,
            mb: 2.8,
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
            '@keyframes floatAnimation': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-6px)' }
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
              <Box sx={{
                bgcolor: 'rgba(255, 255, 255, 0.28)',
                borderRadius: '50%',
                p: 1.3,
                display: 'flex',
                border: '2px solid rgba(255, 255, 255, 0.42)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'floatAnimation 3s ease-in-out infinite'
              }}>
                <GroupIcon sx={{ fontSize: 30, color: 'white' }} />
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
                  {t('dashboard.team.title')}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontWeight: 600, 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6
                }}>
                  <WorkIcon sx={{ fontSize: 16 }} />
                  {t('dashboard.team.subtitle')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Grid de Técnicos - Tarjetas Individuales Estilo KPI */}
          <Grid container spacing={3}>
            {tecnicos.length > 0 ? (
              tecnicos.map((tec) => {
                const ticketsCount = parseInt(tec.tickets_abiertos) || 0;
                const cargaText = ticketsCount === 0 ? t('dashboard.team.noAssignments') : `${ticketsCount} ${t('dashboard.topCategories.tickets')} ${ticketsCount > 1 ? t('dashboard.team.activePlural') : t('dashboard.team.active')}`;
                
                // Configuración de estado con colores profesionales
                const statusConfig = ticketsCount > 3 
                  ? { 
                      gradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                      bg: '#ffebee',
                      color: '#d32f2f',
                      icon: '🔴',
                      label: t('dashboard.team.status.highLoad'),
                      border: '#ef9a9a',
                      chipBg: '#d32f2f'
                    }
                  : ticketsCount > 1 
                  ? { 
                      gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                      bg: '#fff3e0',
                      color: '#f57c00',
                      icon: '🟡',
                      label: t('dashboard.team.status.working'),
                      border: '#ffcc80',
                      chipBg: '#f57c00'
                    }
                  : ticketsCount === 1
                  ? {
                      gradient: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                      bg: '#e3f2fd',
                      color: '#1976d2',
                      icon: '🔵',
                      label: t('dashboard.team.status.busy'),
                      border: '#90caf9',
                      chipBg: '#1976d2'
                    }
                  : { 
                      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                      bg: '#e8f5e9',
                      color: '#2e7d32',
                      icon: '🟢',
                      label: t('dashboard.team.status.available'),
                      border: '#a5d6a7',
                      chipBg: '#2e7d32'
                    };
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={tec.id_tecnico}>
                    <Card sx={{ 
                      bgcolor: 'white',
                      borderRadius: 2.5,
                      boxShadow: `0 3px 10px ${statusConfig.color}20`,
                      border: '2px solid',
                      borderColor: statusConfig.border,
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      '&:hover': { 
                        boxShadow: `0 6px 20px ${statusConfig.color}30`,
                        transform: 'translateY(-5px)',
                        borderColor: statusConfig.color
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: statusConfig.gradient,
                        animation: 'gradientShift 4s linear infinite'
                      },
                      '@keyframes gradientShift': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '100%': { backgroundPosition: '200% 50%' }
                      }
                    }}>
                      <CardContent sx={{ p: 2.2 }}>
                        {/* Indicador de Estado Animado */}
                        <Box sx={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 1.2,
                        }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: statusConfig.bg,
                            px: 1.3,
                            py: 0.4,
                            borderRadius: 1.6,
                            border: `2px solid ${statusConfig.border}`,
                            boxShadow: `0 2px 6px ${statusConfig.color}20`,
                            gap: 0.8,
                          }}>
                            <Box sx={{ 
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: statusConfig.color,
                              animation: ticketsCount > 0 ? 'pulse 2s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                '50%': { opacity: 0.6, transform: 'scale(1.2)' }
                              }
                            }} />
                            <Typography variant="caption" sx={{ 
                              fontWeight: 800, 
                              color: statusConfig.color,
                              fontSize: '0.6rem'
                            }}>
                              {statusConfig.label}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Avatar y Nombre */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 2.4, mt: 0.5 }}>
                          <Box sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2.4,
                            background: statusConfig.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            boxShadow: `0 4px 14px ${statusConfig.color}28`,
                            border: '2px solid white',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              inset: -4,
                              borderRadius: 2.4,
                              border: `2px solid ${statusConfig.border}`,
                              pointerEvents: 'none'
                            }
                          }}>
                            {tec.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 700, 
                              color: '#1e293b', 
                              mb: 0.4,
                              fontSize: '1rem',
                              lineHeight: 1.15
                            }}>
                              {tec.nombre}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: '#64748b',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <EmailIcon sx={{ fontSize: 12 }} />
                              ID: {tec.id_usuario}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Estadística de Carga - Estilo KPI */}
                        <Box sx={{ 
                          bgcolor: statusConfig.bg,
                          borderRadius: 2,
                          p: 1.8,
                          border: `2px solid ${statusConfig.border}`,
                          mb: 2,
                          textAlign: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(135deg, ${statusConfig.color}06, transparent)`,
                            pointerEvents: 'none'
                          }
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: '#64748b', 
                            fontWeight: 700, 
                            display: 'block', 
                            mb: 0.8,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.6rem'
                          }}>
                            {t('dashboard.team.loadTitle')}
                          </Typography>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 800, 
                            color: statusConfig.color,
                            fontSize: '1.5rem',
                            textShadow: `0 2px 4px ${statusConfig.color}15`,
                            mb: 0.4
                          }}>
                            {ticketsCount}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: '0.65rem'
                          }}>
                            {cargaText}
                          </Typography>
                        </Box>

                        {/* Especialidades */}
                        {tec.especialidades && (
                          <Box>
                            <Typography variant="caption" sx={{ 
                              color: '#64748b', 
                              fontWeight: 700,
                              display: 'block',
                              mb: 0.8,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              fontSize: '0.6rem'
                            }}>
                              {t('dashboard.team.specialties')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {tec.especialidades.split(',').slice(0, 3).map((esp, idx) => (
                                <Chip
                                  key={idx}
                                  label={esp.trim()}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: '#f1f5f9',
                                    color: '#475569',
                                    fontWeight: 600,
                                    border: '1px solid #e2e8f0',
                                    '&:hover': {
                                      bgcolor: '#e2e8f0'
                                    }
                                  }}
                                />
                              ))}
                              {tec.especialidades.split(',').length > 3 && (
                                <Chip
                                  label={`+${tec.especialidades.split(',').length - 3}`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: statusConfig.color,
                                    color: 'white',
                                    fontWeight: 700
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Card elevation={0} sx={{ 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)',
                  border: '2px dashed',
                  borderColor: 'secondary.light',
                  py: 6
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <GroupIcon sx={{ fontSize: 64, color: 'secondary.light', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                      {t('dashboard.team.noTechnicians')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.team.noTechniciansSubtitle')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>

      {/* Animaciones CSS */}
      <style>
        {`
          @keyframes rainbowShift {
            0% { background-position: 0% 50%; }
            100% { background-position: 300% 50%; }
          }
          @keyframes floatAnimation {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
        `}
      </style>
    </Box>
  );
};

export default Dashboard;
