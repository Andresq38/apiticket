import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box, Grid, Paper, Divider, Typography, FormControl, TextField, MenuItem, InputAdornment, Button, Snackbar, Alert, Autocomplete, CircularProgress, Breadcrumbs, Link, Checkbox, Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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

// Validation schema (password optional on edit)
const schema = yup.object({
  id_usuario: yup.string()
    .required('Identity number is required')
    .matches(/^[0-9]-[0-9]{4}-[0-9]{4}$/, 'Invalid format. Use: #-####-####'),
  nombre: yup.string()
    .required('Full name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(150, 'Name cannot exceed 150 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Name may only contain letters and spaces')
    .test('dos-palabras', 'Enter first and last name (minimum 2 words)', value => {
      if (!value) return false;
      const palabras = value.trim().split(/\s+/);
      return palabras.length >= 2 && palabras.every(p => p.length > 0);
    }),
  correo: yup.string()
    .required('Email is required')
    .email('Must be a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password cannot exceed 50 characters')
    .optional(),
  confirm_password: yup.string().when('password', (pw, schema) => (
    pw ? schema.required('Confirm the password').oneOf([yup.ref('password')], 'Passwords must match') : schema
  )),
  disponibilidad: yup.boolean().required('Select availability'),
  especialidades: yup.array().of(yup.object()).required('Select at least one specialty'),
  carga_trabajo: yup.number().min(0, 'Workload must be 0 or greater').optional(),
});

export default function EditTecnico() {
  const { t } = useTranslation();
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
        
        // Debug: Ver qué devuelve la API
        console.log('Respuesta completa de la API:', tecnicoRes.data);
        
        // La respuesta de axios viene en tecnicoRes.data
        // Verificar si la respuesta es un array o un objeto directo
        const tecnicoData = Array.isArray(tecnicoRes.data) 
          ? (tecnicoRes.data.length > 0 ? tecnicoRes.data[0] : null)
          : tecnicoRes.data;

        console.log('Datos del técnico procesados:', tecnicoData);

        if (!isMounted) return;

        setEspecialidades(especialidadesData);
        setRoles(rolesData || []);

        // Verificar si se encontró el técnico
        if (!tecnicoData) {
          setLoadError(t('technicianForm.notFound'));
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
          setLoadError(t('technicianForm.errorLoading'));
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [id, reset]);

  const onSubmit = async (v) => {
    try {
      console.log('Datos del formulario antes de enviar:', v);
      const payload = {
        id_tecnico: parseInt(id),
        id_usuario: v.id_usuario,
        nombre: v.nombre,
        correo: v.correo,
        disponibilidad: v.disponibilidad ? 1 : 0,
        especialidades: (v.especialidades || []).map(e => e.id_especialidad),
      };
      console.log('Payload a enviar:', payload);

      // Solo incluir password si se proporcionó
      if (v.password && v.password.trim()) {
        payload.password = v.password;
      }

      const { data } = await TecnicoService.updateTecnico(payload);
      
      if (data?.id_tecnico || data) {
        setSuccessOpen(true);
      } else {
        setSnackbar({ open: true, message: t('createForm.invalidServerResponse'), severity: 'warning' });
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      setSnackbar({ open: true, message: err?.response?.data?.error || err?.message || t('technicianForm.updateError'), severity: 'error' });
    }
  };

  const onError = () => setSnackbar({ open: true, message: t('technicianForm.reviewRequired'), severity: 'warning' });

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
          <Button variant="outlined" onClick={() => navigate('/tecnicos')}>{t('createForm.goToListButton')}</Button>
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
          {t('header.home')}
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/mantenimientos'); }}
        >
          {t('header.maintenance')}
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/tecnicos'); }}
        >
          {t('header.technicians')}
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate(`/tecnicos/${id}`); }}
        >
          {t('createForm.detailLabel')}
        </Link>
        <Typography color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <EditIcon fontSize="small" />
          {t('createForm.editLabel')}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{t('technicianForm.editTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('technicianForm.editSubtitle')}</Typography>
        </Box>
        <Button variant="text" onClick={() => navigate(-1)}>{`\u2190 ${t('technicianForm.goBack')}`}</Button>
      </Box>
      <Paper elevation={2} sx={{ p: 3, borderTop: 4, borderTopColor: 'primary.main', borderRadius: 2, bgcolor: 'background.paper', position: 'relative' }}>
        <SuccessOverlay
          open={successOpen}
          mode="update"
          entity={t('technicians.entity')}
          subtitle={t('technicianForm.updateSuccess', { id })}
          onClose={() => setSuccessOpen(false)}
          actions={[
            { label: t('createForm.viewDetailButton'), onClick: () => { setSuccessOpen(false); navigate(`/tecnicos/${id}`); }, variant: 'contained', color: 'warning' },
            { label: t('createForm.goToListButton'), onClick: () => { setSuccessOpen(false); navigate('/tecnicos'); }, variant: 'outlined', color: 'warning' }
          ]}
        />
        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>{t('technicianForm.personalData')}</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="id_rol" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                      id="id_rol"
                      label={t('technicianForm.role')}
                    select
                    value={field.value || 0}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    helperText={t('technicianForm.roleHelper')}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SecurityIcon color="action" /></InputAdornment>) }}
                    disabled
                  >
                    <MenuItem value={0}>{t('technicianForm.selectRole')}</MenuItem>
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
                    label={t('technicianForm.cedula')} 
                    placeholder={t('technicianForm.cedulaPlaceholder')} 
                    error={Boolean(errors.id_usuario)} 
                    helperText={errors.id_usuario ? errors.id_usuario.message : t('technicianForm.readOnlyField')} 
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
                    label={t('technicianForm.fullName')} 
                    placeholder={t('technicianForm.fullNamePlaceholder')}
                    error={Boolean(errors.nombre)} 
                    helperText={errors.nombre ? errors.nombre.message : t('technicianForm.readOnlyField')} 
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
                    label={t('technicianForm.email')} 
                    type="email" 
                    error={Boolean(errors.correo)} 
                    helperText={errors.correo ? errors.correo.message : t('technicianForm.emailHelper')} 
                    placeholder={t('technicianForm.emailPlaceholder')} 
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
                    label={t('technicianForm.newPasswordOptional')} 
                    type="password" 
                    error={Boolean(errors.password)} 
                    helperText={errors.password ? errors.password.message : t('technicianForm.newPasswordHelper')} 
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
                    label={t('technicianForm.confirmPassword')}
                    type="password"
                    error={Boolean(errors.confirm_password) || (passwordsMatch === false)}
                    helperText={
                      errors.confirm_password ? errors.confirm_password.message
                        : (passwordsMatch === null ? t('technicianForm.confirmPasswordHelper') : (passwordsMatch ? t('technicianForm.passwordMatch') : t('technicianForm.passwordMismatch')))
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
          <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>{t('technicianForm.technicalData')}</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                <Controller name="disponibilidad" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    id="disponibilidad" 
                    label={t('technicianForm.availabilityStatus')} 
                    select 
                    value={field.value ? 'true' : 'false'} 
                    onChange={(e) => field.onChange(e.target.value === 'true')}
                    helperText={errors.disponibilidad ? errors.disponibilidad.message : t('technicianForm.readOnlyField')}
                    InputProps={{ readOnly: true }}
                    disabled
                  >
                    <MenuItem value="true">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" /> {t('technicianForm.available')}
                      </Box>
                    </MenuItem>
                    <MenuItem value="false">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HighlightOffIcon color="warning" fontSize="small" /> {t('technicianForm.notAvailable')}
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
                    label={t('technicianForm.currentLoad')} 
                    type="number" 
                    value={field.value ?? 0}
                    InputProps={{ 
                      readOnly: true,
                      startAdornment: (<InputAdornment position="start"><AssignmentIcon color="action" /></InputAdornment>) 
                    }} 
                    helperText={t('technicianForm.loadReadOnly')}
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
                        label={t('technicianForm.specialties')}
                        placeholder={t('technicianForm.specialtiesPlaceholder')}
                        error={Boolean(errors.especialidades)}
                        helperText={errors.especialidades ? errors.especialidades.message : t('technicianForm.specialtiesSelected', { count: (field.value || []).length })}
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
                      {t('technicianForm.specialtiesHeader')}
                    </Typography>
                  </Box>
                  <Chip
                    label={t('technicianForm.specialtiesSelected', { count: (watch('especialidades') || []).length })}
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
                      {t('technicianForm.noSpecialties')}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 0.5 }}>
                      {t('technicianForm.selectSpecialties')}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" color="warning" startIcon={<SaveIcon />} sx={{ m: 0 }}>{t('technicianForm.update')}</Button>
            <Button variant="outlined" onClick={() => navigate(`/tecnicos/${id}`)} sx={{ m: 0 }}>{t('createForm.cancelButton')}</Button>
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
