import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
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
import DeleteIcon from '@mui/icons-material/Delete';
import { getApiOrigin } from '../../utils/apiBase';
import { formatDate } from '../../utils/format';

export default function CreateTicket() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apiBase = useMemo(() => `${getApiOrigin()}/apiticket`, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const [prioridades, setPrioridades] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Solo clientes filtrados
  const [allRoles, setAllRoles] = useState([]);
  const [clienteRolId, setClienteRolId] = useState(null);
  const [categoriaPreview, setCategoriaPreview] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    id_usuario: '',
    id_etiqueta: '',
    id_especialidad: ''
  });
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [fechaCreacion] = useState(() => new Date());
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);

  const errors = {
    titulo: !form.titulo?.trim() 
      ? t('createTicketForm.titleRequired') 
      : form.titulo.trim().length < 5 
      ? t('createTicketForm.shortTitle') 
      : form.titulo.trim().length > 200 
      ? t('createTicketForm.longTitle') 
      : '',
    descripcion: !form.descripcion?.trim() 
      ? t('createTicketForm.descriptionRequired') 
      : form.descripcion.trim().length < 10 
      ? t('createTicketForm.shortDescription') 
      : form.descripcion.trim().length > 1000 
      ? t('createTicketForm.longDescription') 
      : '',
    id_etiqueta: !form.id_etiqueta ? t('createTicketForm.selectTag') : '',
    id_usuario: !form.id_usuario ? t('createTicketForm.selectUser') : '',
  };
  const isValid = !errors.titulo && !errors.descripcion && !errors.id_etiqueta && !errors.id_usuario;

  const prioridadColor = (p) => {
    switch (p) {
      case 'Alta': return 'error';
      case 'Media': return 'warning';
      case 'Baja': return 'info';
      default: return 'default';
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setError('');
        // Cargar prioridades, etiquetas y usuarios
        const [pRes, eRes, usersRes, rolesRes] = await Promise.all([
          axios.get(`${apiBase}/ticket/prioridades`, { signal: controller.signal }),
          axios.get(`${apiBase}/etiqueta`, { signal: controller.signal }),
          axios.get(`${apiBase}/usuario`, { signal: controller.signal }),
          axios.get(`${apiBase}/rol`, { signal: controller.signal })
        ]);
        setPrioridades(Array.isArray(pRes.data) ? pRes.data : []);
        setEtiquetas(Array.isArray(eRes.data) ? eRes.data : (eRes.data?.data || []));
        const rawUsuarios = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
        const roles = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []);
        setAllRoles(roles);
        const clienteRol = roles.find(r => (r.descripcion || '').toLowerCase() === 'cliente');
        const assumedClienteId = clienteRol ? clienteRol.id_rol : 3; // fallback a 3 si no se encuentra
        setClienteRolId(assumedClienteId);
        const filtrados = rawUsuarios.filter(u => String(u.id_rol) === String(assumedClienteId));
        setUsuarios(filtrados);
      } catch (e) {
        if (e.name !== 'AbortError' && e.code !== 'ERR_CANCELED') {
          setError(e.response?.data?.error || e.message || 'Error al cargar datos iniciales');
        }
      }
    }
    load();
    return () => controller.abort();
  }, [apiBase]);

  // Cargar información del usuario cuando se selecciona
  useEffect(() => {
    if (usuarioSeleccionado) {
      setUsuarioInfo({
        id: usuarioSeleccionado.id_usuario,
        nombre: usuarioSeleccionado.nombre,
        correo: usuarioSeleccionado.correo
      });
      setForm(f => ({ ...f, id_usuario: usuarioSeleccionado.id_usuario }));
    } else {
      setUsuarioInfo(null);
      setForm(f => ({ ...f, id_usuario: '' }));
    }
  }, [usuarioSeleccionado]);

  // Al elegir etiqueta, obtenemos la categoría asociada para mostrarla (optimizado vía endpoint directo)
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
            // cargar especialidades relacionadas y ordenarlas ascendente por id
            try {
              const espRes = await axios.get(`${apiBase}/categoria_ticket/getEspecialidades/${cat.id_categoria}`, { signal: controller.signal });
              const list = Array.isArray(espRes.data) ? espRes.data : (espRes.data?.data || []);
              list.sort((a, b) => (Number(a.id_especialidad ?? a.id ?? 0) - Number(b.id_especialidad ?? b.id ?? 0)));
              setEspecialidades(list);
            } catch (e) {
              setEspecialidades([]);
            }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setSnackbar({ open: true, message: t('createTicketForm.formIncomplete'), severity: 'warning' });
      setTouched({ titulo: true, descripcion: true, id_etiqueta: true, id_usuario: true });
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${apiBase}/ticket`, {
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        id_usuario: form.id_usuario,
        id_etiqueta: form.id_etiqueta ? Number(form.id_etiqueta) : undefined,
        id_especialidad: form.id_especialidad ? Number(form.id_especialidad) : undefined
      });
      const created = res?.data;
      const idTicket = created?.id_ticket;
      if (!idTicket) {
        throw new Error('No se recibió el ID del ticket creado');
      }

      // Gestionar imagen si fue seleccionada
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ticket_id', idTicket);
        
        try {
          const imageRes = await ImageService.createImage(formData);
          if (imageRes.data?.success) {
            toast.success('Imagen subida exitosamente', {
              duration: 3000,
              position: 'top-center'
            });
          }
        } catch (imageError) {
          console.error('Error al subir imagen:', imageError);
          toast.error('No se pudo subir la imagen', {
            duration: 3000,
            position: 'top-center'
          });
        }
      }

      const successMessage = `✓ Ticket #${idTicket} creado exitosamente`;
      setCreatedId(idTicket);
      setSuccess(successMessage);
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      setShowSuccessOverlay(true);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Error al crear el ticket';
      setError(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Container maxWidth="lg" sx={{ py: 5, position: 'relative' }}>
      {/* Encabezado estilizado */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Crear Nuevo Ticket</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Complete el formulario para registrar su solicitud
          </Typography>
        </Box>
  <Button variant="text" onClick={() => navigate('/mantenimientos')} startIcon={<ArrowBackIcon />}>Volver</Button>
      </Box>

      {/* Formulario principal */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f9ff 60%)',
          border: '1px solid #e0e7ef',
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
                label="Título del Ticket"
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
                fullWidth
                label="Estado"
                value="Pendiente"
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: <FlagOutlinedIcon sx={{ mr: 1, color: 'info.main' }} />
                }}
                helperText="Pendiente Estado inicial"
              />
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
                // Mostrar texto completo de la etiqueta; si no hay nombre, mostrar solo id
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
              <Autocomplete
                options={especialidades}
                getOptionLabel={(opt) => {
                  if (!opt) return '';
                  const obj = typeof opt === 'object' ? opt : especialidades.find((e) => String(e.id_especialidad) === String(opt)) || {};
                  const id = obj.id_especialidad ?? obj.id ?? '';
                  const name = obj.nombre ?? obj.especialidad ?? '';
                  return name ? `${id} - ${name}` : String(id ?? '');
                }}
                onChange={(_, val) => setForm((f) => ({ ...f, id_especialidad: val?.id_especialidad || '' }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Especialidad (opcional)"
                    helperText={categoriaPreview ? 'Seleccione la especialidad relacionada a la categoría' : 'Se mostrará al elegir una etiqueta/categoría'}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                    }}
                  />
                )}
                value={especialidades.find((e) => String(e.id_especialidad) === String(form.id_especialidad)) || null}
                isOptionEqualToValue={(o, v) => String(o.id_especialidad) === String(v.id_especialidad)}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={usuarios}
                loading={usuarios.length === 0 && !error}
                getOptionLabel={(opt) => {
                  if (!opt) return '';
                  return opt.nombre || '';
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id_usuario}>
                    <Typography variant="body2">
                      {option.nombre}
                    </Typography>
                  </li>
                )}
                onChange={(_, val) => setUsuarioSeleccionado(val)}
                value={usuarioSeleccionado}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Usuario Solicitante"
                    required
                    onBlur={() => markTouched('id_usuario')}
                    error={Boolean(touched.id_usuario && errors.id_usuario)}
                    helperText={
                      touched.id_usuario && errors.id_usuario
                        || `Clientes`
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                    }}
                  />
                )}
                isOptionEqualToValue={(o, v) => o.id_usuario === v.id_usuario}
                noOptionsText={clienteRolId ? 'No hay usuarios con rol Cliente disponibles' : 'Cargando roles...'}
              />
            </Grid>

            {usuarioInfo && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ID Usuario"
                    value={usuarioInfo.id || ''}
                    InputProps={{ readOnly: true }}
                    helperText="Identificador único del usuario"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    value={usuarioInfo.correo || ''}
                    InputProps={{ readOnly: true }}
                    helperText="Correo del usuario solicitante"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Fecha de creación"
                    value={formatDate(fechaCreacion)}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            )}

            {!usuarioInfo && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de creación"
                  value={formatDate(fechaCreacion)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <TextField
                  type="file"
                  label="Imagen del Ticket"
                  inputProps={{ accept: 'image/*' }}
                  onChange={handleChangeImage}
                  InputLabelProps={{ shrink: true }}
                  helperText="(Opcional) Adjunte una imagen relacionada con el problema"
                />
              </FormControl>
              {fileURL && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                  <Box>
                    <img src={fileURL} alt="preview" width={300} style={{ borderRadius: '8px', maxWidth: '100%' }} />
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setFile(null);
                      setFileURL(null);
                    }}
                    size="small"
                  >
                    Borrar imagen
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Fade in timeout={500}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !isValid}
                    startIcon={!loading ? <SaveRoundedIcon /> : null}
                    sx={{ minWidth: 180, fontWeight: 600 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Guardar Ticket'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    // Redirigir a Inicio en lugar del listado de tickets
                    onClick={() => navigate('/', { replace: true })}
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
        mode="create"
        entity="Ticket"
        variant="extended"
        details={{
          id: createdId,
          prioridad: form.prioridad,
          categoria: categoriaPreview?.nombre,
          etiqueta: etiquetas.find(e => String(e.id_etiqueta) === String(form.id_etiqueta))?.nombre,
          especialidad: especialidades.find(es => String(es.id_especialidad) === String(form.id_especialidad))?.nombre,
          extra: [
            usuarioInfo ? { label: 'Solicitante', value: usuarioInfo.nombre } : null,
            usuarioInfo ? { label: 'Correo', value: usuarioInfo.correo } : null,
            form.descripcion ? { label: 'Resumen', value: (form.descripcion.length > 60 ? form.descripcion.slice(0,57)+'…' : form.descripcion) } : null
          ].filter(Boolean)
        }}
        onClose={() => setShowSuccessOverlay(false)}
        subtitle={success || undefined}
        actions={[
          { label: 'Crear otro', onClick: () => { setShowSuccessOverlay(false); setForm({ titulo:'', descripcion:'', prioridad:'Media', id_usuario:'', id_etiqueta:'' }); setUsuarioSeleccionado(null); }, variant: 'contained', color: 'success' },
          { label: 'Ver detalle', onClick: () => { if (createdId) navigate(`/tickets/${createdId}`); }, variant: 'outlined', color: 'success' },
          { label: 'Ir al listado', onClick: () => { navigate('/'); }, variant: 'outlined', color: 'success' }
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
