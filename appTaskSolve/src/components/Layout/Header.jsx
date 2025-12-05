import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import NotificacionesBadge from "../common/NotificacionesBadge";
import { useTranslation } from "react-i18next";
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState(null);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'en');
  const { user, logout } = useAuth();

  // Obtener userId del localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }
  }, []);

  const getUserId = () => userId;

  const toggleLang = () => {
    const next = (i18n.language === 'es') ? 'en' : 'es';
    i18n.changeLanguage(next);
    try { localStorage.setItem('lang', next); } catch (e) {}
    setLang(next);
  };

  // Función para verificar si una ruta está activa
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";

    // Para MANTENIMIENTOS, solo activar en rutas específicas de mantenimiento
    if (path === "/mantenimientos") {
      const mantenimientosPaths = [
        "/mantenimientos",
        "/mantenimientos/categorias",
        "/tecnicos/crear",
        "/tecnicos/editar",
        "/categorias/crear", // legacy direct paths
        "/categorias/editar",
        "/tickets/crear",
        "/tickets/editar",
      ];
      return mantenimientosPaths.some((p) => location.pathname.startsWith(p));
    }

    // Para TÉCNICOS, excluir rutas de mantenimiento (crear/editar)
    if (path === "/tecnicos") {
      return (
        location.pathname.startsWith("/tecnicos") &&
        !location.pathname.includes("/crear") &&
        !location.pathname.includes("/editar")
      );
    }

    // Para CATEGORÍAS: excluir rutas de mantenimiento (crear/editar) para que solo se subraye MANTENIMIENTOS en esas vistas
    if (path === "/categorias") {
      return (
        location.pathname.startsWith("/categorias") &&
        !location.pathname.includes("/crear") &&
        !location.pathname.includes("/editar")
      );
    }

    return location.pathname.startsWith(path);
  };

  // Estilos para botones activos e inactivos
  const getButtonStyles = (path) => ({
    textTransform: "uppercase",
    fontWeight: 700,
    fontSize: "1.25rem",
    letterSpacing: 0.3,
    px: 1,
    minWidth: "auto",
    borderBottom: isActive(path) ? "3px solid white" : "3px solid transparent",
    borderRadius: 0,
    backgroundColor: isActive(path)
      ? "rgba(255, 255, 255, 0.15)"
      : "transparent",
    "&:hover": {
      backgroundColor: isActive(path)
        ? "rgba(255, 255, 255, 0.25)"
        : "rgba(255, 255, 255, 0.1)",
    },
  });
  // Tickets menu / warning message state
  const [anchorEl, setAnchorEl] = useState(null);
  const [message, setMessage] = useState(""); // set this to a non-empty string to show a message bar
  const WARNING_COLOR = "#ff9800";

  const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleTicketOption = (role) => {
    handleClose();
    if (role === "Tecnico") {
      navigate("/tickets/tecnico");
    } else if (role === "Administrador") {
      navigate("/tickets/Administrador");
    } else if (role === "Cliente") {
      navigate("/tickets/cliente");
    } else {
      const msg = t("header.navigationNotImplemented", { role });
      setMessage(msg);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo + Wordmark: place your file at appTaskSolve/public/logo.png */}
        <Box
          //***********Cambio de direccion para el boton que tiene el logo de TaskSolve*************
          onClick={() => navigate("/homeP")}
          sx={{
            display: "flex",
            alignItems: "center",
            mr: 2,
            cursor: "pointer",
          }}
          aria-label="Go to home"
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              bgcolor: "white",
              borderRadius: 1,
              p: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="TaskSolve"
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                // if PNG fails, try SVG version
                if (
                  e.target &&
                  e.target.src &&
                  !e.target.src.endsWith("/logo.svg")
                ) {
                  e.target.src = "/logo.svg";
                } else {
                  e.target.style.display = "none";
                  const el = document.getElementById("ts-logo-fallback");
                  if (el) el.style.display = "flex";
                }
              }}
            />
          </Box>
          <Box
            id="ts-logo-fallback"
            sx={{
              width: 44,
              height: 44,
              ml: -6,
              bgcolor: "white",
              borderRadius: 1,
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "black",
              boxShadow: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, fontSize: 12 }}
            >
              TS
            </Typography>
          </Box>

          {/* Wordmark: hidden on xs, visible from md+ */}
          <Typography
            variant="subtitle1"
            sx={{
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              ml: 1,
              color: "var(--brand)",
              letterSpacing: 0.2,
            }}
          ></Typography>
        </Box>
        {/* Left-aligned nav group: Home + Dashboard + Técnicos + Categorías */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* HOME - visible para todos */}
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate("/")}
            sx={getButtonStyles("/")}
          >
            {t("header.home")}
          </Button>

          {/* TICKETS - dropdown*/}
          <Box>
            <Button
              variant="text"
              color="inherit"
              onClick={handleMenuClick}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                textTransform: "uppercase",
                fontWeight: 700,
                fontSize: "1.25rem",
                letterSpacing: 0.3,
                px: 1,
                minWidth: "auto",
              }}
            >
              {t("header.tickets")}
            </Button>
          </Box>

          {/* DASHBOARD */}
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={getButtonStyles("/dashboard")}
          >
            {t("header.dashboard")}
          </Button>

          {/* TÉCNICOS */}
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate("/tecnicos")}
            sx={getButtonStyles("/tecnicos")}
          >
            {t("header.technicians")}
          </Button>

          {/* CATEGORÍAS */}
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate("/categorias")}
            sx={getButtonStyles("/categorias")}
          >
            {t("header.categories")}
          </Button>

          {/* MANTENIMIENTOS */}
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate("/mantenimientos")}
            sx={getButtonStyles("/mantenimientos")}
          >
            {t("header.maintenance")}
          </Button>
        </Box>

        {/* Spacer to push any future items to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Badge de Notificaciones */}
        <NotificacionesBadge userId={getUserId()} />
        {/* Language switcher */}
        <Button color="inherit" onClick={toggleLang} sx={{ ml: 1 }} aria-label="Change language">
          { (lang || i18n.language || 'en').toUpperCase() }
        </Button>
        {/* Botón de cerrar sesión si hay usuario */}
        {user && (
          <Button
            color="inherit"
            onClick={() => { logout(); navigate('/login'); }}
            sx={{
              ml: 2,
              fontWeight: 700,
              border: '2px solid #d32f2f',
              color: '#d32f2f',
              backgroundColor: 'white',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#ffebee',
                color: '#b71c1c',
                borderColor: '#b71c1c',
              },
              px: 2,
              py: 1,
            }}
          >
            Cerrar sesión
          </Button>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleTicketOption("Administrador")}>
            {t("header.ticketMenu.administrator")}
          </MenuItem>
          <MenuItem onClick={() => handleTicketOption("Cliente")}>
            {t("header.ticketMenu.client")}
          </MenuItem>
          <MenuItem onClick={() => handleTicketOption("Tecnico")}>
            {t("header.ticketMenu.technician")}
          </MenuItem>
        </Menu>
      </Toolbar>
      {message && (
        <Box
          sx={{
            bgcolor: WARNING_COLOR,
            color: "white",
            p: 1,
            textAlign: "center",
          }}
        >
          {message}
        </Box>
      )}
    </AppBar>
  );
};

export default Header;
