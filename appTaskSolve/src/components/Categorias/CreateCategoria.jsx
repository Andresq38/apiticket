import React, { useEffect, useState } from "react";
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
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Divider,
  Autocomplete,
  Backdrop,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LabelIcon from '@mui/icons-material/Label';
import WorkIcon from '@mui/icons-material/Work';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SuccessOverlay from '../common/SuccessOverlay';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import axios from "axios";
import { getApiOrigin } from "../../utils/apiBase";

export default function CreateCategoria({
  embedded = false,
  onCreated,
  hideEmbeddedHeader = false,
}) {
  const apiBase = getApiOrigin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [slas, setSlas] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [openEtiquetaDialog, setOpenEtiquetaDialog] = useState(false);
  const [newEtiqueta, setNewEtiqueta] = useState("");
  const [openEspDialog, setOpenEspDialog] = useState(false);
  const [newEspecialidad, setNewEspecialidad] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    id_sla: "",
    etiquetas: [], // Cambiado a array
    especialidades: [], // Cambiado a array
  });
  const [successOpen, setSuccessOpen] = useState(false);
  // Control de apertura manual para cerrar después de cada selección
  const [openEtq, setOpenEtq] = useState(false);
  const [openEsp, setOpenEsp] = useState(false);

  // catálogos ordenados para los combo-box (selects): id ascendente
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

  useEffect(() => {
    const fetchData = async () => {
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
          message: "Error cargando catálogos",
          severity: "error",
        });
      }
    };
    fetchData();
  }, [apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
      // Validaciones mejoradas
      if (!form.nombre.trim()) {
        setSnackbar({
          open: true,
          message: "El nombre de la categoría es requerido. Por favor, ingrese un nombre descriptivo.",
          severity: "warning",
        });
        return;
      }

      if (form.nombre.trim().length < 3) {
        setSnackbar({
          open: true,
          message: "El nombre es muy corto. Debe tener al menos 3 caracteres. Ejemplo: 'Soporte Técnico'",
          severity: "warning",
        });
        return;
      }

      if (form.nombre.trim().length > 100) {
        setSnackbar({
          open: true,
          message: "El nombre es demasiado largo. Máximo 100 caracteres (actual: " + form.nombre.trim().length + ")",
          severity: "warning",
        });
        return;
      }

      if (!form.id_sla) {
        setSnackbar({
          open: true,
          message: "Debe seleccionar un SLA (Acuerdo de Nivel de Servicio) para esta categoría. Define el tiempo de respuesta.",
          severity: "warning",
        });
        return;
      }    try {
      setLoading(true);

      const payload = {
        nombre: form.nombre.trim(),
        id_sla: parseInt(form.id_sla, 10),
        etiquetas: (form.etiquetas || []).map(e => parseInt(e.id_etiqueta, 10)),
        especialidades: (form.especialidades || []).map(e => parseInt(e.id_especialidad, 10)),
      };
      const res = await axios.post(
        `${apiBase}/apiticket/categoria_ticket`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (res?.data?.id_categoria || res?.data) {
        // Mostrar overlay de éxito centralizado y limpiar formulario (sin redirigir ni invocar callbacks)
        setSuccessOpen(true);
        setForm({ nombre: "", id_sla: "", etiquetas: [], especialidades: [] });
        window.scrollTo(0,0);
      } else {
        setSnackbar({
          open: true,
          message: "Respuesta inválida del servidor",
          severity: "warning",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Error al crear categoría",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        borderTop: 6,
        borderTopColor: "primary.main",
        borderRadius: 3,
        overflow: "visible",
      }}
    >
      {!embedded && (
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
              Crear Categoría
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Defina el SLA y las etiquetas relacionadas
            </Typography>
          </Box>
          <Button variant="text" onClick={() => navigate(-1)}>
            &larr; Volver
          </Button>
        </Box>
      )}

      {embedded && !hideEmbeddedHeader && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Nueva categoría
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Defina el SLA y las etiquetas relacionadas
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label={<span>Nombre <span style={{ color: '#d32f2f' }}>*</span></span>}
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              required
              helperText="Requerido (3-100 caracteres). Ejemplo: Soporte Técnico, Infraestructura"
              sx={{ minWidth: { md: 300 } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              required
              label={<span>SLA <span style={{ color: '#d32f2f' }}>*</span></span>}
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
                // Cerrar el popup tras una selección
                setOpenEtq(false);
              }}
              renderTags={() => null}
              isOptionEqualToValue={(option, value) => option.id_etiqueta === value.id_etiqueta}
              open={openEtq}
              onOpen={() => setOpenEtq(true)}
              onClose={() => setOpenEtq(false)}
              disableClearable={false}
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
                      {`${option.id_etiqueta} - ${option.nombre}`}
                    </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Etiquetas"
                  placeholder="Seleccione etiquetas"
                  helperText={`${form.etiquetas.length} seleccionada(s)`}
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
              + Crear nueva etiqueta
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
              renderTags={() => null}
              isOptionEqualToValue={(option, value) => option.id_especialidad === value.id_especialidad}
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
                  helperText={`${form.especialidades.length} seleccionada(s)`}
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
              + Crear nueva especialidad
            </Button>
          </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                Selección Actual ({form.etiquetas.length + form.especialidades.length} items)
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
                      minHeight: 220,
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
                          Etiquetas
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
                          maxHeight: 240,
                          overflowY: 'auto',
                          p: 1
                        }}
                      >
                        {form.etiquetas.map(etq => (
                          <Chip
                            key={etq.id_etiqueta}
                            icon={<LabelIcon />}
                            label={`${etq.id_etiqueta} - ${etq.nombre || etq.etiqueta || 'Sin nombre'}`}
                            onDelete={() => setForm(f => ({ ...f, etiquetas: f.etiquetas.filter(e => e.id_etiqueta !== etq.id_etiqueta) }))}
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
                      minHeight: 220,
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
                          Especialidades
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
                          maxHeight: 240,
                          overflowY: 'auto',
                          p: 1
                        }}
                      >
                        {form.especialidades.map(esp => (
                          <Chip
                            key={esp.id_especialidad}
                            icon={<WorkIcon />}
                            label={`${esp.id_especialidad} - ${esp.nombre || esp.especialidad || 'Sin nombre'}`}
                            onDelete={() => setForm(f => ({ ...f, especialidades: f.especialidades.filter(e => e.id_especialidad !== esp.id_especialidad) }))}
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
          <Button type="submit" variant="contained" disabled={loading}>
            Guardar
          </Button>
          {!embedded && (
            <Button variant="outlined" onClick={() => navigate("/categorias")}>
              Cancelar
            </Button>
          )}
          {embedded && (
            <Button
              variant="outlined"
              onClick={() => setForm({ nombre: "", id_sla: "", etiquetas: [], especialidades: [] })}
            >
              Limpiar
            </Button>
          )}
        </Box>
      </form>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Dialog para crear nueva etiqueta */}
      <Dialog open={openEtiquetaDialog} onClose={() => setOpenEtiquetaDialog(false)}>
        <DialogTitle>Nueva etiqueta</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Nombre de la etiqueta"
            value={newEtiqueta}
            onChange={(e) => setNewEtiqueta(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEtiquetaDialog(false)}>Cancelar</Button>
          <Button
            disabled={!newEtiqueta.trim()}
            onClick={async () => {
              const nombre = newEtiqueta.trim();
              if (!nombre) return;
              try {
                setLoading(true);
                // crear etiqueta en servidor
                const res = await axios.post(`${apiBase}/apiticket/etiqueta`, { nombre }, { headers: { 'Content-Type': 'application/json' } });
                const created = res?.data;
                if (created && created.id_etiqueta) {
                    setForm((f) => ({ ...f, etiquetas: [...f.etiquetas, created] }));
                  setEtiquetas((prev) => {
                    const already = (prev || []).some(it => it && it.id_etiqueta === created.id_etiqueta);
                    return already ? prev : [...prev, created];
                  });
                    setSnackbar({ open: true, message: "Etiqueta creada y agregada correctamente", severity: "success" });
                } else {
                  setSnackbar({ open: true, message: "No se pudo crear la etiqueta", severity: "error" });
                }
              } catch (err) {
                setSnackbar({ open: true, message: err?.response?.data?.error || 'Error creando etiqueta', severity: 'error' });
              } finally {
                setNewEtiqueta("");
                setOpenEtiquetaDialog(false);
                setLoading(false);
              }
            }}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear nueva especialidad (solo nombre, local) */}
      <Dialog open={openEspDialog} onClose={() => setOpenEspDialog(false)}>
        <DialogTitle>Nueva especialidad</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Nombre de la especialidad"
            value={newEspecialidad}
            onChange={(e) => setNewEspecialidad(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEspDialog(false)}>Cancelar</Button>
          <Button
            disabled={!newEspecialidad.trim()}
            onClick={async () => {
              const nombre = newEspecialidad.trim();
              if (!nombre) return;
              try {
                setLoading(true);
                // id_sla: use selected SLA if provided, otherwise fallback to 1
                const idSla = form.id_sla ? parseInt(form.id_sla, 10) : 1;
                // create especialidad with temporary id_categoria = 1 as requested
                const res = await axios.post(`${apiBase}/apiticket/especialidad`, { nombre, id_sla: idSla, id_categoria: 1 }, { headers: { 'Content-Type': 'application/json' } });
                const created = res?.data;
                if (created && created.id_especialidad) {
                    setForm((f) => ({ ...f, especialidades: [...f.especialidades, created] }));
                  setEspecialidades((prev) => {
                    const already = (prev || []).some(it => it && it.id_especialidad === created.id_especialidad);
                    return already ? prev : [...prev, created];
                  });
                    setSnackbar({ open: true, message: "Especialidad creada y agregada correctamente", severity: "success" });
                } else {
                  setSnackbar({ open: true, message: "No se pudo crear la especialidad", severity: "error" });
                }
              } catch (err) {
                setSnackbar({ open: true, message: err?.response?.data?.error || 'Error creando especialidad', severity: 'error' });
              } finally {
                setNewEspecialidad("");
                setOpenEspDialog(false);
                setLoading(false);
              }
            }}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  // Retorno único para modo embedded y página completa, incluye overlay de éxito siempre
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {FormContent}
      <SuccessOverlay
        open={successOpen}
        mode="create"
        entity="Categoría"
        gender="feminine"
        onClose={() => setSuccessOpen(false)}
        actions={[
          { label: 'Crear otra', onClick: () => setSuccessOpen(false), variant: 'contained', color: 'success' },
          { label: 'Ir al listado', onClick: () => { setSuccessOpen(false); navigate('/categorias'); }, variant: 'outlined', color: 'success' }
        ]}
      />
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
    </Container>
  );
}
