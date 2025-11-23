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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CloseIcon from '@mui/icons-material/Close';
import SuccessOverlay from '../common/SuccessOverlay';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// Vista de catálogo: solo listado, sin formulario de creación

const CategoriasList = () => {
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
            Cargando categorías...
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

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 1, 
            fontWeight: 700, 
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <FolderSpecialIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Categorías de Tiquetes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona y organiza los diferentes tipos de tiquetes del sistema
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Button
          variant={deleteMode ? 'outlined' : 'contained'}
          color={deleteMode ? 'inherit' : 'error'}
          startIcon={deleteMode ? <CloseIcon /> : <DeleteOutlineIcon />}
          onClick={() => {
            setDeleteMode(d => !d);
            setTargetCategoria(null);
          }}
        >
          {deleteMode ? 'Cancelar eliminación' : 'Eliminar'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : categorias.length === 0 ? (
        <Alert severity="info">No hay categorías disponibles.</Alert>
      ) : (
        <Grid container spacing={3}>
          {categorias.map((cat) => (
            <Grid item xs={12} sm={6} md={4} key={cat.id_categoria}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(25, 118, 210, 0.15)',
                    borderColor: 'primary.main',
                    '& .arrow-icon': {
                      transform: 'translateX(4px)',
                      opacity: 1
                    }
                  }
                }}
                onClick={() => !deleteMode && handleCategoriaClick(cat.id_categoria)}
              >
                {/* Edición desde detalle: se removió botón de edición directo en el listado */}
                {/* Barra superior de color */}
                <Box 
                  sx={{ 
                    height: 6, 
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                  }} 
                />
                {deleteMode && (
                  <Tooltip title={`Eliminar categoría #${cat.id_categoria}`}>
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
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    />
                    <ArrowForwardIcon 
                      className="arrow-icon"
                      sx={{ 
                        color: 'primary.main', 
                        fontSize: 24,
                        transition: 'all 0.3s ease',
                        opacity: 0.5
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
                      p: 1.5, 
                      mb: 2,
                      bgcolor: 'rgba(13, 71, 161, 0.05)',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'rgba(13, 71, 161, 0.1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                            letterSpacing: 0.5
                          }}
                        >
                          Acuerdo de Servicio
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'primary.main',
                            fontWeight: 600,
                            mt: 0.25
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
                      p: 1.5,
                      bgcolor: 'rgba(13, 71, 161, 0.05)',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'rgba(13, 71, 161, 0.1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalOfferIcon sx={{ color: 'rgba(0,0,139,0.9)', fontSize: 20 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 600
                        }}
                      >
                        Etiquetas disponibles
                      </Typography>
                    </Box>
                    <Chip 
                      label={cat.num_etiquetas}
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 32,
                        height: 28
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
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
