import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Search as SearchIcon, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getApiBaseWithPrefix } from '../utils/apiBase';

export default function IncidentesPendientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Validar que sea técnico
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const normalizedRole = (user?.rol || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    
    if (normalizedRole !== 'tecnico') {
      navigate('/');
    }
  }, [user, navigate]);

  // Cargar tickets pendientes (sin técnico asignado)
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBaseWithPrefix();
        console.log('📡 Cargando tickets pendientes');
        const res = await axios.get(`${apiBase}/ticket/obtenerTicketsPendientes`);
        console.log('📡 Respuesta del servidor:', res.data);
        const allTickets = res.data?.tickets ?? [];
        console.log('📡 Total tickets recibidos:', allTickets.length);
        
        // El backend ya devuelve solo tickets con estado Pendiente
        setTickets(allTickets);
      } catch (error) {
        console.warn('❌ Error cargando incidentes:', error?.message);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadTickets();
    }
  }, [user?.id]);

  // Filtrar por búsqueda
  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    
    const q = search.toLowerCase();
    return tickets.filter(t =>
      String(t.id_ticket).includes(q) ||
      (t.titulo || '').toLowerCase().includes(q) ||
      (t.estado || '').toLowerCase().includes(q)
    );
  }, [tickets, search]);

  // Paginar
  const paginatedTickets = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('asignado')) return '#1976d2';
    if (e.includes('pendiente')) return '#f57c00';
    if (e.includes('proceso')) return '#d32f2f';
    return '#666';
  };

  const getSlaColor = (slaText) => {
    if (!slaText) return '#999';
    const match = slaText.match(/(-?\d+)h/);
    if (!match) return '#999';
    const horas = parseInt(match[1]);
    if (horas < 0) return '#d32f2f';
    if (horas <= 2) return '#d32f2f';
    if (horas <= 4) return '#f57c00';
    return '#f57c00';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Incidentes Pendientes
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Volver
        </Button>
      </Box>

      {/* Buscador */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por ID, título o estado..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabla de Incidentes */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 48, color: '#999', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No hay incidentes pendientes
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>TICKET</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>TÍTULO</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ESTADO</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>CREADO</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SLA</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id_ticket} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                    #{ticket.id_ticket}
                  </TableCell>
                  <TableCell>{ticket.titulo}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.estado}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(ticket.estado),
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: '#666' }}>
                    {new Date(ticket.fecha_creacion).toLocaleString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.sla || 'N/A'}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: getSlaColor(ticket.sla),
                        borderColor: getSlaColor(ticket.sla),
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => navigate(`/tickets/${ticket.id_ticket}`)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
          />
        </TableContainer>
      )}
    </Container>
  );
}
