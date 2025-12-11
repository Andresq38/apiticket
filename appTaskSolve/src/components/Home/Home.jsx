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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SuccessOverlay from '../common/SuccessOverlay';
import { getApiOrigin, getApiBaseWithPrefix } from '../../utils/apiBase';
import FraseCarrusel from '../Dashboard/FraseCarrusel';

// Datos simulados como fallback
const TICKET_DATA_HOME = [];

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const apiBaseWithPrefix = getApiBaseWithPrefix();
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
      return { level: 'vencido', color: '#d32f2f', bgColor: '#ffebee', icon: ErrorIcon };
    } else if (horas <= 2) {
      return { level: 'critico', color: '#d32f2f', bgColor: '#ffe0e0', icon: ErrorIcon };
    } else if (horas <= 4) {
      return { level: 'urgente', color: '#f57c00', bgColor: '#fff3e0', icon: WarningAmberIcon };
    } else if (horas <= 24) {
      return { level: 'proximo', color: '#ed6c02', bgColor: '#fff8e1', icon: AccessTimeIcon };
    }
    
    return { level: 'normal', color: '#2e7d32', bgColor: '#f1f8f4', icon: AccessTimeIcon, label: 'NORMAL' };
  };

  const translateEstadoLabel = (estadoNombre) => {
    if (!estadoNombre) return '';
    const n = String(estadoNombre).toLowerCase();
    if (n.includes('pend')) return t('status.pending');
    if (n.includes('asign')) return t('status.assigned');
    if (n.includes('proceso') || n.includes('en proceso')) return t('status.inProgress');
    if (n.includes('resuel') || n.includes('resuelto')) return t('status.resolved');
    if (n.includes('cerr')) return t('status.closed');
    return estadoNombre;
  };

  // Traer tickets
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Normalizar rol para determinar si es técnico o cliente
      const normalizedRole = (user?.rol || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

      let res;
      let data = [];

      // Si es técnico, obtener solo sus tickets asignados
      if (normalizedRole === 'tecnico' && user?.id) {
        res = await axios.get(`${apiBaseWithPrefix}/ticket/obtenerTicketsTecnico/${user.id}`);
        data = res.data?.tickets ?? [];
      } 
      // Si es cliente, obtener solo sus tickets
      else if (normalizedRole === 'cliente' && user?.id) {
        res = await axios.get(`${apiBase}/apiticket/ticket/getTicketByUsuario/${user.id}`);
        data = res.data ?? [];
      } 
      // Si es admin, obtener todos los tickets
      else {
        res = await axios.get(`${apiBase}/apiticket/ticket/getTicketsCompletos`);
        data = res.data ?? [];

        if (!Array.isArray(data) || data.length === 0) {
          res = await axios.get(`${apiBase}/apiticket/ticket`);
          data = res.data ?? [];
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((t) => {
          const id = t.id_ticket ?? t['Identificador del Ticket'];
          const titulo = t.titulo || t['Título'] || t['Categoría'] || '';
          const fecha = t.fecha_creacion || t['Fecha de creación'] || '';
          const estado = (t.estado && (t.estado.nombre || t.estado)) || t['Estado actual'] || '';
          const sla = (t.sla && t.sla.tiempo_restante) || t['Tiempo restante SLA'] || t['Tiempo restante SLA (máx)'] || t.sla || '';

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
  }, [user]);

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          px: { xs: 2, sm: 4 },
          py: { xs: 2.2, sm: 2.8 },
          borderRadius: 3,
          background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
          boxShadow: '0 6px 22px rgba(25,118,210,0.25)',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.14)',
          maxWidth: 1100,
          mx: 'auto',
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
          }
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.3, letterSpacing: '-0.5px', textShadow: '0 2px 6px rgba(0,0,0,0.25)', fontSize: '1.55rem' }}>{t('home.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.95rem' }}>{t('home.subtitle')}</Typography>
      </Box>
      {/* Widget Frase del día / Tip rápido en Home */}
      <Box sx={{ mb: 4 }}>
        <FraseCarrusel />
      </Box>
      {/* Toolbar: búsqueda, filtro y acciones */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
        <TextField
          size="small"
          label={t('home.searchLabel')}
          placeholder={t('home.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="estado-filter-label">{t('home.status')}</InputLabel>
          <Select
            labelId="estado-filter-label"
            value={estadoFilter}
            label={t('home.status')}
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value=""><em>{t('home.all')}</em></MenuItem>
            <MenuItem value="Asignado">{t('home.assigned')}</MenuItem>
            <MenuItem value="En Proceso">{t('home.inProgress')}</MenuItem>
            <MenuItem value="Resuelto">{t('home.resolved')}</MenuItem>
            <MenuItem value="Cerrado">{t('home.closed')}</MenuItem>
          </Select>
        </FormControl>
        <Button size="small" variant="outlined" onClick={fetchTickets} disabled={loading}>{t('home.reload')}</Button>
        <Button
          size="small"
          variant={deleteMode ? 'contained' : 'outlined'}
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() => setDeleteMode((v) => !v)}
        >
          {deleteMode ? t('home.cancelDelete') : t('home.delete')}
        </Button>
      </Box>

      <Typography variant="h5" align="center" color="text.secondary" mb={6}>
        {t('home.description')}
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
          <Table size="small" aria-label={t('home.table.aria')}>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'id_ticket' ? order : false}>
                    <TableSortLabel
                    active={orderBy === 'id_ticket'}
                    direction={orderBy === 'id_ticket' ? order : 'asc'}
                    onClick={() => handleRequestSort('id_ticket')}
                  >
                    {t('home.table.ticket')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'titulo' ? order : false} sx={{ minWidth: 260 }}>
                  <TableSortLabel
                    active={orderBy === 'titulo'}
                    direction={orderBy === 'titulo' ? order : 'asc'}
                    onClick={() => handleRequestSort('titulo')}
                  >
                    {t('home.table.title')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'estado' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'estado'}
                    direction={orderBy === 'estado' ? order : 'asc'}
                    onClick={() => handleRequestSort('estado')}
                  >
                    {t('home.table.status')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'fecha_creacion' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'fecha_creacion'}
                    direction={orderBy === 'fecha_creacion' ? order : 'asc'}
                    onClick={() => handleRequestSort('fecha_creacion')}
                  >
                    {t('home.table.created')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  {t('home.table.sla')}
                </TableCell>
                <TableCell align="right">{t('home.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((ticket) => {
                const urgency = getSlaUrgency(ticket.sla);
                return (
                  <TableRow
                    key={ticket.id_ticket}
                    hover
                    sx={{ cursor: deleteMode ? 'default' : 'pointer' }}
                    onClick={() => { if (!deleteMode) navigate(`/tickets/${ticket.id_ticket}`); }}
                  >
                    <TableCell width={90}>#{ticket.id_ticket}</TableCell>
                    <TableCell>{ticket.titulo}</TableCell>
                    <TableCell width={160}>
                      <Chip size="small" label={translateEstadoLabel(ticket.estado)} sx={{ bgcolor: getStatusColor(ticket.estado), color: '#fff', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell width={160}>{ticket.fecha_creacion || ''}</TableCell>
                    <TableCell width={220}>
                      {ticket.sla ? (
                        urgency ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: 0.5, px: 1, bgcolor: urgency.bgColor, borderRadius: 1, borderLeft: `4px solid ${urgency.color}` }}>
                            <Typography variant="caption" sx={{ color: urgency.color, fontWeight: 700 }}>{t(`sla.${urgency.level}`)}</Typography>
                            <Typography variant="caption" color="text.secondary">{ticket.sla}</Typography>
                          </Box>
                        ) : (
                          <Chip size="small" variant="outlined" label={ticket.sla} />
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {deleteMode ? (
                        <Tooltip title={t('home.deleteTicket', { id: ticket.id_ticket })}>
                          <IconButton color="error" onClick={(e) => { e.stopPropagation(); requestDelete(ticket); }}>
                            <DeleteForeverIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id_ticket}`); }}>{t('home.view')}</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">{t('home.noResults')}</Typography>
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
            labelRowsPerPage={t('home.rowsPerPage')}
          />
        </TableContainer>
      )}

      {/* Diálogo de confirmación */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('home.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          {t('home.confirmDeleteBody', { id: targetTicket?.id_ticket })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('home.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t('home.delete')}</Button>
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
        entity={t('home.ticketEntity')}
        subtitle={t('home.deleteSuccessSubtitle', { id: deletedTicketInfo?.id_ticket })}
        onClose={() => { setShowDeleteSuccess(false); setDeletedTicketInfo(null); }}
        actions={[{
          label: t('home.close'),
          onClick: () => { setShowDeleteSuccess(false); setDeletedTicketInfo(null); },
          variant: 'contained',
          color: 'error'
        }, {
          label: t('home.createTicket'),
          onClick: () => { setShowDeleteSuccess(false); navigate('/tickets/crear'); },
          variant: 'outlined',
          color: 'error'
        }]}
      />
    </Container>
  );
};

export default Home;
