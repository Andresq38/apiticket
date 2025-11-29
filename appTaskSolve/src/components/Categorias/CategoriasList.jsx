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
        
        // Verificar que axios tiene el token configurado
        console.log('Authorization header:', axios.defaults.headers.common['Authorization']);
        
        const response = await axios.get(`${apiBase}/apiticket/categoria_ticket`);
        
        console.log('Datos de categorías:', response.data); // Para debug
        
        // Manejar diferentes formatos de respuesta
        const categoriasData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        // Ordenar ascendente por id_categoria (defensivo ante distintas formas de respuesta)
        categoriasData.sort((a, b) => {
          const idA = Number(a?.id_categoria ?? a?.id ?? 0);
          const idB = Number(b?.id_categoria ?? b?.id ?? 0);
          return idA - idB;
        });
        setCategorias(categoriasData);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Error al cargar categorías';
        const status = err.response?.status || 'desconocido';
        setError(`${errorMsg} (Código: ${status})`);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleCategoriaClick = (idCategoria) => {
    navigate(`/categorias/${idCategoria}`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            {t('categories.loading')}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Función para obtener color distintivo por categoría
  const getCategoriaColor = (idCategoria) => {
    const colors = [
      { gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', bg: '#e3f2fd', text: '#1976d2', border: '#90caf9', bar: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }, // Azul
      { gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)', bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7', bar: 'linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)' }, // Verde
      { gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)', bg: '#fff3e0', text: '#f57c00', border: '#ffcc80', bar: 'linear-gradient(90deg, #f57c00 0%, #ff9800 100%)' }, // Naranja
      { gradient: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)', bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8', bar: 'linear-gradient(90deg, #7b1fa2 0%, #9c27b0 100%)' }, // Púrpura
      { gradient: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)', bg: '#ffebee', text: '#c62828', border: '#ef9a9a', bar: 'linear-gradient(90deg, #c62828 0%, #e53935 100%)' }, // Rojo
      { gradient: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)', bg: '#e1f5fe', text: '#0288d1', border: '#81d4fa', bar: 'linear-gradient(90deg, #0288d1 0%, #03a9f4 100%)' }, // Cyan
    ];
    const index = (idCategoria - 1) % colors.length;
    return colors[index];
  };

  return (
    <Container sx={{ py: 4 }}>
      {/* Header Profesional - Estilo Panel Ejecutivo */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 55%, #0d47a1 100%)',
        borderRadius: 3,
        p: 2.2,
        mb: 3,
        boxShadow: '0 6px 22px rgba(25,118,210,0.25)',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.14)',
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
          animation: 'rainbowShift 8s linear infinite'
        },
        '@keyframes rainbowShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '300% 50%' }
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              bgcolor: 'rgba(255, 255, 255, 0.28)',
              borderRadius: '50%',
              p: 1.3,
              display: 'flex',
              border: '2px solid rgba(255, 255, 255, 0.42)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <FolderSpecialIcon sx={{ fontSize: 30, color: 'white' }} />
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
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={deleteMode ? <CloseIcon /> : <DeleteOutlineIcon />}
          onClick={() => {
            setDeleteMode(d => !d);
            setTargetCategoria(null);
          }}
          sx={{
            fontWeight: 700,
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: deleteMode ? '0 4px 12px rgba(211,47,47,0.3)' : '0 2px 8px rgba(211,47,47,0.2)',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(211,47,47,0.4)'
            }
          }}
        >
          {deleteMode ? t('categories.cancel') : t('categories.delete')}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : categorias.length === 0 ? (
        <Alert severity="info">{t('categories.noCategories')}</Alert>
      ) : (
        <Grid container spacing={3}>
          {categorias.map((cat) => {
            const catColor = getCategoriaColor(cat.id_categoria);
            return (
            <Grid item xs={12} sm={6} md={4} key={cat.id_categoria}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  border: '3px solid',
                  borderColor: catColor.border,
                  boxShadow: `0 4px 12px ${catColor.text}20`,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 28px ${catColor.text}35`,
                    borderColor: catColor.text,
                    '& .arrow-icon': {
                      transform: 'translateX(6px)',
                      opacity: 1
                    }
                  }
                }}
                onClick={() => !deleteMode && handleCategoriaClick(cat.id_categoria)}
              >
                {/* Barra superior de color con gradiente único */}
                <Box 
                  sx={{ 
                    height: 8, 
                    background: catColor.bar,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'shimmer 3s infinite'
                    },
                    '@keyframes shimmer': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' }
                    }
                  }} 
                />
                {deleteMode && (
                  <Tooltip title={t('categories.deleteTooltip', { id: cat.id_categoria })}>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetCategoria(cat);
                        setConfirmOpen(true);
                      }}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, minWidth: 'auto', p: 0.6 }}
                    >
                      <DeleteForeverIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                )}
                
                <CardContent sx={{ p: 3 }}>
                  {/* ID Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Chip 
                      label={`ID: ${cat.id_categoria}`} 
                      size="small" 
                      sx={{ 
                        bgcolor: catColor.text,
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        height: 26,
                        border: '2px solid white',
                        boxShadow: `0 2px 8px ${catColor.text}40`
                      }}
                    />
                    <ArrowForwardIcon 
                      className="arrow-icon"
                      sx={{ 
                        color: catColor.text, 
                        fontSize: 28,
                        transition: 'all 0.3s ease',
                        opacity: 0.6
                      }} 
                    />
                  </Box>

                  {/* Nombre de categoría */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      mb: 2.5,
                      lineHeight: 1.3,
                      minHeight: 56,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {cat.nombre}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  {/* Información de SLA */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2,
                      bgcolor: catColor.bg,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: catColor.border
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: catColor.text, fontSize: 22 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                            letterSpacing: 0.5
                          }}
                        >
                          {t('categories.slaTitle')}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: catColor.text,
                            fontWeight: 700,
                            mt: 0.25,
                            fontSize: '0.9rem'
                          }}
                        >
                          {cat.sla_nombre}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Contador de etiquetas */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: catColor.bg,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: catColor.border
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalOfferIcon sx={{ color: catColor.text, fontSize: 22 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: catColor.text,
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        {t('categories.availableTags')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={cat.num_etiquetas}
                      size="small"
                      sx={{ 
                        bgcolor: catColor.text,
                        color: 'white',
                        fontWeight: 800,
                        minWidth: 36,
                        height: 28,
                        fontSize: '0.85rem',
                        border: '2px solid white',
                        boxShadow: `0 2px 8px ${catColor.text}40`
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )})}
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
