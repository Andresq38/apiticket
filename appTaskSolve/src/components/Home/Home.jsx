import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  useTheme,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SuccessOverlay from '../common/SuccessOverlay';
import { getApiOrigin } from '../../utils/apiBase';

// Datos simulados como fallback
const TICKET_DATA_HOME = [];

const Home = () => {
  const [tickets, setTickets] = useState(TICKET_DATA_HOME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [orderBy, setOrderBy] = useState('fecha_creacion');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetTicket, setTargetTicket] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedTicketInfo, setDeletedTicketInfo] = useState(null);
  // Detectar automáticamente la base del API o tomarla de variables de entorno
  const apiBase = getApiOrigin();
  const theme = useTheme();
  const navigate = useNavigate(); // Hook para navegación

  // Colores según estado
  const getStatusColor = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('abierto') || e.includes('asignado')) return theme.palette.info.main;
    if (e.includes('proceso')) return theme.palette.warning.main;
    if (e.includes('resuelto')) return theme.palette.success.main;
    if (e.includes('cerrado')) return theme.palette.grey[500];
    return theme.palette.grey[700];
  };

  // Función para calcular la urgencia del SLA
  const getSlaUrgency = (slaText) => {
    if (!slaText) return null;
    
    const match = slaText.match(/(-?\d+)h/);
    if (!match) return null;
    
    const horas = parseInt(match[1]);
    
    if (horas < 0) {
      return { level: 'vencido', color: '#d32f2f', bgColor: '#ffebee', icon: ErrorIcon, label: 'VENCIDO' };
    } else if (horas <= 2) {
      return { level: 'critico', color: '#d32f2f', bgColor: '#ffe0e0', icon: ErrorIcon, label: 'CRÍTICO' };
    } else if (horas <= 4) {
      return { level: 'urgente', color: '#f57c00', bgColor: '#fff3e0', icon: WarningAmberIcon, label: 'URGENTE' };
    } else if (horas <= 24) {
      return { level: 'proximo', color: '#ed6c02', bgColor: '#fff8e1', icon: AccessTimeIcon, label: 'PRÓXIMO' };
    }
    
    return { level: 'normal', color: '#2e7d32', bgColor: '#f1f8f4', icon: AccessTimeIcon, label: 'NORMAL' };
  };

  // Traer tickets
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Intentar obtener tickets completos (incluye fecha_creacion y SLA detallado)
      let res = await axios.get(`${apiBase}/apiticket/ticket/getTicketsCompletos`);
      let data = res.data ?? [];

      if (!Array.isArray(data) || data.length === 0) {
        // 2) Fallback al listado simple
        res = await axios.get(`${apiBase}/apiticket/ticket`);
        data = res.data ?? [];
      }

      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((t) => {
          // Soportar ambos formatos: "completos" (propiedades directas y objetos anidados)
          // y "simple" (alias de columnas)
          const id = t.id_ticket ?? t['Identificador del Ticket'];
          const titulo = t.titulo || t['Título'] || t['Categoría'] || '';
          const fecha = t.fecha_creacion || t['Fecha de creación'] || '';
          const estado = (t.estado && (t.estado.nombre || t.estado)) || t['Estado actual'] || '';
          const sla = (t.sla && t.sla.tiempo_restante) || t['Tiempo restante SLA'] || t['Tiempo restante SLA (máx)'] || '';

          return {
            id_ticket: parseInt(id, 10),
            titulo,
            fecha_creacion: fecha,
            estado,
            sla
          };
        });
        const order = ['Asignado', 'En Proceso', 'Resuelto', 'Cerrado'];
        const sorted = mapped.sort((a, b) => order.indexOf(a.estado) - order.indexOf(b.estado));
        setTickets(sorted);
      }
    } catch (err) {
      console.error('Error al cargar tiquetes:', err);
      const msg = err?.response?.status
        ? `Error ${err.response.status} al cargar tiquetes`
        : (err?.message || 'Error al cargar tiquetes');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (ticket) => {
    setTargetTicket(ticket);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetTicket) return;
    const t = targetTicket;
    setConfirmOpen(false);
    setTargetTicket(null);
    try {
      await axios.delete(`${apiBase}/apiticket/ticket/delete/${t.id_ticket}`);
      // Actualizar lista
      setTickets(prev => prev.filter(x => x.id_ticket !== t.id_ticket));
      setDeletedTicketInfo(t);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error('Error eliminando tiquete:', err?.response?.status, err?.response?.data || err?.message);
      setSnackbar({ open: true, message: err?.response?.data?.error || err?.response?.data?.result || 'No se pudo eliminar', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtros + ordenamiento + búsqueda
  const filtered = useMemo(() => {
    let rows = tickets.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        String(r.id_ticket).includes(q) ||
        (r.titulo || '').toLowerCase().includes(q) ||
        (r.estado || '').toLowerCase().includes(q)
      );
    }
    if (estadoFilter) {
      rows = rows.filter(r => (r.estado || '') === estadoFilter);
    }
    rows.sort((a, b) => {
      const dir = order === 'asc' ? 1 : -1;
      const av = a[orderBy] ?? '';
      const bv = b[orderBy] ?? '';
      if (orderBy === 'fecha_creacion') {
        return (new Date(av) - new Date(bv)) * dir;
      }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }, [tickets, search, estadoFilter, orderBy, order]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Container sx={{ py: 4 }}>
      {/* Header con gradiente */}
      <Box sx={{
        mb: 4,
        borderRadius: 8,
        px: 4,
        py: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg,#0B5CC2 0%, #1569d4 40%, #1b74e5 100%)',
        color: 'common.white',
        boxShadow: '0 12px 28px -6px rgba(11,92,194,0.35)',
        '&:after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: '#F5A000',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '.5px' }}>Gestión de Tiquetes de Soporte</Typography>
        <Typography variant="body2" sx={{ mt: .5, fontWeight: 500, opacity: .9 }}>
          Administra, prioriza y resuelve los tiquetes activos del sistema
        </Typography>
      </Box>

      {/* Toolbar: búsqueda, filtro y acciones */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
        <TextField
          size="small"
          label="Buscar"
          placeholder="Tiquete, título o estado"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="estado-filter-label">Estado</InputLabel>
          <Select
            labelId="estado-filter-label"
            value={estadoFilter}
            label="Estado"
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value=""><em>Todos</em></MenuItem>
            <MenuItem value="Asignado">Asignado</MenuItem>
            <MenuItem value="En Proceso">En Proceso</MenuItem>
            <MenuItem value="Resuelto">Resuelto</MenuItem>
            <MenuItem value="Cerrado">Cerrado</MenuItem>
          </Select>
        </FormControl>
        <Button size="small" variant="outlined" onClick={fetchTickets} disabled={loading}>Recargar</Button>
        <Button
          size="small"
          variant={deleteMode ? 'contained' : 'outlined'}
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() => setDeleteMode((v) => !v)}
        >
          {deleteMode ? 'Cancelar eliminación' : 'Eliminar'}
        </Button>
      </Box>

      <Typography variant="h5" align="center" color="text.secondary" mb={6}>
        Consulta el estado de los tiquetes de soporte activos y recientes.
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {!!error && !loading && (
        <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>{error}</Alert>
      )}

      {!loading && !error && (
        <TableContainer sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Table size="small" aria-label="Tabla de tickets">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'id_ticket' ? order : false}>
                    <TableSortLabel
                    active={orderBy === 'id_ticket'}
                    direction={orderBy === 'id_ticket' ? order : 'asc'}
                    onClick={() => handleRequestSort('id_ticket')}
                  >
                    Tiquete
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'titulo' ? order : false} sx={{ minWidth: 260 }}>
                  <TableSortLabel
                    active={orderBy === 'titulo'}
                    direction={orderBy === 'titulo' ? order : 'asc'}
                    onClick={() => handleRequestSort('titulo')}
                  >
                    Título
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'estado' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'estado'}
                    direction={orderBy === 'estado' ? order : 'asc'}
                    onClick={() => handleRequestSort('estado')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'fecha_creacion' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'fecha_creacion'}
                    direction={orderBy === 'fecha_creacion' ? order : 'asc'}
                    onClick={() => handleRequestSort('fecha_creacion')}
                  >
                    Creado
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  SLA
                </TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((t) => {
                const urgency = getSlaUrgency(t.sla);
                return (
                  <TableRow
                    key={t.id_ticket}
                    hover
                    sx={{ cursor: deleteMode ? 'default' : 'pointer' }}
                    onClick={() => { if (!deleteMode) navigate(`/tickets/${t.id_ticket}`); }}
                  >
                    <TableCell width={90}>#{t.id_ticket}</TableCell>
                    <TableCell>{t.titulo}</TableCell>
                    <TableCell width={160}>
                      <Chip size="small" label={t.estado} sx={{ bgcolor: getStatusColor(t.estado), color: '#fff', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell width={160}>{t.fecha_creacion || ''}</TableCell>
                    <TableCell width={220}>
                      {t.sla ? (
                        urgency ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: 0.5, px: 1, bgcolor: urgency.bgColor, borderRadius: 1, borderLeft: `4px solid ${urgency.color}` }}>
                            <Typography variant="caption" sx={{ color: urgency.color, fontWeight: 700 }}>{urgency.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{t.sla}</Typography>
                          </Box>
                        ) : (
                          <Chip size="small" variant="outlined" label={t.sla} />
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {deleteMode ? (
                        <Tooltip title={`Eliminar #${t.id_ticket}`}>
                          <IconButton color="error" onClick={(e) => { e.stopPropagation(); requestDelete(t); }}>
                            <DeleteForeverIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${t.id_ticket}`); }}>Ver</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">Sin resultados</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página"
          />
        </TableContainer>
      )}

      {/* Diálogo de confirmación */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Seguro que deseas eliminar el tiquete #{targetTicket?.id_ticket}? Esta acción es permanente.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar con opción de deshacer cuando hay eliminación pendiente */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
      />

      <SuccessOverlay
        open={showDeleteSuccess}
        mode="delete"
        entity="Tiquete"
        subtitle={`El tiquete #${deletedTicketInfo?.id_ticket} ha sido eliminado correctamente.`}
        onClose={() => { setShowDeleteSuccess(false); setDeletedTicketInfo(null); }}
        actions={[{
          label: 'Cerrar',
          onClick: () => { setShowDeleteSuccess(false); setDeletedTicketInfo(null); },
          variant: 'contained',
          color: 'error'
        }, {
          label: 'Crear Tiquete',
          onClick: () => { setShowDeleteSuccess(false); navigate('/tickets/crear'); },
          variant: 'outlined',
          color: 'error'
        }]}
      />
    </Container>
  );
};

export default Home;
