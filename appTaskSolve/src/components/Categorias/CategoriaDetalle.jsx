import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Box,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import EngineeringIcon from '@mui/icons-material/Engineering';
import TimerIcon from '@mui/icons-material/Timer';

const CategoriaDetalle = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchCategoria = async () => {
      try {
        const apiBase = getApiBase();
        const response = await axios.get(`${apiBase}/apiticket/categoria_ticket/${id}`);

        // Normalizar respuesta: la API puede devolver distintos envoltorios.
        let payload = response?.data;
        // Si viene { data: {...} } o { data: [...] }
        if (payload && payload.data) payload = payload.data;
        // Si payload es un array, tomar el primer elemento (algunos endpoints devuelven arrays)
        if (Array.isArray(payload) && payload.length > 0) payload = payload[0];

        if (payload && typeof payload === 'object') {
          setCategoria(payload);
        } else {
          setError('Categoría no encontrada');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar categoría:', err);
        const status = err.response?.status || 'desconocido';
        setError(`Error al cargar categoría. Código de estado: ${status}`);
        setLoading(false);
      }
    };

    fetchCategoria();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando categoría...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/categorias')}
          sx={{ mt: 2 }}
        >
          {t('categories.backToCategories')}
        </Button>
      </Container>
    );
  }

  if (!categoria) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">{t('categories.categoryNotFound')}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/categorias')}
          sx={{ mt: 2 }}
        >
          {t('categories.backToCategories')}
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/categorias')}>
          {t('categories.backToCategories')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/categorias/editar/${id}`)}
        >
          {t('categories.editCategory')}
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {`${categoria?.id_categoria ?? categoria?.id ?? ''}${(categoria?.id_categoria || categoria?.id) ? ' - ' : ''}${categoria?.nombre ?? ''}`}
      </Typography>

      {/* (SLA moved to the bottom per request) */}

  <Grid container spacing={4}>
        {/* Etiquetas */}
  <Grid item xs={12} md={6} sx={{ pr: { md: 2 } }}>
          <Card sx={{ height: '100%', border: '1px solid rgba(0,0,139,0.9)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LabelIcon sx={{ mr: 1, color: 'rgba(0,0,139,0.9)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('categories.tags')}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {(() => {
                // Obtener lista de etiquetas desde distintos posibles campos devueltos por la API
                const etiquetasList = categoria?.etiquetas || categoria?.etiquetas_list || categoria?.tags || categoria?.categoria_etiquetas || [];
                // Ordenar ascendentemente por ID (defensivo ante distintos nombres de campo)
                const sortedEtiquetas = Array.isArray(etiquetasList)
                  ? etiquetasList.slice().sort((a, b) => {
                      const idA = Number(a?.id_etiqueta ?? a?.id ?? a?.idEtiqueta ?? 0);
                      const idB = Number(b?.id_etiqueta ?? b?.id ?? b?.idEtiqueta ?? 0);
                      return idA - idB;
                    })
                  : [];
                if (sortedEtiquetas.length > 0) {
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {sortedEtiquetas.map((etiqueta) => {
                        const id = etiqueta?.id_etiqueta ?? etiqueta?.id ?? etiqueta?.idEtiqueta ?? etiqueta?.categoria ?? etiqueta?.id_categoria;
                        const label = etiqueta?.nombre ?? etiqueta?.etiqueta ?? etiqueta?.label ?? etiqueta?.nombre_etiqueta ?? '';

                        return (
                          <Card key={id ?? label} sx={{ p: 0, border: '1px solid rgba(0,0,139,0.9)', bgcolor: 'white', color: 'text.primary', minHeight: 75,minWidth : 425 }}>
                            <CardContent sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="subtitle1" align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>{`${id ?? ''}${id ? ' - ' : ''}${label}`}</Typography>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  );
                }
                return (
                  <Typography variant="body2" color="text.secondary">
                    {t('categories.noTagsAssociated')}
                  </Typography>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Especialidades */}
        <Grid item xs={12} md={6} sx={{ pl: { md: 2 } }}>
          <Card sx={{ height: '100%', border: '1px solid rgba(0,0,139,0.9)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EngineeringIcon sx={{ mr: 1, color: 'rgba(0,0,139,0.9)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('categories.specialties')}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {(() => {
                const especialidadesList = categoria?.especialidades || [];
                const sortedEspecialidades = Array.isArray(especialidadesList)
                  ? especialidadesList.slice().sort((a, b) => {
                      const idA = Number(a?.id_especialidad ?? a?.id ?? a?.idEspecialidad ?? 0);
                      const idB = Number(b?.id_especialidad ?? b?.id ?? b?.idEspecialidad ?? 0);
                      return idA - idB;
                    })
                  : [];

                if (sortedEspecialidades.length > 0) {
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {sortedEspecialidades.map((esp) => {
                        const espId = esp?.id_especialidad ?? esp?.id ?? esp?.idEspecialidad;
                        const espName = esp?.nombre ?? esp?.especialidad ?? esp?.nombre_especialidad ?? '';
                        return (
                          <Card key={espId ?? espName} sx={{ p: 0, border: '1px solid rgba(0,0,139,0.9)', bgcolor: 'white', color: 'text.primary', minHeight: 75,minWidth : 400 }}>
                            <CardContent sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="subtitle1" align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>{`${espId ?? ''}${espId ? ' - ' : ''}${espName}`}</Typography>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  );
                }

                return (
                <Typography variant="body2" color="text.secondary">
                  {t('categories.noSpecialtiesAssociated')}
                </Typography>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información del SLA (movida al final, con fondo blanco y borde azul oscuro) */}
      <Card sx={{ mt: 4, border: '1px solid rgba(0,0,139,0.9)', bgcolor: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TimerIcon sx={{ mr: 1, color: 'rgba(0,0,139,0.9)' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {`${categoria?.id_sla ?? ''}${(categoria?.id_sla) ? ' - ' : ''}${categoria?.sla_nombre ?? 'SLA'}`}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mb: 1, color: 'text.primary' }}>
                <strong>{t('categories.slaLevel')}:</strong> {`${categoria?.id_sla ?? ''}${(categoria?.id_sla) ? ' - ' : ''}${categoria.sla_nombre ?? ''}`}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid rgba(0,0,139,0.9)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('categories.responseTime')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {categoria.tiempo_respuesta_min} - {categoria.tiempo_respuesta_max} {t('categories.hours')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid rgba(0,0,139,0.9)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('categories.resolutionTime')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {categoria.tiempo_resolucion_min} - {categoria.tiempo_resolucion_max} {t('categories.hours')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CategoriaDetalle;
