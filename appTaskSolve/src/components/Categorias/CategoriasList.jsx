import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [targetCategoria, setTargetCategoria] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedInfo, setDeletedInfo] = useState(null);
  const navigate = useNavigate();

  // Detección dinámica de la API base
  const getApiBase = () => {
    const envApiBase = import.meta.env.VITE_API_BASE;
    if (envApiBase) return envApiBase;
    const currentUrl = window.location.origin;
    if (currentUrl.includes(':5173') || currentUrl.includes(':3000')) {
      return 'http://localhost';
    }
    return currentUrl;
  };

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiBase = getApiBase();
      const response = await axios.get(`${apiBase}/apiticket/categoria_ticket`);
      const categoriasData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      categoriasData.sort((a, b) => {
        const idA = Number(a?.id_categoria ?? a?.id ?? 0);
        const idB = Number(b?.id_categoria ?? b?.id ?? 0);
        return idA - idB;
      });
      setCategorias(categoriasData);
    } catch (err) {
      setError('Error al cargar categorías');
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // Función para obtener color distintivo por categoría
  function getCategoriaColor(id_categoria) {
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
    const idx = id_categoria % colorSets.length;
    return colorSets[idx];
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Título y subtítulo profesional con traducción */}
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
              {t('categories.title')}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}>
              {t('categories.subtitle')}
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
        <Alert severity="info">{t('categories.noCategories')}</Alert>
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
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/categorias/${cat.id_categoria}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/categorias/${cat.id_categoria}`);
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
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: .2, fontSize: '1.18rem', color: '#222' }}>{cat.nombre}</Typography>
                    </Box>
                  </Box>
                  {/* Estadística de etiquetas con traducción */}
                  <Box sx={{ width: '100%', mt: 1, p: 2, bgcolor: catColor.bg, borderRadius: 3, border: `1.5px solid ${catColor.border}`, textAlign: 'center', boxShadow: `0 1px 8px ${catColor.text}08` }}>
                    <Typography variant="subtitle2" sx={{ color: catColor.text, fontWeight: 700, fontSize: '1.25rem', mb: 0.5 }}>
                      {cat.num_etiquetas}
                    </Typography>
                    <Typography variant="body2" sx={{ color: catColor.text, fontWeight: 500, fontSize: '0.95rem' }}>
                      {cat.num_etiquetas === 0
                        ? t('categories.noTags')
                        : cat.num_etiquetas === 1
                          ? t('categories.oneTag')
                          : t('categories.manyTags', { count: cat.num_etiquetas })}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('categories.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('categories.confirmDeleteBody', { name: targetCategoria?.nombre, id: targetCategoria?.id_categoria })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('categories.cancel')}</Button>
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
                setSnackbar({ open: true, message: err?.response?.data?.error || err.message || t('categories.deleteError'), severity: 'error' });
              } finally {
                setConfirmOpen(false);
                setTargetCategoria(null);
              }
            }}
          >{t('categories.delete')}</Button>
        </DialogActions>
      </Dialog>
      <SuccessOverlay
        open={showDeleteSuccess}
        mode="delete"
        entity={t('categories.entity')}
        subtitle={deletedInfo ? t('categories.deleteSuccessSubtitle', { name: deletedInfo.nombre, id: deletedInfo.id }) : undefined}
        onClose={() => setShowDeleteSuccess(false)}
        actions={[
          { label: t('categories.close'), onClick: () => setShowDeleteSuccess(false), variant: 'contained', color: 'error' },
          { label: t('categories.createNew'), onClick: () => { setShowDeleteSuccess(false); navigate('/categorias/crear'); }, variant: 'outlined', color: 'error' }
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