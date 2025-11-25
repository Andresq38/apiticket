import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getApiOrigin } from '../../utils/apiBase';

const getApiBase = () => `${getApiOrigin()}/apiticket`;

const statusColor = (estado) => {
  const map = { 'Asignado': 'info', 'En Proceso': 'warning', 'Resuelto': 'success', 'Cerrado': 'default' };
  return map[estado] || 'primary';
};

const getSlaUrgency = (slaText) => {
  if (!slaText) return null;
  const match = slaText.match(/(-?\d+)h/);
  if (!match) return null;
  const horas = parseInt(match[1]);
  if (horas < 0) return { level: 'vencido', order: 0, color: '#d32f2f', bg: '#ffebee', Icon: ErrorIcon, label: 'VENCIDO' };
  if (horas <= 2) return { level: 'critico', order: 1, color: '#d32f2f', bg: '#ffe0e0', Icon: ErrorIcon, label: 'CRÍTICO' };
  if (horas <= 4) return { level: 'urgente', order: 2, color: '#f57c00', bg: '#fff3e0', Icon: WarningAmberIcon, label: 'URGENTE' };
  if (horas <= 24) return { level: 'proximo', order: 3, color: '#ed6c02', bg: '#fff8e1', Icon: AccessTimeIcon, label: 'PRÓXIMO' };
  return { level: 'normal', order: 4, color: '#2e7d32', bg: '#f1f8f4', Icon: AccessTimeIcon, label: 'NORMAL' };
};

export default function SlaMonitor() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${getApiBase()}/ticket`);
      const data = Array.isArray(res.data) ? res.data : [];
      setTickets(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const rows = useMemo(() => {
    const enriched = tickets.map((t) => {
      const slaText = t['Tiempo restante SLA'] || t['Tiempo restante SLA (máx)'] || t.sla_texto;
      const urg = getSlaUrgency(slaText);
      return { ...t, _slaText: slaText, _urg: urg };
    });
    let filtered = enriched;
    if (filtro !== 'todos') filtered = enriched.filter((r) => r._urg?.level === filtro);
    return filtered
      .filter((r) => r._urg)
      .sort((a, b) => (a._urg.order - b._urg.order));
  }, [tickets, filtro]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Monitor de SLA</Typography>
            <Typography variant="body2" color="text.secondary">Prioriza y actúa sobre los tiquetes con SLA más críticos</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField select size="small" label="Filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="vencido">Vencido</MenuItem>
              <MenuItem value="critico">Crítico</MenuItem>
              <MenuItem value="urgente">Urgente</MenuItem>
              <MenuItem value="proximo">Próximo</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
            </TextField>
            <Tooltip title="Actualizar">
              <IconButton onClick={fetchTickets}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
        {!!error && (<Alert severity="error">{error}</Alert>)}

        {!loading && !error && (
          <TableContainer sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tiquete</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Tiempo restante SLA</TableCell>
                  <TableCell>Prioridad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 600 }}>#{r['Identificador del Ticket']}</TableCell>
                    <TableCell>{r['Categoría']}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r['Estado actual']} color={statusColor(r['Estado actual'])} />
                    </TableCell>
                    <TableCell>
                      {r._urg ? (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: r._urg.bg }}>
                          {r._urg.Icon && <r._urg.Icon sx={{ fontSize: 18, color: r._urg.color }} />}
                          <Typography variant="caption" sx={{ fontWeight: 700, color: r._urg.color }}>{r._urg.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{r._slaText}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={r['Prioridad']} color={r['Prioridad'] === 'Alta' ? 'error' : r['Prioridad'] === 'Media' ? 'warning' : 'info'} />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">No hay tiquetes para el filtro seleccionado.</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
