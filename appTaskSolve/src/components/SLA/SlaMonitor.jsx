import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getApiOrigin } from "../../utils/apiBase";
import { useTranslation } from 'react-i18next';

const getApiBase = () => `${getApiOrigin()}/apiticket`;

const statusColor = (estado) => {
  const map = {
    Asignado: "info",
    "En Proceso": "warning",
    Resuelto: "success",
    Cerrado: "default",
  };
  return map[estado] || "primary";
};

const getSlaUrgency = (slaText) => {
  if (!slaText) return null;
  const match = slaText.match(/(-?\d+)h/);
  if (!match) return null;
  const horas = parseInt(match[1]);
  if (horas < 0)
    return {
      level: "vencido",
      order: 0,
      color: "#d32f2f",
      bg: "#ffebee",
      Icon: ErrorIcon,
      label: "VENCIDO",
    };
  if (horas <= 2)
    return {
      level: "critico",
      order: 1,
      color: "#d32f2f",
      bg: "#ffe0e0",
      Icon: ErrorIcon,
      label: "CRÍTICO",
    };
  if (horas <= 4)
    return {
      level: "urgente",
      order: 2,
      color: "#f57c00",
      bg: "#fff3e0",
      Icon: WarningAmberIcon,
      label: "URGENTE",
    };
  if (horas <= 24)
    return {
      level: "proximo",
      order: 3,
      color: "#ed6c02",
      bg: "#fff8e1",
      Icon: AccessTimeIcon,
      label: "PRÓXIMO",
    };
  return {
    level: "normal",
    order: 4,
    color: "#2e7d32",
    bg: "#f1f8f4",
    Icon: AccessTimeIcon,
    label: "NORMAL",
  };
};

const statusKey = (estado) => {
  const map = {
    'Asignado': 'status.assigned',
    'En Proceso': 'status.inProgress',
    'Resuelto': 'status.resolved',
    'Cerrado': 'status.closed'
  };
  return map[estado] || 'status.notFound';
};

export default function SlaMonitor() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${getApiBase()}/ticket`);
      const data = Array.isArray(res.data) ? res.data : [];
      setTickets(data);
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Error al cargar tickets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const rows = useMemo(() => {
    const enriched = tickets.map((t) => {
      const slaText =
        t["Tiempo restante SLA"] ||
        t["Tiempo restante SLA (máx)"] ||
        t.sla_texto;
      const urg = getSlaUrgency(slaText);
      return { ...t, _slaText: slaText, _urg: urg };
    });
    let filtered = enriched;
    if (filtro !== "todos")
      filtered = enriched.filter((r) => r._urg?.level === filtro);
    return filtered
      .filter((r) => r._urg)
      .sort((a, b) => a._urg.order - b._urg.order);
  }, [tickets, filtro]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t('home.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('home.description')}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              select
              size="small"
              label={t('home.status')}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <MenuItem value="todos">{t('home.all')}</MenuItem>
              <MenuItem value="vencido">{t('sla.vencido')}</MenuItem>
              <MenuItem value="critico">{t('sla.critico')}</MenuItem>
              <MenuItem value="urgente">{t('sla.urgente')}</MenuItem>
              <MenuItem value="proximo">{t('sla.proximo')}</MenuItem>
              <MenuItem value="normal">{t('sla.normal')}</MenuItem>
            </TextField>
            <Tooltip title={t('home.reload') || 'Actualizar'}>
              <IconButton onClick={fetchTickets}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!!error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <TableContainer sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('home.table.ticket') || 'Ticket'}</TableCell>
                  <TableCell>{t('home.table.title') || 'Category'}</TableCell>
                  <TableCell>{t('home.table.status') || 'Status'}</TableCell>
                  <TableCell>{t('home.table.sla') || 'SLA'}</TableCell>
                  <TableCell>{t('home.table.actions') || 'Priority'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      #{r["Identificador del Ticket"]}
                    </TableCell>
                    <TableCell>{r["Categoría"]}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t(statusKey(r["Estado actual"])) || r["Estado actual"]} color={statusColor(r["Estado actual"])} />
                    </TableCell>
                    <TableCell>
                      {r._urg ? (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: r._urg.bg,
                          }}
                        >
                          {r._urg.Icon && (
                            <r._urg.Icon
                              sx={{ fontSize: 18, color: r._urg.color }}
                            />
                          )}
                          <Typography variant="caption" sx={{ fontWeight: 600, color: r._urg.color, display: 'block', lineHeight: 1.2 }}>
                            {t(`sla.${r._urg.level}`)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r._slaText}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r["Prioridad"]}
                        color={
                          r["Prioridad"] === "Alta"
                            ? "error"
                            : r["Prioridad"] === "Media"
                              ? "warning"
                              : "info"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info">
                        {t('home.noResults') || 'No hay tickets para el filtro seleccionado.'}
                      </Alert>
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
