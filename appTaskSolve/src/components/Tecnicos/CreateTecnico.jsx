import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box, Grid, Paper, Divider, Typography, FormControl, TextField, MenuItem, InputAdornment, Button, Snackbar, Alert, Autocomplete, Checkbox, Chip,
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
import SecurityIcon from '@mui/icons-material/Security';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import WorkIcon from '@mui/icons-material/Work';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';

const apiBase = getApiOrigin();

const schema = yup.object({
  id_rol: yup.number()
    .min(1, 'Debe seleccionar un rol')
    .required('Debe seleccionar un rol'),
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
    .required('La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres'),
    
  confirm_password: yup.string().when('password', (password, schema) => {
  if (password && password.length > 0) {
    return schema.oneOf([yup.ref('password')], 'Las contraseñas deben coincidir');
  }
  return schema.nullable();
  }),
  
  disponibilidad: yup.boolean().nullable(),
  especialidades: yup.array().of(yup.object()).nullable(),
  carga_trabajo: yup.number(),
});

export default function CreateTecnico() {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm({
    defaultValues: {
      id_rol: 0,
      id_usuario: '',
      nombre: '',
      correo: '',
      password: '',
      confirm_password: '',
      disponibilidad: true,
      especialidades: [],
      carga_trabajo: 0,
    },
    resolver: yupResolver(schema),
  });

  const [roles, setRoles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedRol, setSavedRol] = useState(null);
  const [openEsp, setOpenEsp] = useState(false);
  
  const selectedRol = watch('id_rol');
  const isTecnico = selectedRol === 2;
  const pwd = watch('password');
  const pwdConfirm = watch('confirm_password');
  const passwordsMatch = pwdConfirm === '' ? null : pwd === pwdConfirm;

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

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const rolesRes = await fetch(`${apiBase}/apiticket/rol`, { signal: abort.signal });
        setRoles(await rolesRes.json());
        
        const espRes = await fetch(`${apiBase}/apiticket/especialidad`, { signal: abort.signal });
        setEspecialidades(await espRes.json());
      } catch (_) {}
    })();
    return () => abort.abort();
  }, []);

  const onSubmit = async (v) => {
    try {
      setLoading(true);

      // Si es admin/cliente, guardar usuario
      if (v.id_rol !== 2) {
        const payload = {
          id_usuario: v.id_usuario,
          nombre: v.nombre,
          correo: v.correo,
          password: v.password,
          id_rol: v.id_rol,
        };

        const res = await axios.post(`${apiBase}/apiticket/usuario`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (res?.data?.id_usuario) {
          setSavedRol(v.id_rol);
          setSuccessOpen(true);
          reset();
          window.scrollTo(0, 0);
        } else {
          setSnackbar({
            open: true,
            message: 'Respuesta inválida del servidor',
            severity: 'warning',
          });
        }
      } else {
        // Si es técnico, crear usuario + técnico + especialidades
        const especialidadesIds = (v.especialidades || []).map(e => e.id_especialidad);

        const payloadTec = {
          id_usuario: v.id_usuario,
          nombre: v.nombre,
          correo: v.correo,
          password: v.password,
          id_rol: 2,
          disponibilidad: !!v.disponibilidad,
          carga_trabajo: v.carga_trabajo ? Number(v.carga_trabajo) : 0,
          especialidades: especialidadesIds,
        };

        try {
          const res = await axios.post(`${apiBase}/apiticket/tecnico`, payloadTec, {
            headers: { 'Content-Type': 'application/json' }
          });
          if (res?.data?.id_tecnico) {
            setSavedRol(2);
            setSuccessOpen(true);
            reset({ id_rol: 0, id_usuario: '', nombre: '', correo: '', password: '', confirm_password: '', disponibilidad: true, especialidades: [], carga_trabajo: 0 });
            window.scrollTo(0, 0);
          } else {
            setSnackbar({ open: true, message: 'Respuesta inválida del servidor (técnico)', severity: 'warning' });
          }
        } catch (errTec) {
          setSnackbar({ open: true, message: errTec?.response?.data?.message || errTec?.message || 'Error al crear técnico', severity: 'error' });
        }
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Error al guardar',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onError = () => setSnackbar({ open: true, message: 'Revisa los campos requeridos', severity: 'warning' });

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>Crear Nuevo Usuario</Typography>
          <Typography variant="body2" color="text.secondary">Complete el formulario para registrar un nuevo usuario o técnico</Typography>
        </Box>
        <Button variant="text" onClick={() => navigate(-1)}>&larr; Volver</Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, borderTop: 4, borderTopColor: 'primary.main', borderRadius: 2 }}>
        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          {/* SECCIÓN: Datos de Usuario */}
          <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>Datos de usuario</Typography>
          <Grid container spacing={3}>
            {/* Rol */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="id_rol" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_rol"
                    label="Rol"
                    select
                    value={field.value || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      field.onChange(val > 0 ? val : 0);
                    }}
                    error={Boolean(errors.id_rol)}
                    helperText={errors.id_rol ? errors.id_rol.message : 'Seleccione el rol del usuario'}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><SecurityIcon color="action" /></InputAdornment>)
                    }}
                  >
                    <MenuItem value={0}>-- Seleccionar Rol --</MenuItem>
                    {sortedRoles.map(role => (
                      <MenuItem key={role.id_rol} value={role.id_rol}>
                        {role.descripcion}
                      </MenuItem>
                    ))}
                  </TextField>
                )} />
              </FormControl>
            </Grid>

            {/* Cédula */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="id_usuario" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_usuario"
                    label="Cédula (ID Usuario)"
                    placeholder="1-2345-6789"
                    error={Boolean(errors.id_usuario)}
                    helperText={errors.id_usuario ? errors.id_usuario.message : 'Ingrese la cédula con formato: #-####-####'}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment>)
                    }}
                  />
                )} />
              </FormControl>
            </Grid>

            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="nombre" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="nombre"
                    label="Nombre Completo"
                    placeholder="Juan Pérez González"
                    error={Boolean(errors.nombre)}
                    helperText={errors.nombre ? errors.nombre.message : 'Ingrese nombre y apellido(s) completos'}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>)
                    }}
                  />
                )} />
              </FormControl>
            </Grid>

            {/* Correo */}
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

            {/* Contraseña */}
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="password" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    id="password"
                    label="Contraseña"
                    type="password"
                    error={Boolean(errors.password)}
                    helperText={errors.password ? errors.password.message : 'Mínimo 6 caracteres'}
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
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>)
                    }}
                    sx={{
                      '& .MuiInput-underline:after': { borderBottomColor: passwordsMatch === true ? 'success.main' : undefined },
                      '& .MuiInput-underline:before': { borderBottomColor: passwordsMatch === true ? 'success.light' : undefined },
                    }}
                  />
                )} />
              </FormControl>
            </Grid>
          </Grid>

          {/* SECCIÓN: Datos Técnicos (solo si rol = 2) */}
          {isTecnico && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>Datos técnicos</Typography>
              <Grid container spacing={3}>
                 {/* Disponibilidad */}
                <Grid item xs={12} md={6}>
                  <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                    <Controller name="disponibilidad" control={control} render={({ field }) => (
                      <TextField
                        {...field}
                        id="disponibilidad"
                        label="Estado de Disponibilidad"
                        select
                        value={field.value ? 'true' : 'false'}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                        helperText="Indica si el técnico está disponible para recibir tiquetes"
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

                {/* Carga Actual */}
                <Grid item xs={12} md={4}>
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
                            helperText="Se inicializa en 0 para nuevos técnicos"
                            disabled
                          />
                        )} />
                  </FormControl>
                </Grid>

                {/* Especialidades (múltiples) */}
                <Grid item xs={12} >
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
            </>
          )}

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={loading} sx={{ m: 0 }}>
              Guardar
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)} sx={{ m: 0 }}>
              Cancelar
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%', fontSize: '1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SuccessOverlay
        open={successOpen}
        mode="create"
        entity="usuario"
        gender="masculine"
        onClose={() => setSuccessOpen(false)}
          actions={savedRol === 2 ? [
            { label: 'Crear otro', onClick: () => setSuccessOpen(false), variant: 'contained', color: 'success' },
            { label: 'Ir al listado de técnicos', onClick: () => { setSuccessOpen(false); navigate('/tecnicos'); }, variant: 'outlined', color: 'success' }
          ] : [
            { label: 'Cerrar', onClick: () => setSuccessOpen(false), variant: 'contained', color: 'success' }
          ]}
      />
    </>
  );
}


