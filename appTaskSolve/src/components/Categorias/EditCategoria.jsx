import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Paper,
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  Divider,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getApiOrigin } from "../../utils/apiBase";
import SuccessOverlay from '../common/SuccessOverlay';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LabelIcon from '@mui/icons-material/Label';
import WorkIcon from '@mui/icons-material/Work';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export default function EditCategoria() {
  const { t } = useTranslation();
  const apiBase = getApiOrigin();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [slas, setSlas] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [openEtiquetaDialog, setOpenEtiquetaDialog] = useState(false);
  const [newEtiqueta, setNewEtiqueta] = useState("");
  const [openEspDialog, setOpenEspDialog] = useState(false);
  const [newEspecialidad, setNewEspecialidad] = useState("");
  const [form, setForm] = useState({
    id_categoria: "",
    nombre: "",
    id_sla: "",
    etiquetas: [], // Cambiado a array
    especialidades: [], // Cambiado a array
  });
  // Control manual para cerrar el dropdown tras selección
  const [openEtq, setOpenEtq] = useState(false);
  const [openEsp, setOpenEsp] = useState(false);

  // Catálogos ordenados para los combo-box (selects): id ascendente
  const sortedCatalogEtiquetas = (etiquetas || []).slice().sort((a, b) => {
    const ai = a?.id_etiqueta;
    const bi = b?.id_etiqueta;
    if (ai != null && bi != null) return Number(ai) - Number(bi);
    if (ai != null) return -1;
    if (bi != null) return 1;
    return String(a?.nombre || "").localeCompare(String(b?.nombre || ""));
  });

  const sortedCatalogEspecialidades = (especialidades || []).slice().sort((a, b) => {
    const ai = a?.id_especialidad;
    const bi = b?.id_especialidad;
    if (ai != null && bi != null) return Number(ai) - Number(bi);
    if (ai != null) return -1;
    if (bi != null) return 1;
    return String(a?.nombre || "").localeCompare(String(b?.nombre || ""));
  });

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [slaRes, etqRes, espRes] = await Promise.all([
          axios.get(`${apiBase}/apiticket/sla`),
          axios.get(`${apiBase}/apiticket/etiqueta`),
          axios.get(`${apiBase}/apiticket/especialidad`),
        ]);
        setSlas(slaRes.data || []);
        setEtiquetas(etqRes.data || []);
        setEspecialidades(espRes.data || []);
      } catch (err) {
        setSnackbar({
          open: true,
          message: t('createForm.errorLoadingCatalogs'),
          severity: "error",
        });
      }
    };
    fetchCatalogs();
  }, [apiBase]);

  // Cargar datos de la categoría
  useEffect(() => {
    const fetchCategoria = async () => {
      if (!id) return;
      try {
        setLoadingData(true);
        const res = await axios.get(`${apiBase}/apiticket/categoria_ticket/${id}`);
        const categoria = res.data;

        if (categoria) {
          // Cargar etiquetas y especialidades de esta categoría
          const [etqRes, espRes] = await Promise.all([
            axios.get(`${apiBase}/apiticket/categoria_ticket/getEtiquetas/${id}`),
            axios.get(`${apiBase}/apiticket/categoria_ticket/getEspecialidades/${id}`),
          ]);

          const etiquetasData = etqRes.data || [];
          const especialidadesData = espRes.data || [];

          // Normalizar formas de datos distintas a un shape común { id_*, nombre }
          const normalizeEtiqueta = (e) => (
            e ? { id_etiqueta: e.id_etiqueta ?? e.id ?? e.categoria ?? null, nombre: e.nombre ?? e.etiqueta ?? e.label ?? '' } : null
          );
          const normalizeEspecialidad = (e) => (
            e ? { id_especialidad: e.id_especialidad ?? e.id ?? null, nombre: e.nombre ?? e.especialidad ?? '' } : null
          );

          setForm({
            id_categoria: categoria.id_categoria,
            nombre: categoria.nombre || "",
            id_sla: categoria.id_sla || "",
            etiquetas: etiquetasData.map(normalizeEtiqueta).filter(Boolean),
            especialidades: especialidadesData.map(normalizeEspecialidad).filter(Boolean),
          });
        } else {
          setSnackbar({
            open: true,
            message: t('createForm.categoryNotFound'),
            severity: "error",
          });
          setTimeout(() => navigate("/categorias"), 2000);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: err?.response?.data?.error || t('createForm.errorLoadingCategory'),
          severity: "error",
        });
        setTimeout(() => navigate("/categorias"), 2000);
      } finally {
        setLoadingData(false);
      }
    };
    fetchCategoria();
  }, [id, apiBase, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!form.nombre.trim()) {
      setSnackbar({
        open: true,
        message: t('createForm.categoryNameRequired'),
        severity: "warning",
      });
      return;
    }

    if (form.nombre.trim().length < 3) {
      setSnackbar({
        open: true,
        message: t('createForm.categoryNameTooShort'),
        severity: "warning",
      });
      return;
    }

    if (form.nombre.trim().length > 100) {
      setSnackbar({
        open: true,
        message: t('createForm.categoryNameTooLong', { length: form.nombre.trim().length }),
        severity: "warning",
      });
      return;
    }

    if (!form.id_sla) {
      setSnackbar({
        open: true,
        message: t('createForm.slaRequired'),
        severity: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        id_categoria: parseInt(form.id_categoria, 10),
        nombre: form.nombre.trim(),
        id_sla: parseInt(form.id_sla, 10),
        etiquetas: (form.etiquetas || []).map(e => parseInt(e.id_etiqueta, 10)),
        especialidades: (form.especialidades || []).map(e => parseInt(e.id_especialidad, 10)),
      };

      const res = await axios.put(
        `${apiBase}/apiticket/categoria_ticket/update/${id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (res?.data) {
        setSuccessOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: t('createForm.invalidServerResponse'),
          severity: "warning",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || t('createForm.errorCreating'),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 0 }}>
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
          onClick={(e) => { e.preventDefault(); navigate('/categorias'); }}
        >
          {t('header.categories')}
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate(`/categorias/${id}`); }}
        >
          {t('createForm.detailLabel')}
        </Link>
        <Typography color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <EditIcon fontSize="small" />
          {t('createForm.editLabel')}
        </Typography>
      </Breadcrumbs>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderTop: 6,
          borderTopColor: 'warning.main',
          borderRadius: 3,
          overflow: 'visible',
          bgcolor: 'background.paper'
        }}
      >
        <SuccessOverlay
          open={successOpen}
          mode="update"
          entity={t('createForm.categoryCreatedSuccess')}
          subtitle={t('createForm.categoryUpdatedSuccess', { id })}
          onClose={() => setSuccessOpen(false)}
          actions={[
            { label: t('createForm.viewDetailButton'), onClick: () => { setSuccessOpen(false); navigate(`/categorias/${id}`); }, variant: 'contained', color: 'warning' },
            { label: t('createForm.goToListButton'), onClick: () => { setSuccessOpen(false); navigate('/categorias'); }, variant: 'outlined', color: 'warning' }
          ]}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t('createForm.editCategoryTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('createForm.editCategorySubtitle')}
            </Typography>
          </Box>
          <Button variant="text" onClick={() => navigate(-1)}>
            {t('createForm.backButton')}
          </Button>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                required
                label={<span>{t('createForm.categoryName')} <span style={{ color: '#d32f2f' }}>*</span></span>}
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                helperText={t('createForm.categoryNameHelper')}
                sx={{ minWidth: { md: 300 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label={t('createForm.sla')}
                value={form.id_sla}
                onChange={(e) =>
                  setForm((f) => ({ ...f, id_sla: e.target.value }))
                }
                sx={{ minWidth: { md: 200 } }}
              >
                {slas.map((s) => (
                  <MenuItem key={s.id_sla} value={s.id_sla}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={sortedCatalogEtiquetas}
                disableCloseOnSelect
                getOptionLabel={(option) => option.nombre || ''}
                value={form.etiquetas}
                onChange={(_, newValue) => {
                  setForm(f => ({ ...f, etiquetas: newValue }));
                  setOpenEtq(false);
                }}
                open={openEtq}
                onOpen={() => setOpenEtq(true)}
                onClose={() => setOpenEtq(false)}
                disableClearable={false}
                renderTags={() => null}
                isOptionEqualToValue={(option, value) => option.id_etiqueta === value.id_etiqueta}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    <LabelIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                    <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {option.nombre || ''}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('createForm.tagsLabel')}
                    placeholder={t('createForm.tagsPlaceholder')}
                    helperText={t('createForm.tagsHelperText', { count: form.etiquetas.length })}
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
              <Button
                size="small"
                onClick={() => setOpenEtiquetaDialog(true)}
                sx={{ mt: 1 }}
              >
                {t('createForm.createNewTag')}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={sortedCatalogEspecialidades}
                disableCloseOnSelect
                getOptionLabel={(option) => option.nombre || ''}
                value={form.especialidades}
                onChange={(_, newValue) => {
                  setForm(f => ({ ...f, especialidades: newValue }));
                  setOpenEsp(false);
                }}
                open={openEsp}
                onOpen={() => setOpenEsp(true)}
                onClose={() => setOpenEsp(false)}
                disableClearable={false}
                renderTags={() => null}
                isOptionEqualToValue={(option, value) => option.id_especialidad === value.id_especialidad}
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
                      {option.nombre || ''}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('createForm.specialtiesLabel')}
                    placeholder={t('createForm.specialtiesPlaceholder')}
                    helperText={t('createForm.specialtiesHelperText', { count: form.especialidades.length })}
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
              <Button
                size="small"
                onClick={() => setOpenEspDialog(true)}
                sx={{ mt: 1 }}
              >
                {t('createForm.createNewSpecialty')}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                {t('createForm.currentSelectionTitle')} ({form.etiquetas.length + form.especialidades.length} items)
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      bgcolor: form.etiquetas.length > 0 ? 'success.50' : 'grey.50',
                      border: '2px solid',
                      borderColor: form.etiquetas.length > 0 ? 'success.main' : 'grey.300',
                      p: 3,
                      minHeight: 180,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: form.etiquetas.length > 0 ? '0 4px 20px rgba(46, 125, 50, 0.15)' : '0 4px 12px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LabelIcon sx={{ color: form.etiquetas.length > 0 ? 'success.main' : 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {t('createForm.tagsLabel')}
                        </Typography>
                      </Box>
                      <Chip
                        label={form.etiquetas.length}
                        size="small"
                        color={form.etiquetas.length > 0 ? 'success' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    
                    {form.etiquetas.length > 0 ? (
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
                        {form.etiquetas.map((etq) => (
                          <Chip
                            key={etq.id_etiqueta}
                            icon={<LabelIcon />}
                            label={`${etq.nombre || etq.etiqueta || 'Sin nombre'}`}
                            onDelete={() => setForm(f => ({ 
                              ...f, 
                              etiquetas: f.etiquetas.filter(e => e.id_etiqueta !== etq.id_etiqueta) 
                            }))}
                            color="success"
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No hay etiquetas seleccionadas
                        </Typography>
                        <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 0.5 }}>
                          Seleccione etiquetas usando el campo superior
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      bgcolor: form.especialidades.length > 0 ? 'info.50' : 'grey.50',
                      border: '2px solid',
                      borderColor: form.especialidades.length > 0 ? 'info.main' : 'grey.300',
                      p: 3,
                      minHeight: 180,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: form.especialidades.length > 0 ? '0 4px 20px rgba(25, 118, 210, 0.15)' : '0 4px 12px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon sx={{ color: form.especialidades.length > 0 ? 'info.main' : 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {t('createForm.specialtiesLabel')}
                        </Typography>
                      </Box>
                      <Chip
                        label={form.especialidades.length}
                        size="small"
                        color={form.especialidades.length > 0 ? 'info' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    
                    {form.especialidades.length > 0 ? (
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
                        {form.especialidades.map((esp) => (
                          <Chip
                            key={esp.id_especialidad}
                            icon={<WorkIcon />}
                            label={`${esp.nombre || esp.especialidad || 'Sin nombre'}`}
                            onDelete={() => setForm(f => ({ 
                              ...f, 
                              especialidades: f.especialidades.filter(e => e.id_especialidad !== esp.id_especialidad) 
                            }))}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No hay especialidades seleccionadas
                        </Typography>
                        <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 0.5 }}>
                          Seleccione especialidades usando el campo superior
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}
          >
            <Button type="submit" variant="contained" color="warning" disabled={loading}>
              {t('createForm.updateButton')}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/categorias")}>
              {t('createForm.cancelButton')}
            </Button>
          </Box>
        </form>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Dialog para crear nueva etiqueta */}
        <Dialog open={openEtiquetaDialog} onClose={() => setOpenEtiquetaDialog(false)}>
          <DialogTitle>{t('createForm.newTagDialog')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label={t('createForm.newTagDialogLabel')}
              value={newEtiqueta}
              onChange={(e) => setNewEtiqueta(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEtiquetaDialog(false)}>{t('createForm.cancelButton')}</Button>
            <Button
              disabled={!newEtiqueta.trim()}
              onClick={async () => {
                const nombre = newEtiqueta.trim();
                if (!nombre) return;
                try {
                  setLoading(true);
                  const res = await axios.post(`${apiBase}/apiticket/etiqueta`, { nombre }, { headers: { 'Content-Type': 'application/json' } });
                  const created = res?.data;
                  if (created && created.id_etiqueta) {
                    setForm((f) => ({ ...f, etiquetas: [...f.etiquetas, created] }));
                    setEtiquetas((prev) => {
                      const already = (prev || []).some(it => it && it.id_etiqueta === created.id_etiqueta);
                      return already ? prev : [...prev, created];
                    });
                    setSnackbar({ open: true, message: t('createForm.tagCreatedSuccess'), severity: "success" });
                  } else {
                    setSnackbar({ open: true, message: t('createForm.tagCreateError'), severity: "error" });
                  }
                } catch (err) {
                  setSnackbar({ open: true, message: err?.response?.data?.error || t('createForm.tagCreateError'), severity: 'error' });
                } finally {
                  setNewEtiqueta("");
                  setOpenEtiquetaDialog(false);
                  setLoading(false);
                }
              }}
            >
              {t('createForm.addButton')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para crear nueva especialidad */}
        <Dialog open={openEspDialog} onClose={() => setOpenEspDialog(false)}>
          <DialogTitle>{t('createForm.newSpecialtyDialog')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label={t('createForm.newSpecialtyDialogLabel')}
              value={newEspecialidad}
              onChange={(e) => setNewEspecialidad(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEspDialog(false)}>{t('createForm.cancelButton')}</Button>
            <Button
              disabled={!newEspecialidad.trim()}
              onClick={async () => {
                const nombre = newEspecialidad.trim();
                if (!nombre) return;
                try {
                  setLoading(true);
                  const idSla = form.id_sla ? parseInt(form.id_sla, 10) : 1;
                  const res = await axios.post(`${apiBase}/apiticket/especialidad`, { nombre, id_sla: idSla, id_categoria: 1 }, { headers: { 'Content-Type': 'application/json' } });
                  const created = res?.data;
                  if (created && created.id_especialidad) {
                    setForm((f) => ({ ...f, especialidades: [...f.especialidades, created] }));
                    setEspecialidades((prev) => {
                      const already = (prev || []).some(it => it && it.id_especialidad === created.id_especialidad);
                      return already ? prev : [...prev, created];
                    });
                    setSnackbar({ open: true, message: t('createForm.specialtyCreatedSuccess'), severity: "success" });
                  } else {
                    setSnackbar({ open: true, message: t('createForm.specialtyCreateError'), severity: "error" });
                  }
                } catch (err) {
                  setSnackbar({ open: true, message: err?.response?.data?.error || t('createForm.specialtyCreateError'), severity: 'error' });
                } finally {
                  setNewEspecialidad("");
                  setOpenEspDialog(false);
                  setLoading(false);
                }
              }}
            >
              {t('createForm.addButton')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
