import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Autocomplete,
  Divider,
  Chip,
  Fade,
  Breadcrumbs,
  Link,
  FormControl,
  Card,
  CardMedia,
  CardActions,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageService from '../../services/ImageService';
import SuccessOverlay from '../common/SuccessOverlay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { getApiOrigin } from '../../utils/apiBase';
import { formatDate } from '../../utils/format';

export default function EditTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiBase = useMemo(() => `${getApiOrigin()}/apiticket`, []);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [success, setSuccess] = useState('');

  const [prioridades, setPrioridades] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [categoriaPreview, setCategoriaPreview] = useState(null);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    id_usuario: '',
    id_etiqueta: '',
    id_estado: '',
    estado: ''
  });
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [fechaCreacion, setFechaCreacion] = useState('');
  const [touched, setTouched] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  const errors = {
    titulo: !form.titulo?.trim() 
      ? 'El título es requerido' 
      : form.titulo.trim().length < 5 
      ? 'El título debe tener al menos 5 caracteres' 
      : form.titulo.trim().length > 200 
      ? 'El título no puede exceder 200 caracteres' 
      : '',
    descripcion: !form.descripcion?.trim() 
      ? 'La descripción es requerida' 
      : form.descripcion.trim().length < 10 
      ? 'La descripción debe tener al menos 10 caracteres' 
      : form.descripcion.trim().length > 1000 
      ? 'La descripción no puede exceder 1000 caracteres' 
      : '',
    id_etiqueta: !form.id_etiqueta ? 'Debe seleccionar una etiqueta' : '',
  };
  const isValid = !errors.titulo && !errors.descripcion && !errors.id_etiqueta;

  const prioridadColor = (p) => {
    switch (p) {
      case 'Alta': return 'error';
      case 'Media': return 'warning';
      case 'Baja': return 'info';
      default: return 'default';
    }
  };

  // Cargar imágenes del ticket
  const cargarImagenes = async () => {
    try {
      setLoadingImages(true);
      // Obtener imágenes del ticket por id_ticket
      const res = await axios.get(`${apiBase}/imagen/getByTicket/${id}`);
      setImagenes(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {
      console.error('Error al cargar imágenes:', e);
    } finally {
      setLoadingImages(false);
    }
  };

  // Cargar datos del ticket y catálogos
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoadingData(true);
        setLoadError('');
        
        // Cargar ticket completo, prioridades, etiquetas y estados
        const [ticketRes, pRes, eRes, stRes] = await Promise.all([
          axios.get(`${apiBase}/ticket/getTicketCompletoById/${id}`, { signal: controller.signal }),
          axios.get(`${apiBase}/ticket/prioridades`, { signal: controller.signal }),
          axios.get(`${apiBase}/etiqueta`, { signal: controller.signal }),
          axios.get(`${apiBase}/estado`, { signal: controller.signal })
        ]);

        const ticketData = ticketRes.data;
        setPrioridades(Array.isArray(pRes.data) ? pRes.data : []);
        setEtiquetas(Array.isArray(eRes.data) ? eRes.data : (eRes.data?.data || []));
        setEstados(Array.isArray(stRes.data) ? stRes.data : (stRes.data?.data || []));

        if (ticketData) {
          // Precargar datos del ticket
          setForm({
            titulo: ticketData.titulo || '',
            descripcion: ticketData.descripcion || '',
            prioridad: ticketData.prioridad || 'Media',
            id_usuario: ticketData.id_usuario || '',
            id_etiqueta: ticketData.etiquetas?.[0]?.id_etiqueta || ticketData.id_etiqueta || '',
            id_estado: ticketData.id_estado || '',
            estado: ticketData.estado?.nombre || ticketData.nombre_estado || 'Pendiente'
          });

          // Usuario solicitante
          if (ticketData.usuario) {
            setUsuarioInfo({
              id: ticketData.usuario.id_usuario || ticketData.id_usuario,
              nombre: ticketData.usuario.nombre || 'Usuario',
              correo: ticketData.usuario.correo || '—'
            });
          }

          // Fecha de creación
          if (ticketData.fecha_creacion) {
            setFechaCreacion(ticketData.fecha_creacion);
          }

          // Categoría preview
          if (ticketData.categoria) {
            setCategoriaPreview({
              id_categoria: ticketData.categoria.id_categoria,
              nombre: ticketData.categoria.nombre
            });
          }
        }

        // Cargar imágenes
        await cargarImagenes();
        setLoadingData(false);
      } catch (e) {
        if (e.name !== 'AbortError' && e.code !== 'ERR_CANCELED') {
          console.error('Error al cargar datos:', e);
          setLoadError('Error al cargar los datos del tiquete');
          setLoadingData(false);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [apiBase, id]);

  // Al elegir etiqueta, obtenemos la categoría asociada
  useEffect(() => {
    const controller = new AbortController();
    async function fetchCategoria() {
      setCategoriaPreview(null);
      if (!form.id_etiqueta) return;
      try {
        const res = await axios.get(`${apiBase}/categoria_ticket/getCategoriaByEtiqueta/${form.id_etiqueta}`, { signal: controller.signal });
        const cat = res?.data || null;
        if (cat?.id_categoria) {
          setCategoriaPreview({ id_categoria: cat.id_categoria, nombre: cat.nombre });
        }
      } catch (e) {
        // silencioso
      }
    }
    fetchCategoria();
    return () => controller.abort();
  }, [form.id_etiqueta, apiBase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const markTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));

  const handleChangeImage = (e) => {
    if (e.target.files) {
      setFileURL(
        URL.createObjectURL(e.target.files[0], e.target.files[0].name)
      );
      setFile(e.target.files[0], e.target.files[0].name);
    }
  };

  const handleUploadImage = async () => {
    if (!file) {
      toast.error('Seleccione una imagen primero', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticket_id', id);
      
      const imageRes = await ImageService.createImage(formData);
      if (imageRes.data?.success) {
        toast.success('Imagen subida exitosamente', {
          duration: 3000,
          position: 'top-center'
        });
        setFile(null);
        setFileURL(null);
        cargarImagenes();
      }
    } catch (imageError) {
      console.error('Error al subir imagen:', imageError);
      toast.error('No se pudo subir la imagen', {
        duration: 3000,
        position: 'top-center'
      });
    }
  };

  const handleDeleteImage = async (idImagen) => {
    // Solo marcar para eliminar, no eliminar ahora
    setImagenesAEliminar([...imagenesAEliminar, idImagen]);
    setImagenes(imagenes.filter(img => img.id_imagen !== idImagen));
    toast.success('Imagen marcada para eliminar', {
      duration: 2000,
      position: 'top-center'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setSnackbar({ open: true, message: 'Por favor complete todos los campos requeridos correctamente', severity: 'warning' });
      setTouched({ titulo: true, descripcion: true, id_etiqueta: true });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.put(`${apiBase}/ticket`, {
        id_ticket: parseInt(id),
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        id_etiqueta: form.id_etiqueta ? Number(form.id_etiqueta) : undefined,
        id_estado: form.id_estado ? Number(form.id_estado) : undefined
      });

      // Eliminar imágenes marcadas
      if (imagenesAEliminar.length > 0) {
        for (const idImagen of imagenesAEliminar) {
          try {
            await axios.delete(`${apiBase}/imagen/${idImagen}`);
          } catch (deleteError) {
            console.error('Error al eliminar imagen:', deleteError);
          }
        }
        setImagenesAEliminar([]);
      }

      // Subir imagen si fue seleccionada
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('ticket_id', id);
          
          const imageRes = await ImageService.createImage(formData);
          if (imageRes.data?.success) {
            toast.success('Imagen subida exitosamente', {
              duration: 3000,
              position: 'top-center'
            });
            setFile(null);
            setFileURL(null);
            cargarImagenes();
          }
        } catch (imageError) {
          console.error('Error al subir imagen:', imageError);
          toast.error('Tiquete actualizado pero no se pudo subir la imagen', {
            duration: 3000,
            position: 'top-center'
          });
        }
      }

      const successMessage = `✓ Tiquete #${id} actualizado exitosamente`;
      setSuccess(successMessage);
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      setShowSuccessOverlay(true);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Error al actualizar el tiquete';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>Cargando datos del tiquete...</Typography>
        </Box>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
        <Button variant="outlined" onClick={() => navigate('/tickets')}>Volver a tiquetes</Button>
      </Container>
    );
  }

  return (
    <>
    <Container maxWidth="lg" sx={{ py: 5, position: 'relative' }}>
      {/* Breadcrumb */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ mb: 2 }}
      >
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Inicio
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/mantenimientos'); }}
        >
          Mantenimientos
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate(`/tickets/${id}`); }}
        >
          Ticket #{id}
        </Link>
        <Typography color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <EditIcon fontSize="small" />
          Editar
        </Typography>
      </Breadcrumbs>

      {/* Encabezado */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Editar Tiquete #{id}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Actualice la información del tiquete
          </Typography>
        </Box>
        <Button variant="text" onClick={() => navigate(`/tickets/${id}`)} startIcon={<ArrowBackIcon />}>Volver</Button>
      </Box>

      {/* Formulario principal */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderTop: 4,
          borderTopColor: 'warning.main',
        }}
      >
        {/* Ribbon Prioridad */}
        <Chip
          label={`Prioridad: ${form.prioridad}`}
          color={prioridadColor(form.prioridad)}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 600 }}
          icon={<FlagOutlinedIcon />}
        />

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Título del Tiquete"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                onBlur={() => markTouched('titulo')}
                required
                error={Boolean(touched.titulo && errors.titulo)}
                helperText={touched.titulo && errors.titulo || 'Resuma el problema en 5-200 caracteres'}
                placeholder="Ej: Error al iniciar sesión"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Prioridad"
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                InputProps={{ startAdornment: <FlagOutlinedIcon sx={{ mr: 1, color: prioridadColor(form.prioridad) + '.main' }} /> }}
              >
                {prioridades.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Estado"
                name="id_estado"
                value={form.id_estado}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <FlagOutlinedIcon sx={{ mr: 1, color: 'info.main' }} />
                }}
              >
                {estados.map((est) => (
                  <MenuItem key={est.id_estado} value={est.id_estado}>{est.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Descripción del Problema"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={() => markTouched('descripcion')}
                required
                error={Boolean(touched.descripcion && errors.descripcion)}
                helperText={touched.descripcion && errors.descripcion || 'Describa detalladamente el problema (10-1000 caracteres)'}
                placeholder="Explique el problema con el mayor detalle posible, incluyendo cuándo ocurrió, qué estaba haciendo, mensajes de error, etc."
                InputProps={{
                  startAdornment: <DescriptionOutlinedIcon sx={{ mr: 1, color: 'primary.main' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={etiquetas}
                loading={etiquetas.length === 0}
                getOptionLabel={(opt) => {
                  if (!opt) return '';
                  const obj = typeof opt === 'object' ? opt : etiquetas.find((e) => String(e.id_etiqueta) === String(opt)) || {};
                  const id = obj.id_etiqueta ?? obj.id ?? '';
                  const name = obj.nombre ?? obj.label ?? obj.etiqueta ?? '';
                  return name ? `${id} - ${name}` : String(id ?? '');
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id_etiqueta ?? option.id} style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 1 }}>
                      <LabelOutlinedIcon sx={{ color: 'primary.main', flexShrink: 0, mt: 0.5 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {`${option.id_etiqueta ?? option.id} - ${option.nombre ?? option.label ?? ''}`}
                      </Typography>
                    </Box>
                  </li>
                )}
                ListboxProps={{
                  style: { maxHeight: '400px' }
                }}
                slotProps={{
                  paper: {
                    sx: {
                      width: '600px',
                      maxWidth: '90vw',
                      '& .MuiAutocomplete-listbox': {
                        '& .MuiAutocomplete-option': {
                          minHeight: '56px',
                          alignItems: 'flex-start'
                        }
                      }
                    }
                  }
                }}
                onChange={(_, val) => setForm((f) => ({ ...f, id_etiqueta: val?.id_etiqueta || '' }))}
                renderInput={(params) => {
                  const selectedEtiqueta = etiquetas.find((e) => String(e.id_etiqueta) === String(form.id_etiqueta));
                  const displayText = selectedEtiqueta 
                    ? `${selectedEtiqueta.id_etiqueta} - ${selectedEtiqueta.nombre || ''}`
                    : '';
                  
                  return (
                    <TextField
                      {...params}
                      label="Etiqueta"
                      required
                      onBlur={() => markTouched('id_etiqueta')}
                      error={Boolean(touched.id_etiqueta && errors.id_etiqueta)}
                      helperText={touched.id_etiqueta && errors.id_etiqueta || (displayText ? displayText : '')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <LabelOutlinedIcon sx={{ mr: 1, color: 'primary.main' }} />
                      }}
                    />
                  );
                }}
                value={etiquetas.find((e) => String(e.id_etiqueta) === String(form.id_etiqueta)) || null}
                isOptionEqualToValue={(o, v) => String(o.id_etiqueta) === String(v.id_etiqueta)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Tooltip title="Se deriva automáticamente según la etiqueta elegida" placement="top">
                <TextField
                  fullWidth
                  label="Categoría (derivada)"
                  value={categoriaPreview ? `${categoriaPreview.id_categoria} - ${categoriaPreview.nombre}` : ''}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <CategoryOutlinedIcon sx={{ mr: 1, color: categoriaPreview ? 'success.main' : 'text.disabled' }} />
                  }}
                  placeholder="Se mostrará al elegir una etiqueta"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Usuario solicitante"
                value={usuarioInfo ? usuarioInfo.nombre : ''}
                InputProps={{
                  readOnly: true,
                  startAdornment: <PersonOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                }}
                helperText={usuarioInfo?.correo ? usuarioInfo.correo : ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de creación"
                value={fechaCreacion ? formatDate(new Date(fechaCreacion)) : ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Imágenes del Tiquete</Typography>
              
              {/* Seleccionar nueva imagen */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                  <TextField
                    type="file"
                    label="Agregar imagen"
                    inputProps={{ accept: 'image/*' }}
                    onChange={handleChangeImage}
                    InputLabelProps={{ shrink: true }}
                    helperText="(Opcional) Adjunte una imagen. Se guardará al guardar el tiquete."
                  />
                </FormControl>
                {fileURL && (
                  <Box sx={{ mt: 2 }}>
                    <img src={fileURL} alt="preview" width={150} style={{ borderRadius: '8px' }} />
                  </Box>
                )}
              </Paper>

              {/* Galería de imágenes existentes */}
              {loadingImages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : imagenes.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                  {imagenes.map((img) => (
                    <Card key={img.id_imagen} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={`${getApiOrigin()}/apiticket/uploads/${img.imagen}`}
                        alt="ticket"
                        sx={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%" y="50%" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="central"%3ENo disponible%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <CardActions sx={{ p: 1, justifyContent: 'center', flexShrink: 0 }}>
                        <Tooltip title="Eliminar imagen">
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteImage(img.id_imagen)}
                            fullWidth
                          >
                            Eliminar
                          </Button>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No hay imágenes asociadas a este ticket
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Fade in timeout={500}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="warning"
                    disabled={loading || !isValid}
                    startIcon={!loading ? <SaveRoundedIcon /> : null}
                    sx={{ minWidth: 180, fontWeight: 600 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Actualizar Tiquete'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate(`/tickets/${id}`)}
                    startIcon={<CancelRoundedIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <SuccessOverlay
        open={showSuccessOverlay}
        mode="update"
        entity="Tiquete"
        onClose={() => setShowSuccessOverlay(false)}
        subtitle={success || `✓ Tiquete #${id} actualizado exitosamente`}
        actions={[
          { label: 'Ver detalle', onClick: () => navigate(`/tickets/${id}`), variant: 'contained', color: 'warning' },
          { label: 'Ir al listado', onClick: () => navigate('/'), variant: 'outlined', color: 'warning' }
        ]}
      />
    </Container>
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        severity={snackbar.severity} 
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))} 
        variant="filled"
        sx={{ width: '100%', fontSize: '1rem', fontWeight: 500 }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
}
