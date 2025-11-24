import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

const API_BASE = 'http://localhost:81/apiticket';

const statusColor = (estado) => {
  const map = {
    'Asignado': 'info',
    'En Proceso': 'warning',
    'Resuelto': 'success',
    'Cerrado': 'default'
  };
  return map[estado] || 'primary';
};

export default function TicketsPorAdmi() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    // const [selectedIds, setSelectedIds] = useState([]);

  const getStatusColor = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('asign')) return '#0288d1';
    if (e.includes('proceso') || e.includes('proce')) return '#ef6c00';
    if (e.includes('resuelto') || e.includes('resuel')) return '#2e7d32';
    if (e.includes('cerrado')) return '#9e9e9e';
    return '#616161';
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError('');
        // fetch all tickets (controller 'ticket' with index action)
        const res = await fetch(`${API_BASE}/ticket`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Normalize and flatten to consistent shape
        const mapped = (Array.isArray(data) ? data : []).map((t) => ({
          id_ticket: parseInt(t.id_ticket ?? t['Identificador del Ticket'] ?? t.id ?? t.ID_TICKET ?? t.ID, 10) || 0,
          titulo: t.titulo ?? t['Categoría'] ?? t.categoria ?? t['Título'] ?? '',
          estado: (t.estado && (t.estado.nombre || t.estado)) || t['Estado actual'] || t.estado || '',
          sla: t['Tiempo restante SLA (máx)'] ?? t['Tiempo restante SLA'] ?? (t.sla && (t.sla.tiempo_restante || String(t.sla))) ?? '' ,
          _raw: t
        }));

        // Sort ascending by id_ticket
        mapped.sort((a, b) => (a.id_ticket || 0) - (b.id_ticket || 0));

        setTickets(mapped);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ mb: 2 }}>
        Tiquetes
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && tickets.length === 0 && (
        <Alert severity="info">No hay tiquetes para mostrar.</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
        {tickets.map((ticket) => {
          const id = ticket.id_ticket;
          return (
              <Box key={id} sx={{ width: '100%' }}>
                <Card
                  elevation={2}
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 8 }
                  }}
                onClick={() => navigate(`/tickets/${id}`)}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Tiquete #{id}</Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>{ticket.titulo}</Typography>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={ticket.estado} sx={{ bgcolor: getStatusColor(ticket.estado), color: '#fff' }} />
                    {/*ticket.sla && (
                      <Chip size="small" variant="outlined" label={`SLA: ${ticket.sla}`} />
                    )*/}
                  </Box>
                </CardContent>
              </Card>
              </Box>
          );
        })}
      </Box>
    </Container>
  );
}
