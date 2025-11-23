import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
  LinearProgress,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';

export default function CambiarEstadoDialog({ 
  open, 
  onClose, 
  ticket, 
  onSuccess,
  estadoActual 
}) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBase = getApiOrigin();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Mapeo de estados: ID => Nombre
  const estados = {
    1: 'Pendiente',
    2: 'Asignado',
    3: 'En Proceso',
    4: 'Resuelto',
    5: 'Cerrado'
  };

  // Flujo estricto: estado actual => estados permitidos
  const transiciones = {
    1: [2],  // Pendiente → Asignado
    2: [3],  // Asignado → En Proceso
    3: [4],  // En Proceso → Resuelto
    4: [5],  // Resuelto → Cerrado
    5: []    // Cerrado (estado final)
  };

  const estadosPermitidos = transiciones[estadoActual] || [];

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError(`Archivo ${file.name} tiene extensión no permitida`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`Archivo ${file.name} excede el tamaño máximo (5MB)`);
        return false;
      }
      return true;
    });

    setImagenes(prev => [...prev, ...validFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!nuevoEstado) {
      setError('Selecciona un nuevo estado');
      return;
    }

    if (!observaciones || observaciones.trim() === '') {
      setError('Las observaciones son obligatorias');
      return;
    }

    if (imagenes.length === 0) {
      setError('Debes adjuntar al menos UNA imagen para cambiar el estado');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Paso 1: Cambiar el estado del ticket
      const cambioResponse = await axios.put(`${apiBase}/apiticket/ticket/cambiarEstado/${ticket.id_ticket}`, {
        nuevo_estado: parseInt(nuevoEstado),
        observaciones: observaciones.trim(),
        id_usuario_remitente: user.id
      });

      if (!cambioResponse.data.success) {
        throw new Error(cambioResponse.data.message || 'Error al cambiar el estado');
      }

      // Paso 2: Obtener el ID del último historial insertado para este ticket
      const historialResponse = await axios.get(`${apiBase}/apiticket/historial_estado/ticket/${ticket.id_ticket}`);
      const historiales = Array.isArray(historialResponse.data) ? historialResponse.data : [];
      
      if (historiales.length === 0) {
        throw new Error('No se pudo obtener el historial creado');
      }

      // El último historial es el que acabamos de crear
      const ultimoHistorial = historiales[historiales.length - 1];
      const idHistorial = ultimoHistorial.id_historial;

      // Paso 3: Subir cada imagen y asociarla al historial
      setUploading(true);
      const uploadPromises = imagenes.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('id_ticket', ticket.id_ticket);
        formData.append('id_historial', idHistorial);

        return axios.post(`${apiBase}/apiticket/imagen/uploadHistorial`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });

      await Promise.all(uploadPromises);

      // Éxito
      onSuccess && onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError(err.response?.data?.message || err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setNuevoEstado('');
    setObservaciones('');
    setImagenes([]);
    setError('');
    setLoading(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        🔄 Cambiar Estado del Tiquete #{ticket?.id_ticket}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Estado actual: {estados[estadoActual] || 'Desconocido'}
          </Typography>
          <Typography variant="caption">
            Flujo obligatorio: Pendiente → Asignado → En Proceso → Resuelto → Cerrado
          </Typography>
        </Alert>

        {/* Selector de estado */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Nuevo Estado *</InputLabel>
          <Select
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value)}
            label="Nuevo Estado *"
            disabled={loading || estadosPermitidos.length === 0}
          >
            {estadosPermitidos.map(idEstado => (
              <MenuItem key={idEstado} value={idEstado}>
                {estados[idEstado]}
              </MenuItem>
            ))}
          </Select>
          {estadosPermitidos.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Este ticket está en estado final y no puede cambiar
            </Typography>
          )}
        </FormControl>

        {/* Observaciones */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Observaciones *"
          placeholder="Describe el motivo del cambio de estado..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          disabled={loading}
          sx={{ mb: 3 }}
          required
          error={observaciones.trim() === '' && nuevoEstado !== ''}
          helperText="Las observaciones son obligatorias"
        />

        {/* Sección de imágenes */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Adjuntar Imágenes * (Obligatorio: mínimo 1 imagen)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Formatos: JPG, PNG, GIF, PDF | Tamaño máximo: 5MB por archivo
          </Typography>

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
            fullWidth
            sx={{ mb: 2 }}
          >
            Seleccionar Imágenes
            <input
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
              onChange={handleFileSelect}
            />
          </Button>

          {/* Lista de archivos seleccionados */}
          {imagenes.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Archivos seleccionados ({imagenes.length}):
              </Typography>
              {imagenes.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: index < imagenes.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsertDriveFileIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2">{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    disabled={loading}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          )}

          {imagenes.length === 0 && (
            <Alert severity="warning">
              ⚠️ Debes adjuntar al menos una imagen para documentar el cambio de estado
            </Alert>
          )}
        </Box>

        {uploading && (
          <Alert severity="info" icon={<CloudUploadIcon />}>
            Subiendo imágenes al servidor...
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !nuevoEstado || !observaciones.trim() || imagenes.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Procesando...' : 'Confirmar Cambio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
