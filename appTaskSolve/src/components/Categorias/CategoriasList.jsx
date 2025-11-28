import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Box,
  Paper,
  Divider,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CategoryIcon from '@mui/icons-material/Category';
import Stack from '@mui/material/Stack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CloseIcon from '@mui/icons-material/Close';
import SuccessOverlay from '../common/SuccessOverlay';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// Vista de catálogo: solo listado, sin formulario de creación

const CategoriasList = () => {
      // Sistema de colores para categorías (puedes ajustar según SLA, id, etc.)
      function getCategoriaColor(id_categoria) {
        // Ejemplo: alternar colores por id_categoria o usar lógica de SLA
        const colorSets = [
          {
            gradient: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            bg: '#e3f2fd',
            text: '#1976d2',
            border: '#90caf9',
            bar: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)'
          },
          {
            gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            bg: '#e8f5e9',
            text: '#2e7d32',
            border: '#a5d6a7',
            bar: 'linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)'
          },
          {
            gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
            bg: '#fff3e0',
            text: '#f57c00',
            border: '#ffcc80',
            bar: 'linear-gradient(90deg, #f57c00 0%, #ff9800 100%)'
          },
          {
            gradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
            bg: '#ffebee',
            text: '#d32f2f',
            border: '#ef9a9a',
            bar: 'linear-gradient(90deg, #d32f2f 0%, #f44336 100%)'
          }
        ];
        // Alternar por id_categoria para variedad visual
        const idx = id_categoria % colorSets.length;
        return colorSets[idx];
      }
    const navigate = useNavigate();
    // Detectar base de la API
    const getApiBase = () => {
      if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
      return window.location.origin;
    };

    useEffect(() => {
      const fetchCategorias = async () => {
        setLoading(true);
        setError(null);
        try {
          const apiBase = getApiBase();
          const res = await axios.get(`${apiBase}/apiticket/categoria_ticket`);
          let data = res.data;
          if (data && data.data) data = data.data;
          if (Array.isArray(data)) {
            setCategorias(data);
          } else {
            setCategorias([]);
          }
        } catch (err) {
          setError('Error al cargar categorías');
          setCategorias([]);
        } finally {
          setLoading(false);
        }
      };
      fetchCategorias();
    }, []);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [targetCategoria, setTargetCategoria] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedInfo, setDeletedInfo] = useState(null);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Título y subtítulo profesional */}
      <Box sx={{
        mb: 4,
        px: { xs: 2, sm: 4 },
        py: { xs: 2.2, sm: 2.8 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 55%, #0d47a1 100%)',
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
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.28)',
            borderRadius: '50%',
            p: 1.3,
            display: 'flex',
            border: '2px solid rgba(255, 255, 255, 0.42)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CategoryIcon sx={{ fontSize: 30, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 800, 
              color: 'white', 
              mb: 0.3, 
              letterSpacing: '-0.5px', 
              textShadow: '0 2px 6px rgba(0,0,0,0.25)',
              fontSize: '1.55rem'
            }}>
              Catálogo de Categorías
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: 600, 
              fontSize: '0.75rem'
            }}>
              Centro de configuración: administra las categorías base del sistema antes de operar en producción.
            </Typography>
          </Box>
        </Box>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : categorias.length === 0 ? (
        <Alert severity="info">No hay categorías disponibles.</Alert>
      ) : (
        <Grid container spacing={3} justifyContent="center" alignItems="stretch">
          {categorias.map((cat) => {
            const catColor = getCategoriaColor(cat.id_categoria);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id_categoria} sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Card
                  elevation={0}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 5,
                    px: 2.5,
                    pt: 2.5,
                    pb: 2.5,
                    minHeight: 140,
                    background: `linear-gradient(120deg, #fff 80%, ${catColor.bg} 100%)`,
                    border: `2.5px solid ${catColor.border}`,
                    boxShadow: `0 4px 18px 0 ${catColor.text}18`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    transition: 'all .2s',
                    '&:hover': {
                      boxShadow: `0 12px 36px 0 ${catColor.text}33`,
                      borderColor: catColor.text,
                      transform: 'translateY(-2px) scale(1.02)'
                    }
                  }}
                >
                  {/* Avatar y nombre */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', mb: 1.2 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: catColor.gradient,
                      boxShadow: `0 2px 8px ${catColor.text}22`,
                      color: 'white',
                      border: '2px solid #fff',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      flexShrink: 0
                    }}>
                      {cat.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth:0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: .2, fontSize: '1.18rem', color: '#222' }}>{cat.nombre}</Typography>
                    </Box>
                  </Box>
                  {/* Estadística de etiquetas */}
                  <Box sx={{ width: '100%', mt: 1, p: 2, bgcolor: catColor.bg, borderRadius: 3, border: `1.5px solid ${catColor.border}`, textAlign: 'center', boxShadow: `0 1px 8px ${catColor.text}08` }}>
                    <Typography variant="subtitle2" sx={{ color: catColor.text, fontWeight: 700, fontSize: '1.25rem', mb: 0.5 }}>
                      {cat.num_etiquetas}
                    </Typography>
                    <Typography variant="body2" sx={{ color: catColor.text, fontWeight: 500, fontSize: '0.95rem' }}>
                      {cat.num_etiquetas === 0 ? 'Sin etiquetas' : cat.num_etiquetas === 1 ? '1 etiqueta' : `${cat.num_etiquetas} etiquetas`}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar la categoría "{targetCategoria?.nombre}" (ID {targetCategoria?.id_categoria})? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!targetCategoria) return;
              try {
                const apiBase = getApiBase();
                const idDel = targetCategoria.id_categoria;
                await axios.delete(`${apiBase}/apiticket/categoria_ticket/${idDel}`);
                setCategorias(cats => cats.filter(c => c.id_categoria !== idDel));
                setDeletedInfo({ id: idDel, nombre: targetCategoria.nombre });
                setShowDeleteSuccess(true);
              } catch (err) {
                setSnackbar({ open: true, message: err?.response?.data?.error || err.message || 'Error al eliminar', severity: 'error' });
              } finally {
                setConfirmOpen(false);
                setTargetCategoria(null);
              }
            }}
          >Eliminar</Button>
        </DialogActions>
      </Dialog>
      <SuccessOverlay
        open={showDeleteSuccess}
        mode="delete"
        entity="Categoría"
        subtitle={deletedInfo ? `Se eliminó "${deletedInfo.nombre}" (ID ${deletedInfo.id}).` : undefined}
        onClose={() => setShowDeleteSuccess(false)}
        actions={[
          { label: 'Cerrar', onClick: () => setShowDeleteSuccess(false), variant: 'contained', color: 'error' },
          { label: 'Crear nueva', onClick: () => { setShowDeleteSuccess(false); navigate('/categorias/crear'); }, variant: 'outlined', color: 'error' }
        ]}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={snackbar.message}
      />
    </Container>
  );
};

export default CategoriasList;
