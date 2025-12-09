import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { getApiOrigin } from "../../utils/apiBase";
import { formatDateTime } from "../../utils/format";

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0=Todas, 1=No leídas, 2=Leídas
  const [userId, setUserId] = useState(null);

  const apiBase = getApiOrigin();

  // Obtener userId del contexto/localStorage
  useEffect(() => {
    // Usar authUser que es donde AuthContext guarda el usuario
    const userStr = localStorage.getItem("authUser");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUserId(userData.id);
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }
  }, []);

  const fetchNotificaciones = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${apiBase}/apiticket/notificacion/porUsuario/${userId}`
      );
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setNotificaciones(data);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
      setError("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotificaciones();
    }
  }, [userId]);

  const handleMarcarComoLeida = async (id) => {
    try {
      await axios.post(`${apiBase}/apiticket/notificacion/marcarLeidaUna`, {
        id_notificacion: id,
      });
      fetchNotificaciones();
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await axios.post(`${apiBase}/apiticket/notificacion/marcarTodasLeidas`, {
        id_usuario: userId,
      });
      fetchNotificaciones();
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta notificación?")) return;

    try {
      await axios.delete(`${apiBase}/apiticket/notificacion/${id}`);
      fetchNotificaciones();
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getTipoColor = (tipo) => {
    if (tipo?.includes("estado")) return "primary";
    if (tipo?.includes("sesión") || tipo?.includes("sesi")) return "success";
    if (tipo?.includes("asignación") || tipo?.includes("asignacion"))
      return "warning";
    return "default";
  };

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (tabValue === 0) return true; // Todas
    if (tabValue === 1) return n.estado === "No Leida"; // No leídas
    if (tabValue === 2) return n.estado === "Leida"; // Leídas
    return true;
  });

  const noLeidas = notificaciones.filter((n) => n.estado === "No Leida").length;

  if (!userId) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para ver las notificaciones
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36 }} />
            Mis Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {noLeidas} notificación{noLeidas !== 1 ? "es" : ""} sin leer
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {noLeidas > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarcarTodasLeidas}
            >
              Marcar todas leídas
            </Button>
          )}
          <IconButton onClick={fetchNotificaciones} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs de filtrado */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Todas (${notificaciones.length})`} />
          <Tab label={`No leídas (${noLeidas})`} />
          <Tab label={`Leídas (${notificaciones.length - noLeidas})`} />
        </Tabs>
      </Box>

      {/* Contenido */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : notificacionesFiltradas.length === 0 ? (
        <Alert severity="info">No hay notificaciones para mostrar</Alert>
      ) : (
        <Grid container spacing={2}>
          {notificacionesFiltradas.map((notif) => (
            <Grid item xs={12} key={notif.id_notificacion}>
              <Card
                elevation={notif.estado === "No Leida" ? 3 : 1}
                sx={{
                  borderLeft:
                    notif.estado === "No Leida" ? "4px solid" : "none",
                  borderLeftColor: "primary.main",
                  bgcolor:
                    notif.estado === "No Leida"
                      ? "action.hover"
                      : "background.paper",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 1,
                          alignItems: "center",
                        }}
                      >
                        <Chip
                          label={notif.tipo_evento || "Notificación"}
                          size="small"
                          color={getTipoColor(notif.tipo_evento)}
                        />
                        {notif.estado === "No Leida" && (
                          <Chip
                            label="Nueva"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                        {notif.estado === "Leida" && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Leída"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: notif.estado === "No Leida" ? 600 : 400,
                          mb: 1,
                        }}
                      >
                        {notif.mensaje || "Sin mensaje"}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        📅 {formatDateTime(notif.fecha_hora)}
                      </Typography>

                      {notif.nombre_remitente && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          👤 De: {notif.nombre_remitente}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {notif.estado === "No Leida" && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleMarcarComoLeida(notif.id_notificacion)
                          }
                          title="Marcar como leída"
                        >
                          <MarkEmailReadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleEliminar(notif.id_notificacion)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
