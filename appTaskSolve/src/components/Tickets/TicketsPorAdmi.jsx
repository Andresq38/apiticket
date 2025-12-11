import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  useTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const API_BASE = "http://localhost:81/apiticket";

export default function TicketsPorAdmi() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const [selectedIds, setSelectedIds] = useState([]);

  const navigate = useNavigate();

  const getStatusVisual = (estado) => {
    const e = (estado || "").toLowerCase();
    if (e.includes("pend")) return { color: theme.palette.warning.main };
    if (e.includes("asign")) return { color: theme.palette.info.main };
    if (e.includes("proceso") || e.includes("proce")) return { color: theme.palette.warning.dark || "#f57c00" };
    if (e.includes("resuelto") || e.includes("resuel")) return { color: theme.palette.success.main };
    if (e.includes("cerrado")) return { color: theme.palette.secondary.main };
    return { color: "#9ca3af" };
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

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        // fetch all tickets (controller 'ticket' with index action)
        const res = await fetch(`${API_BASE}/ticket`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Normalize and flatten to consistent shape
        const mapped = (Array.isArray(data) ? data : []).map((t) => ({
          id_ticket:
            parseInt(
              t.id_ticket ??
                t["Identificador del Ticket"] ??
                t.id ??
                t.ID_TICKET ??
                t.ID,
              10
            ) || 0,
          titulo:
            t.titulo ?? t["Categoría"] ?? t.categoria ?? t["Título"] ?? "",
          estado:
            (t.estado && (t.estado.nombre || t.estado)) ||
            t["Estado actual"] ||
            t.estado ||
            "",
          sla:
            t["Tiempo restante SLA (máx)"] ??
            t["Tiempo restante SLA"] ??
            (t.sla && (t.sla.tiempo_restante || String(t.sla))) ??
            "",
          _raw: t,
        }));

        // Sort ascending by id_ticket
        mapped.sort((a, b) => (a.id_ticket || 0) - (b.id_ticket || 0));

        setTickets(mapped);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || t('tickets.loadError'));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [t]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ mb: 2 }}>
        {t('tickets.adminTitle')}
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!!error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && tickets.length === 0 && (
        <Alert severity="info">{t('tickets.noTicketsToShow')}</Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
        {tickets.map((ticket) => {
          const id = ticket.id_ticket;
          return (
            <Box key={id} sx={{ width: "100%" }}>
              <Card
                elevation={2}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  cursor: "pointer",
                  borderLeft: "5px solid",
                  borderLeftColor: getStatusVisual(ticket.estado).color,
                  transition: "all 0.3s ease",
                  "&:hover": { boxShadow: 8, transform: "translateX(4px)" },
                }}
                onClick={() => navigate(`/tickets/${id}`)}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('tickets.ticketLabel')} #{id}
                      </Typography>
                      <Chip
                        size="small"
                        label={translateEstadoLabel(ticket.estado)}
                        sx={{
                          bgcolor: alpha(getStatusVisual(ticket.estado).color, 0.12),
                          color: getStatusVisual(ticket.estado).color,
                          fontWeight: 700,
                          border: `1px solid ${alpha(getStatusVisual(ticket.estado).color, 0.4)}`,
                        }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700 }}>
                      {ticket.titulo}
                    </Typography>
                    {ticket.sla && (
                      <Typography variant="body2" color="text.secondary">
                        SLA: {ticket.sla}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${id}`); }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                      }}
                    >
                      {t('misTickets.viewDetailButton') || t('actions.viewDetail') || 'Ver detalle'}
                    </Button>
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
