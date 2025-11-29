import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, Card, CardContent, Box, CircularProgress, Alert, Chip, useTheme, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';

const TicketsPorCliente = () => {
  const apiBase = getApiOrigin();
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(''); // id_usuario
  const [usuarios, setUsuarios] = useState([]); // [{id_usuario, nombre}]
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  // Cargar todos los usuarios (clientes)
  useEffect(() => {
    const fetchUsuarios = async () => {
      setError(null);
      try {
        const res = await axios.get(`${apiBase}/apiticket/usuario`);
        const data = Array.isArray(res.data) ? res.data : [];
        // Map and capture possible role field names, then filter to role === 3 (cliente)
        const mapped = data.map(u => ({
          id_usuario: u.id_usuario ?? u.id ?? u.ID_USUARIO,
          id_rol: u.id_rol ?? u.idRol ?? u.rol_id ?? u.rol ?? u.role ?? u.ID_ROL ?? null,
          nombre: (u.nombre ?? u.nombre_usuario) || ((`${u.nombre || ''} ${u.apellido || ''}`).trim()) || 'Sin nombre'
        }));
        const clientes = mapped.filter(u => Number(u.id_rol) === 3);
        setUsuarios(clientes);
        // Do not auto-select a client; keep the select empty so user chooses explicitly
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la lista de usuarios');
      }
    };
    fetchUsuarios();
  }, []);

  // Cargar tickets por usuario seleccionado
  useEffect(() => {
    const fetchTickets = async () => {
      if (!usuarioSeleccionado) { setTickets([]); return; }
      setLoading(true);
      setError(null);
      try {
        // Use the "completos" endpoint so we have fecha_creacion and related data
        const res = await axios.get(`${apiBase}/apiticket/ticket/getTicketsCompletos`);
        const data = Array.isArray(res.data) ? res.data : [];
        // Filter to tickets belonging to the selected user
        const userTickets = data.filter(t => String(t.id_usuario) === String(usuarioSeleccionado));
        const mapped = userTickets.map(t => {
          const estadoVal = (t.estado && (t.estado.nombre ?? t.estado)) || (t['Estado actual'] ?? '');
          const slaVal = (t.sla && (t.sla.tiempo_restante ?? t.sla)) || (t['Tiempo restante SLA'] ?? '');
          return ({
            id_ticket: parseInt(t.id_ticket ?? t['Identificador del Ticket'] ?? t.id, 10),
            titulo: t.titulo ?? t['Título'] ?? 'Ticket',
            estado: estadoVal,
            sla: slaVal,
            _raw: t
          });
        });
        setTickets(mapped);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los tiquetes del usuario seleccionado');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [usuarioSeleccionado]);

  // Build calendar events from tickets (use creation date)
  // Build calendar events from tickets using fecha_creacion from the ticket completo
  const events = tickets.map(t => {
    const raw = t._raw || {};
    const dateStr = raw.fecha_creacion || raw['fecha_creacion'] || raw['Fecha de creación'] || raw.fecha || raw.created_at;
    if (!dateStr) return null; // skip tickets without a creation date
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
  }).filter(Boolean);

  // Debug: log events so we can confirm dates and objects
  if (process.env.NODE_ENV !== 'production') {
    console.debug('TicketsPorCliente - events for calendar:', events);
  }

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: '#1976d2', // change this color to adjust calendar event color
      borderRadius: '4px',
      color: 'white',
      border: 'none'
    }
  });

  // Hover message and dialog states
  const [hoveredTicket, setHoveredTicket] = useState(null); // object { title, msg }
  const [hoverPos, setHoverPos] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null); // when set, dialog opens
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
        // clear any existing timeout
        if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
        const x = e.clientX;
        const y = e.clientY;
        const left = Math.min(x + 12, window.innerWidth - 320);
        const top = Math.min(y + 12, window.innerHeight - 120);
        setHoverPos({ left, top });
        setHoveredTicket({ title: event.title, msg: t('tickets.hover.clickForSummary') });
        // auto-hide after 2.5s in case mouseleave didn't fire
        hoverTimeoutRef.current = setTimeout(() => { setHoveredTicket(null); setHoverPos(null); hoverTimeoutRef.current = null; }, 2500);
      }}
      onMouseLeave={() => { if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } setHoveredTicket(null); setHoverPos(null); }}
      style={{ padding: 4 }}
    >
      {event.title}
    </div>
  );

  // when hoveredTicket is active, hide it if the mouse moves away from any .rbc-event element
  useEffect(() => {
    if (!hoveredTicket) return;
    const onMove = (e) => {
      try {
        // if the pointer is not over an event element, clear the hover
        if (!e.target || !e.target.closest || !e.target.closest('.rbc-event')) {
          if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
          setHoveredTicket(null);
          setHoverPos(null);
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hoveredTicket]);

  // clear hover when tickets or calendar date changes (avoid stale hover after layout shifts)
  useEffect(() => { setHoveredTicket(null); setHoverPos(null); if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } }, [tickets, calendarDate]);

  const CustomToolbar = (toolbarProps) => {
    const years = Array.from({ length: 9 }, (_, i) => 2020 + i); // 2020..2028
    const months = [
      t('calendar.months.0'),t('calendar.months.1'),t('calendar.months.2'),t('calendar.months.3'),t('calendar.months.4'),t('calendar.months.5'),t('calendar.months.6'),t('calendar.months.7'),t('calendar.months.8'),t('calendar.months.9'),t('calendar.months.10'),t('calendar.months.11')
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
          <button onClick={() => toolbarProps.onNavigate('TODAY')}>{t('calendar.today')}</button>
          <button onClick={() => toolbarProps.onNavigate('PREV')}>{t('calendar.prev')}</button>
          <button onClick={() => toolbarProps.onNavigate('NEXT')}>{t('calendar.next')}</button>
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
      <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 700 }}>
        {t('tickets.forClientTitle')}
      </Typography>

      <FormControl fullWidth variant="outlined" sx={{ mb: 4 }}>
        <InputLabel id="select-usuario-label" shrink>{t('tickets.selectClient')}</InputLabel>
        <Select
          labelId="select-usuario-label"
          value={usuarioSeleccionado}
          label={t('tickets.selectClient')}
          onChange={(e) => setUsuarioSeleccionado(e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) return t('tickets.selectClientPlaceholder');
            const found = usuarios.find(u => String(u.id_usuario) === String(selected));
            return found ? found.nombre : selected;
          }}
        >
          <MenuItem value="" disabled>
            {t('tickets.selectClientPlaceholder')}
          </MenuItem>
          {usuarios.map((u) => (
            <MenuItem key={u.id_usuario} value={u.id_usuario}>{u.nombre}</MenuItem>
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
          <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>
        )}

        {!loading && !error && tickets.length > 0 ? (
          tickets.map((ticket) => (
              <Grid item xs={12} md={6} key={ticket.id_ticket}>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    borderLeft: `6px solid ${getStatusColor(ticket.estado)}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/tickets/${ticket.id_ticket}`)}
                >
                  <CardContent>
                    <Typography variant="h6">#{ticket.id_ticket} - {ticket.titulo}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                                      <Chip size="small" label={translateEstadoLabel(ticket.estado)} sx={{ bgcolor: getStatusColor(ticket.estado), color: '#fff' }} />
                                      {ticket.sla && <Chip size="small" variant="outlined" label={`${t('tickets.sla.label')}: ${ticket.sla}`} />}
                                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
        ) : (
          !loading && usuarioSeleccionado ? (
            <Grid item xs={12}>
              <Typography color="text.secondary">{t('tickets.noTicketsForSelectedClient')}</Typography>
            </Grid>
          ) : null
        )}
      </Grid>

      {/* Calendar view below the tickets list */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('tickets.calendarTitle')}</Typography>
        <Card>
          <CardContent sx={{ p: 0 }}>
              <div style={{ height: 640, paddingTop: 8, paddingRight: 8, overflow: 'hidden' }}>
                <Calendar
                localizer={localizer}
                events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                date={calendarDate}
                toolbar={true}
                onNavigate={(date, view) => { console.debug('TicketsPorCliente Calendar navigate:', date, view); setCalendarDate(date); }}
                onView={(view) => console.debug('TicketsPorCliente Calendar view:', view)}
                defaultView="month"
                views={["month", "week", "day"]}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                // Disable the calendar's native tooltip/title to avoid duplicate browser tooltips
                tooltipAccessor={() => null}
                components={{ event: CalendarEvent, toolbar: CustomToolbar }}
              />
            </div>
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('tickets.calendarHint')}
        </Typography>
      </Box>
      {/* Dialog summary (opens on click) */}
      <Dialog open={!!selectedTicket} onClose={() => setSelectedTicket(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tickets.dialog.summaryTitle')}</DialogTitle>
        <DialogContent dividers>
          {selectedTicket ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.id')}</Typography>
              <Typography variant="body1">{selectedTicket.id_ticket ?? selectedTicket.id}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.title')}</Typography>
              <Typography variant="body1">{selectedTicket.titulo ?? selectedTicket.Título}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.description')}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{selectedTicket.descripcion ?? selectedTicket.Descripción ?? t('tickets.dialog.noDescription')}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.priority')}</Typography>
              <Typography variant="body1">{selectedTicket.prioridad ?? selectedTicket.priority ?? t('tickets.dialog.na')}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.category')}</Typography>
              <Typography variant="body1">{(selectedTicket.categoria && (selectedTicket.categoria.nombre ?? selectedTicket.categoria)) || selectedTicket.categoria_descripcion || t('tickets.dialog.na')}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.technician')}</Typography>
              <Typography variant="body1">{(selectedTicket.tecnico && (selectedTicket.tecnico.nombre ?? selectedTicket.tecnico.nombre_usuario ?? selectedTicket.tecnico)) || t('tickets.dialog.notAssigned')}</Typography>

              <Typography variant="subtitle2" color="text.secondary">{t('tickets.dialog.client')}</Typography>
              <Typography variant="body1">{(selectedTicket.usuario && (selectedTicket.usuario.nombre ?? selectedTicket.usuario)) || selectedTicket.id_usuario || t('tickets.dialog.na')}</Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTicket(null)}>{t('home.close')}</Button>
          {selectedTicket && (
            <Button variant="contained" onClick={() => navigate(`/tickets/${selectedTicket.id_ticket ?? selectedTicket.id}`)}>{t('actions.viewDetail')}</Button>
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

export default TicketsPorCliente;
