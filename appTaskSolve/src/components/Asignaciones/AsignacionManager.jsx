import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, 
  CircularProgress, Alert, Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, TextField, Accordion, AccordionSummary, AccordionDetails,
  IconButton, Stack, ToggleButtonGroup, ToggleButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TableSortLabel, TablePagination, LinearProgress, Skeleton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getApiOrigin } from '../../utils/apiBase';

export default function AsignacionManager() {
  const [ticketsPendientes, setTicketsPendientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [vista, setVista] = useState('simple');
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas');
  const [ticketsOrderBy, setTicketsOrderBy] = useState('id_ticket');
  const [ticketsOrder, setTicketsOrder] = useState('desc');
  const [ticketsPage, setTicketsPage] = useState(0);
  const [ticketsRowsPerPage, setTicketsRowsPerPage] = useState(8);
  const [tecnicosOrderBy, setTecnicosOrderBy] = useState('nombre');
  const [tecnicosOrder, setTecnicosOrder] = useState('asc');
  const [tecnicosPage, setTecnicosPage] = useState(0);
  const [tecnicosRowsPerPage, setTecnicosRowsPerPage] = useState(8);
  
  // Estados para asignación manual
  const [openManual, setOpenManual] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [justificacion, setJustificacion] = useState('');
  
  // Estado para resultados de autotriage
  const [resultadosAutotriage, setResultadosAutotriage] = useState(null);

  const apiBase = getApiOrigin();

  useEffect(() => {
    // Restaurar preferencias
    try {
      const saved = JSON.parse(localStorage.getItem('asignacionPrefs') || '{}');
      if (saved.vista) setVista(saved.vista);
      if (typeof saved.busqueda === 'string') setBusqueda(saved.busqueda);
      if (saved.filtroPrioridad) setFiltroPrioridad(saved.filtroPrioridad);
    } catch {}
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('asignacionPrefs', JSON.stringify({ vista, busqueda, filtroPrioridad }));
  }, [vista, busqueda, filtroPrioridad]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketsRes, tecnicosRes] = await Promise.all([
        axios.get(`${apiBase}/apiticket/asignacion/pendientes`),
        axios.get(`${apiBase}/apiticket/asignacion/tecnicos`)
      ]);

      setTicketsPendientes(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      setTecnicos(Array.isArray(tecnicosRes.data) ? tecnicosRes.data : []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAsignar = async () => {
    if (!window.confirm('¿Ejecutar asignación automática para todos los tickets pendientes?')) {
      return;
    }

    try {
      setProcessing(true);
      const res = await axios.post(`${apiBase}/apiticket/asignacion/automatico`);
      
      if (res.data.success) {
        setResultadosAutotriage(res.data);
        setSnackbar({
          open: true,
          message: `Asignación automática completada: ${res.data.total_exitosos}/${res.data.total_procesados} exitosas`,
          severity: 'success'
        });
        fetchData(); // Recargar datos
      } else {
        setSnackbar({
          open: true,
          message: res.data.message || 'Error en asignación automática',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error en autotriage:', err);
      setSnackbar({
        open: true,
        message: 'Error al ejecutar asignación automática',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenManual = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedTecnico('');
    setJustificacion('');
    setOpenManual(true);
  };

  const handleAsignarManual = async () => {
    if (!selectedTecnico) {
      setSnackbar({ open: true, message: 'Selecciona un técnico', severity: 'warning' });
      return;
    }

    if (!justificacion.trim()) {
      setSnackbar({ open: true, message: 'La justificación es obligatoria', severity: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      const res = await axios.post(`${apiBase}/apiticket/asignacion/manual`, {
        id_ticket: selectedTicket.id_ticket,
        id_tecnico: parseInt(selectedTecnico),
        justificacion: justificacion.trim()
      });

      if (res.data.success) {
        setSnackbar({
          open: true,
          message: 'Tiquete asignado manualmente con éxito',
          severity: 'success'
        });
        setOpenManual(false);
        fetchData();
      } else {
        setSnackbar({
          open: true,
          message: res.data.message || 'Error al asignar tiquete',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error en asignación manual:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error al asignar tiquete',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPrioridadColor = (prioridad) => {
    if (prioridad === 'Alta') return 'error';
    if (prioridad === 'Media') return 'warning';
    return 'success';
  };

  const getTecnicosConEspecialidad = (idCategoria) => {
    console.log('=== DEBUG ASIGNACIÓN TÉCNICOS ===');
    console.log('ID Categoría buscada:', idCategoria);
    console.log('Total técnicos disponibles:', tecnicos.length);
    
    const filtered = tecnicos.filter(tec => {
      const tieneEspecialidad = tec.especialidades?.some(esp => {
        const match = parseInt(esp.id_categoria) === parseInt(idCategoria) ||
                      parseInt(esp.id_categoria_ticket) === parseInt(idCategoria);
        return match;
      });
      if (tec.especialidades?.length > 0) {
        console.log(`Técnico ${tec.nombre}: ${tec.especialidades.length} especialidades, match: ${tieneEspecialidad}`);
      }
      return tieneEspecialidad;
    });
    
    console.log('Técnicos con especialidad requerida:', filtered.length);
    
    // Fallback: si no hay técnicos con la especialidad, mostrar todos los disponibles
    if (filtered.length === 0) {
      console.warn('⚠️ No hay técnicos con la especialidad. Mostrando todos los disponibles.');
      return tecnicos.filter(t => t.disponibilidad);
    }
    
    return filtered;
  };

  // Helpers de ordenamiento
  const descendingComparator = (a, b, orderBy) => {
    const av = a[orderBy];
    const bv = b[orderBy];
    if (bv < av) return -1;
    if (bv > av) return 1;
    return 0;
  };
  const getComparator = (order, orderBy) => (a, b) => {
    return order === 'desc' ? descendingComparator(a, b, orderBy) : -descendingComparator(a, b, orderBy);
  };

  const filteredTickets = useMemo(() => {
    let list = ticketsPendientes;
    if (filtroPrioridad !== 'Todas') list = list.filter(t => t.prioridad === filtroPrioridad);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(t => `${t.id_ticket} ${t.titulo} ${t.categoria_nombre} ${t.cliente_nombre}`.toLowerCase().includes(q));
    }
    const sorted = [...list].sort(getComparator(ticketsOrder, ticketsOrderBy));
    return sorted;
  }, [ticketsPendientes, filtroPrioridad, busqueda, ticketsOrder, ticketsOrderBy]);

  const paginatedTickets = useMemo(() => {
    const start = ticketsPage * ticketsRowsPerPage;
    return filteredTickets.slice(start, start + ticketsRowsPerPage);
  }, [filteredTickets, ticketsPage, ticketsRowsPerPage]);

  const filteredTecnicos = useMemo(() => {
    let list = tecnicos;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(t => `${t.nombre} ${t.correo}`.toLowerCase().includes(q));
    }
    const sorted = [...list].sort(getComparator(tecnicosOrder, tecnicosOrderBy));
    return sorted;
  }, [tecnicos, busqueda, tecnicosOrder, tecnicosOrderBy]);

  const paginatedTecnicos = useMemo(() => {
    const start = tecnicosPage * tecnicosRowsPerPage;
    return filteredTecnicos.slice(start, start + tecnicosRowsPerPage);
  }, [filteredTecnicos, tecnicosPage, tecnicosRowsPerPage]);

  const exportTicketsCSV = () => {
    const rows = filteredTickets.map(t => ({
      id: t.id_ticket,
      titulo: t.titulo,
      categoria: t.categoria_nombre,
      prioridad: t.prioridad,
      cliente: t.cliente_nombre,
      minutos: t.minutos_transcurridos ?? ''
    }));
    const header = 'ID,Titulo,Categoria,Prioridad,Cliente,Minutos';
    const esc = (s) => String(s ?? '').replaceAll('"','""');
    const csv = [header, ...rows.map(r => [r.id, `"${esc(r.titulo)}"`, `"${esc(r.categoria)}"`, r.prioridad, `"${esc(r.cliente)}"`, r.minutos].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tickets_pendientes_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header mejorado con diseño moderno */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: 2,
                p: 1.25,
                display: 'flex'
              }}>
                <AssignmentIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              Gestión de Asignaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Autotriage y asignación manual de tickets a técnicos especializados
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              size="small"
              value={vista}
              exclusive
              onChange={(e, v) => v && setVista(v)}
            >
              <ToggleButton value="simple">Vista simple</ToggleButton>
              <ToggleButton value="detallada">Vista detallada</ToggleButton>
            </ToggleButtonGroup>
            <TextField 
              size="small" 
              placeholder="Buscar tickets o técnicos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                label="Prioridad"
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
              >
                <MenuItem value="Todas">Todas</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Baja">Baja</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Actualizar">
              <span>
                <IconButton onClick={fetchData} disabled={loading || processing}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            {vista === 'simple' && (
              <Tooltip title="Exportar CSV">
                <span>
                  <IconButton onClick={exportTicketsCSV} disabled={filteredTickets.length === 0}>
                    <DownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Panel de métricas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent sx={{ py: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}>
                    <ConfirmationNumberIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {ticketsPendientes.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      Tickets Pendientes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent sx={{ py: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}>
                    <PeopleIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {tecnicos.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      Técnicos Disponibles
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={handleAutoAsignar}
              disabled={processing || ticketsPendientes.length === 0}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: 3,
                py: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 6
                },
                '&:disabled': {
                  background: 'grey.400'
                }
              }}
            >
              Ejecutar Autotriage
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Resultados de Autotriage mejorados */}
      {resultadosAutotriage && (
        <Card 
          elevation={4}
          sx={{ 
            mb: 4,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'success.main',
            background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    Resultados de Asignación Automática
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Procesados: {resultadosAutotriage.total_procesados} | 
                    Exitosos: {resultadosAutotriage.total_exitosos}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setResultadosAutotriage(null)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {resultadosAutotriage.asignaciones?.map((asig, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      bgcolor: asig.success ? 'success.50' : 'error.50',
                      borderColor: asig.success ? 'success.main' : 'error.main',
                      borderWidth: 2
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {asig.success ? 
                          <CheckCircleIcon sx={{ color: 'success.main' }} /> : 
                          <ErrorIcon sx={{ color: 'error.main' }} />
                        }
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Ticket #{asig.id_ticket}
                        </Typography>
                      </Box>
                      {asig.tecnico && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <PersonIcon fontSize="small" />
                          <strong>Asignado a:</strong> {asig.tecnico.nombre} ({asig.tecnico.carga} activos)
                        </Typography>
                      )}
                      {asig.calculos && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            📊 Puntaje: <strong>{asig.calculos.puntaje}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            ⚠️ Prioridad: <strong>{asig.calculos.prioridad_texto}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            ⏱️ SLA restante: <strong>{asig.calculos.tiempo_restante_horas}h</strong>
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tickets Pendientes */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 Tiquetes Pendientes de Asignación
          {ticketsPendientes.length > 0 && (
            <Chip 
              label={`${ticketsPendientes.length} pendiente${ticketsPendientes.length > 1 ? 's' : ''}`}
              color="warning"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Typography>

        {loading ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
            </CardContent>
          </Card>
        ) : ticketsPendientes.length === 0 ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                ✅ No hay tickets pendientes de asignación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Todos los tickets han sido asignados correctamente
              </Typography>
            </CardContent>
          </Card>
        ) : vista === 'simple' ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={ticketsOrderBy === 'id_ticket' ? ticketsOrder : false}>
                    <TableSortLabel active={ticketsOrderBy === 'id_ticket'} direction={ticketsOrder} onClick={() => setTicketsOrderBy('id_ticket') || setTicketsOrder(ticketsOrder === 'asc' ? 'desc' : 'asc')}>
                      #
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={ticketsOrderBy === 'titulo' ? ticketsOrder : false}>
                    <TableSortLabel active={ticketsOrderBy === 'titulo'} direction={ticketsOrder} onClick={() => setTicketsOrderBy('titulo') || setTicketsOrder(ticketsOrder === 'asc' ? 'desc' : 'asc')}>
                      Título
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right" sortDirection={ticketsOrderBy === 'minutos_transcurridos' ? ticketsOrder : false}>
                    <TableSortLabel active={ticketsOrderBy === 'minutos_transcurridos'} direction={ticketsOrder} onClick={() => setTicketsOrderBy('minutos_transcurridos') || setTicketsOrder(ticketsOrder === 'asc' ? 'desc' : 'asc')}>
                      Min
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTickets.map((t) => (
                  <TableRow key={t.id_ticket} hover>
                    <TableCell>#{t.id_ticket}</TableCell>
                    <TableCell sx={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</TableCell>
                    <TableCell>{t.categoria_nombre}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.prioridad} color={t.prioridad === 'Alta' ? 'error' : t.prioridad === 'Media' ? 'warning' : 'success'} />
                    </TableCell>
                    <TableCell>{t.cliente_nombre}</TableCell>
                    <TableCell align="right">{t.minutos_transcurridos ?? '-'}</TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" onClick={() => handleOpenManual(t)}>Asignar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              rowsPerPageOptions={[8, 15, 25]}
              count={filteredTickets.length}
              rowsPerPage={ticketsRowsPerPage}
              page={ticketsPage}
              onPageChange={(e, p) => setTicketsPage(p)}
              onRowsPerPageChange={(e) => { setTicketsRowsPerPage(parseInt(e.target.value, 10)); setTicketsPage(0); }}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </TableContainer>
        ) : (
          <Grid container spacing={3}>
            {ticketsPendientes.map((ticket) => {
              const prioridadConfig = {
                'Alta': { color: 'error', icon: '🔴', gradient: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)' },
                'Media': { color: 'warning', icon: '🟡', gradient: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)' },
                'Baja': { color: 'success', icon: '🟢', gradient: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' }
              };
              const prioConfig = prioridadConfig[ticket.prioridad] || prioridadConfig['Media'];

              return (
                <Grid item xs={12} md={6} lg={4} key={ticket.id_ticket}>
                  <Card 
                    elevation={3}
                    sx={{
                      borderRadius: 3,
                      height: '100%',
                      transition: 'all 0.3s',
                      border: '2px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: 6,
                        borderColor: prioConfig.color + '.main'
                      }
                    }}
                  >
                    <Box sx={{ 
                      background: prioConfig.gradient,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Chip 
                        icon={<AssignmentIcon />}
                        label={`#${ticket.id_ticket}`}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.9)',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}
                      />
                      <Chip 
                        label={`${prioConfig.icon} ${ticket.prioridad}`}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.9)',
                          color: prioConfig.color + '.dark',
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, minHeight: 48 }}>
                        {ticket.titulo}
                      </Typography>

                      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon fontSize="small" sx={{ color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {ticket.categoria_nombre}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {ticket.cliente_nombre}
                          </Typography>
                        </Box>
                        {ticket.minutos_transcurridos && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ color: 'warning.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              Creado hace {ticket.minutos_transcurridos} min
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleOpenManual(ticket)}
                        disabled={processing}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 2,
                          boxShadow: 2,
                          '&:hover': {
                            boxShadow: 4
                          }
                        }}
                      >
                        Asignar Manualmente
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Técnicos Disponibles */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          👥 Equipo Técnico Disponible
          <Chip 
            label={`${tecnicos.filter(t => t.disponibilidad).length} disponibles`}
            color="success"
            sx={{ fontWeight: 700 }}
          />
        </Typography>
        {loading ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={32} sx={{ mb: 1 }} />
            </CardContent>
          </Card>
        ) : vista === 'simple' ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={tecnicosOrderBy === 'nombre' ? tecnicosOrder : false}>
                    <TableSortLabel active={tecnicosOrderBy === 'nombre'} direction={tecnicosOrder} onClick={() => setTecnicosOrderBy('nombre') || setTecnicosOrder(tecnicosOrder === 'asc' ? 'desc' : 'asc')}>
                      Técnico
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Especialidades</TableCell>
                  <TableCell align="right" sortDirection={tecnicosOrderBy === 'tickets_activos' ? tecnicosOrder : false}>
                    <TableSortLabel active={tecnicosOrderBy === 'tickets_activos'} direction={tecnicosOrder} onClick={() => setTecnicosOrderBy('tickets_activos') || setTecnicosOrder(tecnicosOrder === 'asc' ? 'desc' : 'asc')}>
                      Activos
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Disponibilidad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTecnicos.map((t) => (
                  <TableRow key={t.id_tecnico} hover>
                    <TableCell>{t.nombre}</TableCell>
                    <TableCell>{t.especialidades?.length || 0}</TableCell>
                    <TableCell align="right">{t.tickets_activos}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={t.disponibilidad ? 'Disponible' : 'Ocupado'} color={t.disponibilidad ? 'success' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              rowsPerPageOptions={[8, 15, 25]}
              count={filteredTecnicos.length}
              rowsPerPage={tecnicosRowsPerPage}
              page={tecnicosPage}
              onPageChange={(e, p) => setTecnicosPage(p)}
              onRowsPerPageChange={(e) => { setTecnicosRowsPerPage(parseInt(e.target.value, 10)); setTecnicosPage(0); }}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </TableContainer>
        ) : (
        <Grid container spacing={3}>
          {tecnicos.map((tec) => {
            const cargaColor = tec.tickets_activos > 3 ? 'error' : tec.tickets_activos > 1 ? 'warning' : 'success';
            const cargaGradient = {
              'error': 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
              'warning': 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
              'success': 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)'
            };

            return (
              <Grid item xs={12} md={6} lg={4} key={tec.id_tecnico}>
                <Card 
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s',
                    border: '2px solid',
                    borderColor: tec.disponibilidad ? 'success.light' : 'grey.300',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: 6,
                      borderColor: tec.disponibilidad ? 'success.main' : 'grey.400'
                    }
                  }}
                >
                  <Box sx={{ 
                    background: cargaGradient[cargaColor],
                    p: 2.5,
                    color: 'white'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          p: 1,
                          display: 'flex'
                        }}>
                          <PersonIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {tec.nombre}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            ID: {tec.id_tecnico}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={tec.disponibilidad ? '✓ Disponible' : '✗ Ocupado'}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.9)',
                          color: tec.disponibilidad ? 'success.dark' : 'error.dark',
                          fontWeight: 700
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Carga de trabajo: {tec.tickets_activos} tiquete{tec.tickets_activos !== 1 ? 's' : ''} activo{tec.tickets_activos !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      📧 {tec.correo}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                      Especialidades ({tec.especialidades?.length || 0}):
                    </Typography>
                    
                    {tec.especialidades && tec.especialidades.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {tec.especialidades.map((esp) => (
                          <Chip
                            key={esp.id_especialidad}
                            icon={<CategoryIcon />}
                            label={esp.nombre}
                            size="small"
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'primary.dark',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'white'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Sin especialidades asignadas
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        )}
      </Box>

      {/* Diálogo de Asignación Manual */}
      <Dialog open={openManual} onClose={() => setOpenManual(false)} maxWidth="md" fullWidth>
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <PersonAddIcon sx={{ fontSize: 28 }} />
          Asignación Manual de Ticket
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedTicket && (
            <>
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 3, 
                  p: 2.5, 
                  border: '2px solid',
                  borderColor: 'primary.light',
                  borderRadius: 2,
                  bgcolor: 'primary.50',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box 
                    sx={{ 
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      borderRadius: 2, 
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <ConfirmationNumberIcon sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                      Ticket #{selectedTicket.id_ticket}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: 'text.primary', fontWeight: 500 }}>
                      {selectedTicket.titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                        label={selectedTicket.categoria_nombre}
                        size="medium"
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                      <Chip 
                        icon={selectedTicket.prioridad === 'Alta' ? <PriorityHighIcon sx={{ fontSize: 16 }} /> : 
                              selectedTicket.prioridad === 'Media' ? <WarningAmberIcon sx={{ fontSize: 16 }} /> : 
                              <CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label={selectedTicket.prioridad}
                        size="medium"
                        sx={{ 
                          bgcolor: selectedTicket.prioridad === 'Alta' ? '#dc2626' :
                                   selectedTicket.prioridad === 'Media' ? '#f59e0b' : '#10b981',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                      <Chip 
                        icon={<InfoIcon sx={{ fontSize: 16 }} />}
                        label={selectedTicket.estado_nombre}
                        size="medium"
                        sx={{ 
                          bgcolor: '#3b82f6',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                  Seleccionar Técnico *
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={selectedTecnico}
                    onChange={(e) => setSelectedTecnico(e.target.value)}
                    displayEmpty
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 1.5 
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography variant="body2" color="text.secondary">
                        Selecciona un técnico para asignar el ticket
                      </Typography>
                    </MenuItem>
                    {(() => {
                      const tecnicosDisponibles = getTecnicosConEspecialidad(selectedTicket.id_categoria);
                      if (tecnicosDisponibles.length === 0) {
                        return (
                          <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                              No hay técnicos disponibles
                            </Typography>
                          </MenuItem>
                        );
                      }
                      return tecnicosDisponibles.map((tec) => {
                        const tieneEspecialidad = tec.especialidades?.some(esp => 
                          parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria)
                        );
                        return (
                          <MenuItem 
                            key={tec.id_tecnico} 
                            value={tec.id_tecnico}
                            sx={{
                              py: 1.5,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-child': { borderBottom: 'none' }
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {tec.nombre}
                                </Typography>
                                {!tieneEspecialidad && (
                                  <Chip 
                                    label="Sin especialidad" 
                                    size="small" 
                                    icon={<WarningAmberIcon />}
                                    sx={{ 
                                      height: 22,
                                      bgcolor: '#f59e0b',
                                      color: 'white',
                                      fontWeight: 600,
                                      '& .MuiChip-icon': { fontSize: 14, color: 'white' }
                                    }} 
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {tec.email}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{
                                    color: tec.tickets_activos > 2 ? 'warning.main' : 'success.main',
                                    fontWeight: 600
                                  }}
                                >
                                  {tec.tickets_activos} tiquete{tec.tickets_activos !== 1 ? 's' : ''} activo{tec.tickets_activos !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                              {tec.especialidades && tec.especialidades.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                  {tec.especialidades.map((esp) => (
                                    <Chip
                                      key={esp.id_especialidad}
                                      label={esp.nombre}
                                      size="small"
                                      icon={parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria) 
                                        ? <CheckCircleIcon sx={{ fontSize: 12 }} /> 
                                        : null}
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria) 
                                          ? '#10b981' 
                                          : '#e5e7eb',
                                        color: parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria)
                                          ? 'white'
                                          : '#6b7280',
                                        fontWeight: parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria) ? 600 : 500,
                                        '& .MuiChip-icon': { color: 'white' }
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      });
                    })()}
                  </Select>
                  {(() => {
                    const tecnicosConEsp = tecnicos.filter(tec => 
                      tec.especialidades?.some(esp => 
                        parseInt(esp.id_categoria) === parseInt(selectedTicket.id_categoria)
                      )
                    );
                    return tecnicosConEsp.length > 0 ? (
                      <Alert 
                        severity="success" 
                        icon={<CheckCircleIcon fontSize="small" />}
                        sx={{ 
                          mt: 1.5,
                          bgcolor: '#d1fae5',
                          color: '#065f46',
                          '& .MuiAlert-icon': { color: '#10b981' },
                          fontWeight: 600
                        }}
                      >
                        {tecnicosConEsp.length} técnico{tecnicosConEsp.length !== 1 ? 's' : ''} con la especialidad requerida
                      </Alert>
                    ) : (
                      <Alert 
                        severity="warning"
                        icon={<WarningAmberIcon fontSize="small" />}
                        sx={{ 
                          mt: 1.5,
                          bgcolor: '#fef3c7',
                          color: '#92400e',
                          '& .MuiAlert-icon': { color: '#f59e0b' },
                          fontWeight: 600
                        }}
                      >
                        No hay técnicos con esta especialidad. Mostrando todos los disponibles.
                      </Alert>
                    );
                  })()}
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                  Justificación de la Asignación *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Explica detalladamente por qué asignas este tiquete a este técnico específico (mínimo 20 caracteres)"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  required
                  error={justificacion.trim() !== '' && justificacion.trim().length < 20}
                  helperText={
                    justificacion.trim().length > 0 && justificacion.trim().length < 20
                      ? `Faltan ${20 - justificacion.trim().length} caracteres para alcanzar el mínimo`
                      : 'Proporciona una justificación clara y detallada para esta asignación manual'
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper'
                    }
                  }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenManual(false)}>Cancelar</Button>
          <Button 
            variant="contained"
            onClick={handleAsignarManual}
            disabled={processing || !selectedTecnico || !justificacion.trim()}
            startIcon={<CheckCircleIcon />}
          >
            Asignar Tiquete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Container>
  );
}
