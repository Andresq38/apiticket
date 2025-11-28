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
  Paper,
  CircularProgress
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

    try {
      setLoading(true);
      setError('');

      // Cambiar estado sin imágenes (endpoint simple)
      const cambioResponse = await axios.post(`${apiBase}/apiticket/ticket/cambiarEstado`, {
        id_ticket: parseInt(ticket.id_ticket),
        id_estado: parseInt(nuevoEstado),
        observaciones: observaciones.trim(),
        id_usuario_remitente: user.id
      });

      if (!cambioResponse.data.success) {
        throw new Error(cambioResponse.data.message || 'Error al cambiar el estado');
      }

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

        {/* Sección de imágenes - OPCIONAL */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            📎 Adjuntar Imágenes (Opcional)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Puedes agregar imágenes si lo deseas. Formatos: JPG, PNG, GIF, PDF | Máx: 5MB
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
          disabled={loading || !nuevoEstado || !observaciones.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Procesando...' : 'Confirmar Cambio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
