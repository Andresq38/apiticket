import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Divider,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Tooltip
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CommentIcon from '@mui/icons-material/Comment';
import { formatDateTime } from '../../utils/format';
import { getApiOrigin } from '../../utils/apiBase';

export default function HistorialTimeline({ historial }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);

  const apiBase = getApiOrigin();
  const UPLOADS_BASE = `${apiBase}/apiticket/uploads`;

  // Función para obtener la URL completa de la imagen
  const getImageUrl = (imagen) => {
    if (!imagen) return '';
    const path = imagen.url || imagen.imagen || imagen.path || '';
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/apiticket/')) return `${apiBase}${path}`;
    return `${UPLOADS_BASE}/${path}`;
  };

  // Configuración de iconos y colores por estado
  const getEstadoConfig = (estadoNombre) => {
    const configs = {
      'Pendiente': {
        icon: <HourglassEmptyIcon />,
        color: 'primary',
        bgcolor: '#fff3e0',
        borderColor: '#ff9800',
        dotColor: '#ff9800'
      },
      'Asignado': {
        icon: <AssignmentIcon />,
        color: 'primary',
        bgcolor: '#e3f2fd',
        borderColor: '#2196f3',
        dotColor: '#2196f3'
      },
      'En Proceso': {
        icon: <BuildIcon />,
        color: 'primary',
        bgcolor: '#e8eaf6',
        borderColor: '#3f51b5',
        dotColor: '#3f51b5'
      },
      'Resuelto': {
        icon: <CheckCircleIcon />,
        color: 'success',
        bgcolor: '#e8f5e9',
        borderColor: '#4caf50',
        dotColor: '#4caf50'
      },
      'Cerrado': {
        icon: <CloseIcon />,
        color: 'default',
        bgcolor: '#f5f5f5',
        borderColor: '#9e9e9e',
        dotColor: '#9e9e9e'
      }
    };
    return configs[estadoNombre] || configs['Pendiente'];
  };

  const handleImageClick = (imagen) => {
    setSelectedImage(imagen);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedImage(null);
  };

  if (!historial || historial.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
        <HourglassEmptyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay historial de cambios disponible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Los cambios de estado se registrarán aquí
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Timeline position="alternate">
        {historial.map((item, index) => {
          const config = getEstadoConfig(item.estado_nombre || item.estado);
          const isFirst = index === 0;
          const isLast = index === historial.length - 1;
          const hasImages = item.imagenes && item.imagenes.length > 0;

          return (
            <TimelineItem key={item.id_historial}>
              <TimelineOppositeContent
                sx={{ m: 'auto 0' }}
                align="right"
                variant="body2"
                color="text.secondary"
              >
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'primary.main' }}>
                  {formatDateTime(item.fecha_cambio)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">
                    {item.usuario_nombre || 'Sistema'}
                  </Typography>
                </Box>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot 
                  sx={{ 
                    backgroundColor: config.dotColor,
                    boxShadow: 3,
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {config.icon}
                </TimelineDot>
                {!isLast && <TimelineConnector sx={{ bgcolor: config.borderColor }} />}
              </TimelineSeparator>

              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card
                  elevation={3}
                  sx={{
                    bgcolor: config.bgcolor,
                    borderLeft: `4px solid ${config.borderColor}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={item.estado_nombre || item.estado}
                        color={config.color}
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
                      {isFirst && (
                        <Chip
                          label="Más reciente"
                          size="small"
                          sx={{ 
                            bgcolor: '#1976d2', 
                            color: 'white',
                            fontWeight: 600,
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      )}
                    </Box>

                    {/* Observaciones/Comentario */}
                    {item.observaciones && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CommentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Observaciones:
                          </Typography>
                        </Box>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            borderLeft: '3px solid',
                            borderLeftColor: config.borderColor
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                            "{item.observaciones}"
                          </Typography>
                        </Paper>
                      </Box>
                    )}

                    {/* Galería de Imágenes */}
                    {hasImages && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ImageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Evidencias adjuntas ({item.imagenes.length}):
                          </Typography>
                        </Box>
                        <Grid container spacing={1}>
                          {item.imagenes.map((img) => (
                            <Grid item xs={6} sm={4} md={3} key={img.id_imagen}>
                              <Card
                                elevation={2}
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: 4
                                  },
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onClick={() => handleImageClick(img)}
                              >
                                <CardMedia
                                  component="img"
                                  height="120"
                                  image={getImageUrl(img)}
                                  alt={`Evidencia ${img.id_imagen}`}
                                  sx={{ objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo disponible%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <Tooltip title="Click para ampliar">
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: 0,
                                      transition: 'opacity 0.3s',
                                      '&:hover': {
                                        opacity: 1
                                      }
                                    }}
                                  >
                                    <ZoomInIcon sx={{ color: 'white', fontSize: 32 }} />
                                  </Box>
                                </Tooltip>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Información adicional del usuario */}
                    {item.usuario_correo && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <Typography variant="caption" color="text.secondary">
                          👤 Responsable: {item.usuario_nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📧 {item.usuario_correo}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>

      {/* Diálogo para ver imagen ampliada */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Evidencia Ampliada</Typography>
          <IconButton onClick={handleCloseImageDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={getImageUrl(selectedImage)}
                alt={`Imagen ${selectedImage.id_imagen}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 8
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
              {selectedImage.descripcion && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {selectedImage.descripcion}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}
      </style>
    </Box>
  );
}
