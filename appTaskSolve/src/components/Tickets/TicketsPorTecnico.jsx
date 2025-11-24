import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, Card, CardContent, Box, CircularProgress, Alert, Chip, useTheme, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
// Calendar
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';

const TicketsPorTecnico = () => {
  const apiBase = getApiOrigin();
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(''); // id_tecnico
  const [tecnicos, setTecnicos] = useState([]); // [{id_tecnico, nombre}]
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const locales = { 'es': es };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

  const getStatusColor = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('asignado') || e.includes('abierto')) return theme.palette.info.main;
    if (e.includes('proceso')) return theme.palette.warning.main;
    if (e.includes('resuelto')) return theme.palette.success.main;
    if (e.includes('cerrado')) return theme.palette.grey[500];
    return theme.palette.grey[700];
  };

  // Cargar todos los técnicos (aunque no tengan tickets asignados)
  useEffect(() => {
    const fetchTecnicos = async () => {
      setError(null);
      try {
        const res = await axios.get(`${apiBase}/apiticket/tecnico`);
        const data = Array.isArray(res.data) ? res.data : [];
        // normalizar campos
        const mapped = data.map(t => ({
          id_tecnico: t.id_tecnico ?? t.ID_TECNICO ?? t.id,
          nombre: t.nombre ?? t.nombre_usuario ?? 'Sin nombre'
        }));
        setTecnicos(mapped);
        // Do not auto-select a technician; require explicit user choice
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la lista de técnicos');
      }
    };
    fetchTecnicos();
  }, []);

  // Cargar tickets por técnico seleccionado
  useEffect(() => {
    const fetchTickets = async () => {
      if (!tecnicoSeleccionado) { setTickets([]); return; }
      setLoading(true);
      setError(null);
      try {
        // Use the completos endpoint so we can access fecha_creacion and related data
        const res = await axios.get(`${apiBase}/apiticket/ticket/getTicketsCompletos`);
        const data = Array.isArray(res.data) ? res.data : [];
        // Filter to tickets belonging to the selected technician
        const techTickets = data.filter(t => String(t.id_tecnico) === String(tecnicoSeleccionado));
        const mapped = techTickets.map(t => ({
          id_ticket: parseInt(t.id_ticket ?? t['Identificador del Ticket'] ?? t.id, 10),
          titulo: t.titulo ?? t['Título'] ?? 'Tiquete',
          estado: (t.estado && (t.estado.nombre ?? t.estado)) || (t['Estado actual'] ?? ''),
          sla: (t.sla && (t.sla.tiempo_restante ?? t.sla)) || (t['Tiempo restante SLA'] ?? ''),
          _raw: t
        }));
        setTickets(mapped);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los tiquetes del técnico seleccionado');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [tecnicoSeleccionado]);

  // Build calendar events from tickets (use assignment date when available)
  const events = tickets.map(t => {
    const raw = t._raw || {};
    // possible assignment keys
    const assignCandidates = [raw.fecha_asignacion, raw.fecha_asignado, raw.asignado_en, raw.assigned_at, raw.assignment_date, raw.fechaAsignacion];
    const dateStr = assignCandidates.find(Boolean);
    // Only include events that have an explicit assignment date (no fallback to creation)
    if (!dateStr) return null;
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: t.id_ticket,
      title: `#${t.id_ticket} ${t.titulo}`,
      start,
      end,
      allDay: false,
      resource: t
    };
  });
  const filteredEvents = events.filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('TicketsPorTecnico - events for calendar:', filteredEvents);
  }

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: '#d32f2f', // change this color to adjust calendar event color for técnicos
      borderRadius: '4px',
      color: 'white',
      border: 'none'
    }
  });

  // Hover message and dialog states
  const [hoveredTicket, setHoveredTicket] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const hoverTimeoutRef = useRef(null);

  const handleSelectEvent = (ev) => {
    // clear hover preview when opening dialog
    setHoveredTicket(null);
    setHoverPos(null);
    const found = tickets.find(t => Number(t.id_ticket) === Number(ev.id));
    setSelectedTicket(found?._raw || found || ev.resource?._raw || ev.resource || null);
  };

  const CalendarEvent = ({ event }) => (
    <div
      onMouseEnter={(e) => {
        if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
        const x = e.clientX;
        const y = e.clientY;
        const left = Math.min(x + 12, window.innerWidth - 320);
        const top = Math.min(y + 12, window.innerHeight - 120);
        setHoverPos({ left, top });
        setHoveredTicket({ title: event.title, msg: 'Haga clic para ver un resumen detallado de este tiquete.' });
        hoverTimeoutRef.current = setTimeout(() => { setHoveredTicket(null); setHoverPos(null); hoverTimeoutRef.current = null; }, 2500);
      }}
      onMouseLeave={() => { if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } setHoveredTicket(null); setHoverPos(null); }}
      style={{ padding: 4 }}
    >
      {event.title}
    </div>
  );

  useEffect(() => {
    if (!hoveredTicket) return;
    const onMove = (e) => {
      try {
        if (!e.target || !e.target.closest || !e.target.closest('.rbc-event')) {
          if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
          setHoveredTicket(null);
          setHoverPos(null);
        }
      } catch (err) {}
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hoveredTicket]);

  useEffect(() => { setHoveredTicket(null); setHoverPos(null); if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } }, [tickets, calendarDate]);

  const CustomToolbar = (toolbarProps) => {
    const years = Array.from({ length: 9 }, (_, i) => 2020 + i); // 2020..2028
    const months = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];

    const currentDate = toolbarProps.date || new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const onChangeYear = (e) => {
      const y = Number(e.target.value);
      const newDate = new Date(y, currentMonth, 1);
      // Use DATE action so the calendar receives a specific date to navigate to
      toolbarProps.onNavigate('DATE', newDate);
    };

    const onChangeMonth = (e) => {
      const m = Number(e.target.value);
      const newDate = new Date(currentYear, m, 1);
      toolbarProps.onNavigate('DATE', newDate);
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ marginLeft: 16 }}>
          <button onClick={() => toolbarProps.onNavigate('TODAY')}>Hoy</button>
          <button onClick={() => toolbarProps.onNavigate('PREV')}>Atrás</button>
          <button onClick={() => toolbarProps.onNavigate('NEXT')}>Siguiente</button>
        </div>
        <div style={{ fontWeight: 600 }}>{toolbarProps.label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select value={currentYear} onChange={onChangeYear} size="small">
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
          <Select value={currentMonth} onChange={onChangeMonth} size="small">
            {months.map((m, idx) => <MenuItem key={m} value={idx}>{m}</MenuItem>)}
          </Select>
        </div>
      </div>
    );
  };

  const getField = (raw, names) => {
    for (const n of names) if (raw[n]) return raw[n];
    return null;
  };

  return (
    <Container sx={{ py: 4, pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 700 }}>
        Tiquetes Asignados por Técnico
      </Typography>

      <FormControl fullWidth variant="outlined" sx={{ mb: 4 }}>
        <InputLabel id="select-tecnico-label" shrink>Seleccionar Técnico</InputLabel>
        <Select
          labelId="select-tecnico-label"
          value={tecnicoSeleccionado}
          label="Seleccionar Técnico"
          onChange={(e) => setTecnicoSeleccionado(e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) return 'Seleccione un técnico...';
            const found = tecnicos.find(t => String(t.id_tecnico) === String(selected));
            return found ? found.nombre : selected;
          }}
        >
          <MenuItem value="" disabled>
            Seleccione un técnico...
          </MenuItem>
          {tecnicos.map((t) => (
            <MenuItem key={t.id_tecnico} value={t.id_tecnico}>{t.nombre}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={3}>
        {loading && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          </Grid>
        )}
        {!!error && !loading && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        {!loading && !error && tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Grid item xs={12} md={6} key={ticket.id_ticket}>
              <Card
                elevation={2}
                sx={{ borderRadius: 2, borderLeft: `6px solid ${getStatusColor(ticket.estado)}`, cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(`/tickets/${ticket.id_ticket}`)}
              >
                <CardContent>
                  <Typography variant="h6">#{ticket.id_ticket} - {ticket.titulo}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                    <Chip size="small" label={ticket.estado} sx={{ bgcolor: getStatusColor(ticket.estado), color: '#fff' }} />
                    {ticket.sla && (
                      <Chip size="small" variant="outlined" label={`SLA: ${ticket.sla}`} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          tecnicoSeleccionado && !loading && !error && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No hay tiquetes asignados para el técnico seleccionado.</Typography>
            </Grid>
          )
        )}
      </Grid>

      {/* Calendar view below the tickets list */}
  <Box sx={{ mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Calendario de tiquetes (por fecha de asignación)</Typography>
        <Card>
          <CardContent sx={{ p: 0 }}>
            <div style={{ height: 640, paddingTop: 8, paddingRight: 8, overflow: 'hidden' }}>
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                date={calendarDate}
                toolbar={true}
                onNavigate={(date, view) => { console.debug('TicketsPorTecnico Calendar navigate:', date, view); setCalendarDate(date); }}
                onView={(view) => console.debug('TicketsPorTecnico Calendar view:', view)}
                defaultView="month"
                views={["month", "week", "day"]}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                // Disable native/browser tooltip (prevents duplicate tooltip when hovering events)
                tooltipAccessor={() => null}
                components={{ event: CalendarEvent, toolbar: CustomToolbar }}
              />
            </div>
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Los eventos se generan desde la fecha de asignación del ticket (fecha_asignacion). Solo se muestran eventos con fecha de asignación explícita.
        </Typography>
      </Box>
      {/* Dialog summary (opens on click) */}
      <Dialog open={!!selectedTicket} onClose={() => setSelectedTicket(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Resumen del ticket</DialogTitle>
        <DialogContent dividers>
          {selectedTicket ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">ID</Typography>
              <Typography variant="body1">{selectedTicket.id_ticket ?? selectedTicket.id}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Título</Typography>
              <Typography variant="body1">{selectedTicket.titulo ?? selectedTicket.Título}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{selectedTicket.descripcion ?? selectedTicket.Descripción ?? 'Sin descripción'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Prioridad</Typography>
              <Typography variant="body1">{selectedTicket.prioridad ?? selectedTicket.priority ?? 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Categoría</Typography>
              <Typography variant="body1">{(selectedTicket.categoria && (selectedTicket.categoria.nombre ?? selectedTicket.categoria)) || selectedTicket.categoria_descripcion || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Técnico</Typography>
              <Typography variant="body1">{(selectedTicket.tecnico && (selectedTicket.tecnico.nombre ?? selectedTicket.tecnico.nombre_usuario ?? selectedTicket.tecnico)) || 'No asignado'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
              <Typography variant="body1">{(selectedTicket.usuario && (selectedTicket.usuario.nombre ?? selectedTicket.usuario)) || selectedTicket.id_usuario || 'N/A'}</Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTicket(null)}>Cerrar</Button>
          {selectedTicket && (
            <Button variant="contained" onClick={() => navigate(`/tickets/${selectedTicket.id_ticket ?? selectedTicket.id}`)}>Ver detalle</Button>
          )}
        </DialogActions>
      </Dialog>
      {hoveredTicket && hoverPos && (
        <Box sx={{ position: 'fixed', left: hoverPos.left, top: hoverPos.top, width: 300, bgcolor: '#fff', color: '#000', boxShadow: 3, borderRadius: 2, p: 2, zIndex: 1400, pointerEvents: 'none' }}>
          <Typography variant="subtitle2" sx={{ color: '#000', fontStyle: 'italic' }}>{hoveredTicket.title}</Typography>
          <Typography variant="body2" sx={{ color: '#000', mt: 1 }}>{hoveredTicket.msg}</Typography>
        </Box>
      )}
    </Container>
  );
};

export default TicketsPorTecnico;
