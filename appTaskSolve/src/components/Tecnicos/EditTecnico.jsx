import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box, Grid, Paper, Divider, Typography, FormControl, TextField, MenuItem, InputAdornment, Button, Snackbar, Alert, Autocomplete, CircularProgress, Breadcrumbs, Link, Checkbox, Chip,
} from '@mui/material';
import SuccessOverlay from '../common/SuccessOverlay';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SecurityIcon from '@mui/icons-material/Security';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import WorkIcon from '@mui/icons-material/Work';
import TecnicoService from '../../services/TecnicoService';

const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || 'http://localhost:81';

// Schema de validación (password opcional en edición)
const schema = yup.object({
  id_usuario: yup.string()
    .required('La cédula es requerida')
    .matches(/^[0-9]-[0-9]{4}-[0-9]{4}$/, 'Formato inválido. Use: #-####-####'),
  nombre: yup.string()
    .required('El nombre completo es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras y espacios')
    .test('dos-palabras', 'Debe ingresar nombre y apellido (mínimo 2 palabras)', value => {
      if (!value) return false;
      const palabras = value.trim().split(/\s+/);
      return palabras.length >= 2 && palabras.every(p => p.length > 0);
    }),
  correo: yup.string()
    .required('El correo electrónico es requerido')
    .email('Debe ser un correo electrónico válido')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato de correo inválido'),
  password: yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres')
    .optional(),
  confirm_password: yup.string().when('password', (pw, schema) => (
    pw ? schema.required('Confirme la contraseña').oneOf([yup.ref('password')], 'Las contraseñas deben coincidir') : schema
  )),
  disponibilidad: yup.boolean().required('Debe seleccionar la disponibilidad'),
  especialidades: yup.array().of(yup.object()).required('Debe seleccionar al menos una especialidad'),
  carga_trabajo: yup.number().min(0, 'La carga debe ser 0 o mayor').optional(),
});

export default function EditTecnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      id_rol: 0, id_usuario: '', nombre: '', correo: '', password: '', confirm_password: '', disponibilidad: true, especialidades: [], carga_trabajo: 0,
    }, resolver: yupResolver(schema),
  });
  const pwd = watch('password');
  const pwdConfirm = watch('confirm_password');
  const passwordsMatch = pwdConfirm === '' ? null : pwd === pwdConfirm;
  const [especialidades, setEspecialidades] = useState([]);
  const [roles, setRoles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [successOpen, setSuccessOpen] = useState(false);
  const [openEsp, setOpenEsp] = useState(false);

  // Ordenar roles por ID ascendente
  const sortedRoles = (roles || []).slice().sort((a, b) => {
    const ai = a?.id_rol;
    const bi = b?.id_rol;
    if (ai != null && bi != null) return Number(ai) - Number(bi);
    if (ai != null) return -1;
    if (bi != null) return 1;
    return 0;
  });

  const sortedEspecialidades = (especialidades || []).slice().sort((a, b) => {
    const ai = a?.id_especialidad;
    const bi = b?.id_especialidad;
    if (ai != null && bi != null) return Number(ai) - Number(bi);
    if (ai != null) return -1;
    if (bi != null) return 1;
    return 0;
  });

  // Cargar datos del técnico y catálogos
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // Cargar catálogos, roles y datos del técnico en paralelo
        const [espRes, rolesRes, tecnicoRes] = await Promise.all([
          fetch(`${apiBase}/apiticket/especialidad`),
          fetch(`${apiBase}/apiticket/rol`),
          TecnicoService.getTecnicoById(id),
        ]);

        const especialidadesData = await espRes.json();
        const rolesData = await rolesRes.json();
        
        // La respuesta de axios viene en tecnicoRes.data
        // Verificar si la respuesta es un array o un objeto directo
        const tecnicoData = Array.isArray(tecnicoRes.data) 
          ? (tecnicoRes.data.length > 0 ? tecnicoRes.data[0] : null)
          : tecnicoRes.data;

        if (!isMounted) return;

        setEspecialidades(especialidadesData);
        setRoles(rolesData || []);

        // Verificar si se encontró el técnico
        if (!tecnicoData) {
          setLoadError('No se encontró el técnico');
          setLoading(false);
          return;
        }

        // Precargar datos del técnico en el formulario
        if (tecnicoData) {
          // Obtener todas las especialidades (selección múltiple)
          const especialidadesTecnico = Array.isArray(tecnicoData.especialidades) && tecnicoData.especialidades.length > 0
            ? tecnicoData.especialidades
            : [];

          // Obtener info del usuario para obtener rol
          let userRole = 0;
          try {
            const userRes = await fetch(`${apiBase}/apiticket/usuario/${tecnicoData.id_usuario}`);
            const userData = await userRes.json();
            // userData puede ser objeto o array
            const u = Array.isArray(userData) ? (userData[0] || null) : userData;
            if (u && (u.id_rol || u.id_rol === 0)) userRole = u.id_rol;
          } catch (e) {
            // ignore
          }

          reset({
            id_rol: userRole || 0,
            id_usuario: tecnicoData.id_usuario || '',
            nombre: tecnicoData.nombre_usuario || tecnicoData.nombre || '',
            correo: tecnicoData.correo_usuario || tecnicoData.correo || '',
            password: '', // Dejar vacío en edición
            disponibilidad: tecnicoData.disponibilidad === 1 || tecnicoData.disponibilidad === true,
            especialidades: especialidadesTecnico,
            carga_trabajo: tecnicoData.carga_trabajo || 0,
          });
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        if (isMounted) {
          setLoadError('Error al cargar los datos del técnico');
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [id, reset]);

  const onSubmit = async (v) => {
    try {
      const payload = {
        id_tecnico: parseInt(id),
        id_usuario: v.id_usuario,
        nombre: v.nombre,
        correo: v.correo,
        disponibilidad: v.disponibilidad ? 1 : 0,
        especialidades: (v.especialidades || []).map(e => e.id_especialidad),
      };

      // Solo incluir password si se proporcionó
      if (v.password && v.password.trim()) {
        payload.password = v.password;
      }

      const { data } = await TecnicoService.updateTecnico(payload);
      
      if (data?.id_tecnico || data) {
        setSuccessOpen(true);
      } else {
        setSnackbar({ open: true, message: 'Respuesta inválida del servidor', severity: 'warning' });
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      setSnackbar({ open: true, message: err?.response?.data?.error || err?.message || 'Error al actualizar el técnico', severity: 'error' });
    }
  };

  const onError = () => setSnackbar({ open: true, message: 'Revisa los campos requeridos', severity: 'warning' });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
        <Button variant="outlined" onClick={() => navigate('/tecnicos')}>Volver al listado</Button>
      </Box>
    );
  }

  return (
    <>
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
          onClick={(e) => { e.preventDefault(); navigate('/tecnicos'); }}
        >
          Técnicos
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate(`/tecnicos/${id}`); }}
        >
          Detalle
        </Link>
        <Typography color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <EditIcon fontSize="small" />
          Editar
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>Editar Técnico</Typography>
          <Typography variant="body2" color="text.secondary">Visualice y edite solo los campos permitidos</Typography>
        </Box>
        <Button variant="text" onClick={() => navigate(-1)}>&larr; Volver</Button>
      </Box>
      <Paper elevation={2} sx={{ p: 3, borderTop: 4, borderTopColor: 'primary.main', borderRadius: 2, bgcolor: 'background.paper', position: 'relative' }}>
        <SuccessOverlay
          open={successOpen}
          mode="update"
          entity="Técnico"
          subtitle={`✓ Técnico #${id} actualizado exitosamente`}
          onClose={() => setSuccessOpen(false)}
          actions={[
            { label: 'Ver detalle', onClick: () => { setSuccessOpen(false); navigate(`/tecnicos/${id}`); }, variant: 'contained', color: 'warning' },
            { label: 'Ir al listado', onClick: () => { setSuccessOpen(false); navigate('/tecnicos'); }, variant: 'outlined', color: 'warning' }
          ]}
        />
        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>Datos personales</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="id_rol" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_rol"
                    label="Rol"
                    select
                    value={field.value || 0}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    helperText={'Seleccione el rol del usuario'}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SecurityIcon color="action" /></InputAdornment>) }}
                    disabled
                  >
                    <MenuItem value={0}>-- Seleccionar Rol --</MenuItem>
                    {sortedRoles.map(role => (
                      <MenuItem key={role.id_rol} value={role.id_rol}>{role.descripcion}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="id_usuario" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="id_usuario" 
                    label="Cédula (ID Usuario)" 
                    placeholder="1-2345-6789" 
                    error={Boolean(errors.id_usuario)} 
                    helperText={errors.id_usuario ? errors.id_usuario.message : 'Campo de solo lectura - No editable'} 
                    InputProps={{ 
                      readOnly: true,
                      startAdornment: (<InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment>) 
                    }} 
                  />
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="nombre" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="nombre" 
                    label="Nombre Completo" 
                    placeholder="Juan Pérez González"
                    error={Boolean(errors.nombre)} 
                    helperText={errors.nombre ? errors.nombre.message : 'Campo de solo lectura - No editable'} 
                    InputProps={{ 
                      readOnly: true,
                      startAdornment: (<InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>) 
                    }} 
                  />
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="correo" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="correo" 
                    label="Correo Electrónico" 
                    type="email" 
                    error={Boolean(errors.correo)} 
                    helperText={errors.correo ? errors.correo.message : 'Ej: usuario@empresa.com'} 
                    placeholder="usuario@empresa.com" 
                    InputProps={{ 
                      startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>) 
                    }} 
                  />
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="password" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="password" 
                    label="Nueva Contraseña (opcional)" 
                    type="password" 
                    error={Boolean(errors.password)} 
                    helperText={errors.password ? errors.password.message : 'Dejar en blanco para mantener la contraseña actual'} 
                    InputProps={{ 
                      startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>) 
                    }} 
                  />
                )} />
              </FormControl>
            </Grid>

            {/* Confirmar contraseña */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="confirm_password" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="confirm_password"
                    label="Confirmar Contraseña"
                    type="password"
                    error={Boolean(errors.confirm_password) || (passwordsMatch === false)}
                    helperText={
                      errors.confirm_password ? errors.confirm_password.message
                        : (passwordsMatch === null ? 'Repita la contraseña' : (passwordsMatch ? 'Contraseñas coinciden' : 'Las contraseñas no coinciden'))
                    }
                    FormHelperTextProps={{ sx: { color: passwordsMatch === true ? 'success.main' : passwordsMatch === false ? 'error.main' : 'text.secondary' } }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>) }}
                    sx={{
                      '& .MuiInput-underline:after': { borderBottomColor: passwordsMatch === true ? 'success.main' : undefined },
                      '& .MuiInput-underline:before': { borderBottomColor: passwordsMatch === true ? 'success.light' : undefined },
                    }}
                  />
                )} />
              </FormControl>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>Datos técnicos</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="disponibilidad" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="disponibilidad" 
                    label="Estado de Disponibilidad" 
                    select 
                    value={field.value ? 'true' : 'false'} 
                    onChange={(e) => field.onChange(e.target.value === 'true')}
                    helperText={errors.disponibilidad ? errors.disponibilidad.message : 'Campo de solo lectura - No editable'}
                    InputProps={{ readOnly: true }}
                    disabled
                  >
                    <MenuItem value="true">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" /> Disponible
                      </Box>
                    </MenuItem>
                    <MenuItem value="false">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HighlightOffIcon color="warning" fontSize="small" /> No Disponible
                      </Box>
                    </MenuItem>
                  </TextField>
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="carga_trabajo" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="carga_trabajo" 
                    label="Carga Actual" 
                    type="number" 
                    value={field.value ?? 0}
                    InputProps={{ 
                      readOnly: true,
                      startAdornment: (<InputAdornment position="start"><AssignmentIcon color="action" /></InputAdornment>) 
                    }} 
                    helperText="Campo de solo lectura"
                    disabled
                  />
                )} />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="especialidades" control={control} render={({ field }) => (
                  <Autocomplete
                    multiple
                    id="especialidades"
                    options={sortedEspecialidades}
                    disableCloseOnSelect
                    getOptionLabel={(o) => o.nombre || ''}
                    value={field.value || []}
                    onChange={(_, newValue) => {
                      field.onChange(newValue || []);
                      setOpenEsp(false);
                    }}
                    renderTags={() => null}
                    isOptionEqualToValue={(o, v) => o.id_especialidad === v.id_especialidad}
                    open={openEsp}
                    onOpen={() => setOpenEsp(true)}
                    onClose={() => setOpenEsp(false)}
                    disableClearable={false}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <WorkIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {`${option.id_especialidad} - ${option.nombre}`}
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Especialidades"
                        placeholder="Seleccione especialidades"
                        error={Boolean(errors.especialidades)}
                        helperText={errors.especialidades ? errors.especialidades.message : `${(field.value || []).length} seleccionada(s)`}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (<InputAdornment position="start"><WorkIcon color="action" /></InputAdornment>)
                        }}
                      />
                    )}
                    ListboxProps={{
                      style: { maxHeight: 480 }
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          width: { xs: '90vw', sm: 520, md: 640 },
                          '& .MuiAutocomplete-listbox .MuiAutocomplete-option': {
                            alignItems: 'flex-start',
                            whiteSpace: 'normal',
                            lineHeight: 1.4,
                            py: 1.25
                          }
                        }
                      }
                    }}
                  />
                )} />
              </FormControl>
            </Grid>
          </Grid>

          {/* Card de Especialidades Seleccionadas - En Grid separado */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: (watch('especialidades') || []).length > 0 ? 'info.50' : 'grey.50',
                  border: '2px solid',
                  borderColor: (watch('especialidades') || []).length > 0 ? 'info.main' : 'grey.300',
                  p: 3,
                  minHeight: 120,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: (watch('especialidades') || []).length > 0 ? '0 4px 20px rgba(25, 118, 210, 0.15)' : '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon sx={{ color: (watch('especialidades') || []).length > 0 ? 'info.main' : 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Especialidades seleccionadas
                    </Typography>
                  </Box>
                  <Chip
                    label={(watch('especialidades') || []).length}
                    size="small"
                    color={(watch('especialidades') || []).length > 0 ? 'info' : 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {(watch('especialidades') || []).length > 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      maxHeight: 200,
                      overflowY: 'auto',
                      p: 1
                    }}
                  >
                    {(watch('especialidades') || []).map(esp => (
                      <Chip
                        key={esp.id_especialidad}
                        icon={<WorkIcon />}
                        label={`${esp.id_especialidad} - ${esp.nombre}`}
                        onDelete={() => {
                          const updated = (watch('especialidades') || []).filter(e => e.id_especialidad !== esp.id_especialidad);
                          const formVals = watch();
                          reset({ ...formVals, especialidades: updated });
                        }}
                        color="info"
                        variant="outlined"
                        sx={{
                          bgcolor: 'white',
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': {
                            color: 'error.main',
                            '&:hover': { color: 'error.dark' }
                          }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      No hay especialidades seleccionadas
                    </Typography>
                    <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 0.5 }}>
                      Seleccione especialidades usando el campo anterior
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" color="warning" startIcon={<SaveIcon />} sx={{ m: 0 }}>Actualizar Técnico</Button>
            <Button variant="outlined" onClick={() => navigate(`/tecnicos/${id}`)} sx={{ m: 0 }}>Cancelar</Button>
          </Box>
        </form>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} variant="filled" sx={{ width: '100%', fontSize: '1rem' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
