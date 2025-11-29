import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Chip, Box, CircularProgress, Alert, Avatar, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group'; // kept in case needed later
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import SuccessOverlay from '../common/SuccessOverlay';

// Centralizado
const getApiBase = () => getApiOrigin();

export default function TecnicosList() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetTecnico, setTargetTecnico] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedInfo, setDeletedInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  // Función reutilizable para cargar técnicos
  const fetchTecnicos = async () => {
    try {
      setLoading(true);
      setError('');
      const apiBase = getApiBase();
      
      const res = await axios.get(`${apiBase}/apiticket/tecnico`);
      
      console.log('Datos de técnicos:', res.data); // Para debug
      
      // Manejar diferentes formatos de respuesta
      const tecnicosData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Ordenar ascendente por id_tecnico para mostrar en lista
      const sorted = (tecnicosData || []).slice().sort((a, b) => {
        const ai = (a?.id_tecnico ?? a?.id) || 0;
        const bi = (b?.id_tecnico ?? b?.id) || 0;
        return Number(ai) - Number(bi);
      });
      setItems(sorted);
    } catch (e) {
      console.error('Error al cargar técnicos:', e);
      setError(e.response?.data?.error || e.message || 'Error al cargar técnicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTecnicos();
  }, []);

  const requestDelete = (tecnico) => {
    setTargetTecnico(tecnico);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetTecnico) return;
    const t = targetTecnico;
    setConfirmOpen(false);
    setTargetTecnico(null);
    try {
      const apiBase = getApiBase();
      await axios.delete(`${apiBase}/apiticket/tecnico/${t.id_tecnico}`);
      setItems(prev => prev.filter(x => x.id_tecnico !== t.id_tecnico));
      setDeletedInfo(t);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error('Error eliminando técnico:', err);
      setSnackbar({ open: true, message: err?.response?.data?.error || err?.message || 'No se pudo eliminar', severity: 'error' });
    }
  };

  const closeOverlay = () => {
    setShowDeleteSuccess(false);
    setDeletedInfo(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Profesional - Estilo Panel Ejecutivo */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
        borderRadius: 3,
        p: 2.5,
        mb: 3,
        boxShadow: '0 6px 24px rgba(25, 118, 210, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 60%)',
          pointerEvents: 'none'
        },
        '@keyframes floatAnimation': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              position: 'relative',
              bgcolor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              p: 1.3,
              width: 54,
              height: 54,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
              animation: 'floatAnimation 3s ease-in-out infinite'
            }}>
              <WorkIcon sx={{ fontSize: 30, color: 'white' }} />
              <SettingsIcon sx={{ 
                position: 'absolute', 
                bottom: 6, 
                right: 6, 
                fontSize: 18, 
                color: 'white', 
                opacity: 0.85 
              }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 800, 
                color: 'white', 
                mb: 0.4, 
                letterSpacing: '-0.5px', 
                textShadow: '0 2px 6px rgba(0,0,0,0.2)',
                fontSize: '1.45rem'
              }}>
                {t('technicians.title')}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.95)', 
                fontWeight: 600, 
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.6
              }}>
                <WorkIcon sx={{ fontSize: 15 }} />
                {t('technicians.subtitle')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title={t('technicians.refresh')} arrow>
              <IconButton 
                onClick={fetchTecnicos}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.35)',
                    transform: 'rotate(180deg)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  },
                  transition: 'all 0.5s'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/tecnicos/crear')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '2px solid rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.main'
                },
                transition: 'all 0.3s'
              }}
              >
              {t('technicians.new')}
            </Button>
            
            <Button
              variant={deleteMode ? 'contained' : 'outlined'}
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteMode(v => !v)}
              sx={{
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                borderWidth: 2,
                bgcolor: deleteMode ? 'error.main' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderColor: deleteMode ? 'error.dark' : 'rgba(255, 255, 255, 0.4)',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: deleteMode ? 'error.dark' : 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)'
                },
                transition: 'all 0.3s'
              }}
            >
              {deleteMode ? t('home.cancel') : t('home.delete')}
            </Button>
          </Box>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 400,
          gap: 3
        }}>
          <CircularProgress size={80} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {t('technicians.loading')}
          </Typography>
        </Box>
      )}
      
      {!!error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
            border: '2px solid #ef9a9a',
            '& .MuiAlert-icon': {
              fontSize: 28
            }
          }}
          onClose={() => setError('')}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {error}
          </Typography>
        </Alert>
      )}
      
      {!loading && !error && items.length === 0 && (
            <Card 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
            border: '2px dashed',
            borderColor: 'primary.light',
            py: 8
          }}
        >
            <CardContent sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                mb: 3,
                opacity: 0.7
              }}
            >
              <GroupIcon sx={{ fontSize: 50, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              {t('technicians.noRegistered')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('technicians.startByAdding')}
            </Typography>
              <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/tecnicos/crear')}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                }
              }}
              >
              {t('technicians.createFirst')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {items.map((tech) => {
          const ticketsAbiertos = parseInt(tech.tickets_abiertos) || 0;
          
          // Sistema de colores profesional según carga
          const statusConfig = ticketsAbiertos >= 5 
            ? { 
                gradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                bg: '#ffebee',
                color: '#d32f2f',
                icon: '🔴',
                labelKey: 'saturated',
                border: '#ef9a9a',
                chipBg: '#d32f2f'
              }
            : ticketsAbiertos >= 3 
            ? { 
                gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                bg: '#fff3e0',
                color: '#f57c00',
                icon: '🟡',
                labelKey: 'busy',
                border: '#ffcc80',
                chipBg: '#f57c00'
              }
            : ticketsAbiertos >= 1
            ? {
                gradient: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                bg: '#e3f2fd',
                color: '#1976d2',
                icon: '🔵',
                labelKey: 'working',
                border: '#90caf9',
                chipBg: '#1976d2'
              }
            : { 
                gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                bg: '#e8f5e9',
                color: '#2e7d32',
                icon: '🟢',
                labelKey: 'available',
                border: '#a5d6a7',
                chipBg: '#2e7d32'
              };
          
          return (
            <Grid item xs={12} sm={6} md={4} key={t.id_tecnico}>
              <Card 
                sx={{ 
                  bgcolor: 'white',
                  borderRadius: 3,
                  boxShadow: `0 4px 12px ${statusConfig.color}25`,
                  border: '3px solid',
                  borderColor: statusConfig.border,
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  cursor: deleteMode ? 'default' : 'pointer',
                  '&:hover': { 
                    boxShadow: `0 8px 28px ${statusConfig.color}35`,
                    transform: 'translateY(-8px)',
                    borderColor: statusConfig.color
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: statusConfig.gradient,
                    backgroundSize: '200% 100%',
                    animation: 'gradientShift 3s linear infinite'
                  },
                  '@keyframes gradientShift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '100%': { backgroundPosition: '200% 50%' }
                  },
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.6, transform: 'scale(1.2)' }
                  }
                }} 
                onClick={() => { if (!deleteMode) navigate(`/tecnicos/${tech.id_tecnico}`); }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  {/* Indicador de Estado Animado - ahora arriba del avatar/nombre */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 1.1,
                  }}>
                      <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: statusConfig.bg,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 1.5,
                      border: `2px solid ${statusConfig.border}`,
                      boxShadow: `0 2px 6px ${statusConfig.color}15`,
                      gap: 0.8,
                    }}>
                        <Box sx={{ 
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: statusConfig.color,
                        animation: ticketsAbiertos > 0 ? 'pulse 2s infinite' : 'none'
                      }} />
                      <Typography variant="caption" sx={{ 
                        fontWeight: 800, 
                        color: statusConfig.color,
                        fontSize: '0.65rem'
                      }}>
                        {t(`technicians.status.${statusConfig.labelKey}`)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Botón Eliminar (modo delete) */}
                      {deleteMode && (
                    <Tooltip title={t('technicians.deleteTechnicianTitle', { id: tech.id_tecnico })}> 
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); requestDelete(tech); }}
                        sx={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          bgcolor: 'error.main',
                          color: 'white',
                          zIndex: 2,
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'error.dark',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <DeleteForeverIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Avatar y Nombre */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, mt: deleteMode ? 0.5 : 0 }}>
                    <Box sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2.5,
                      background: statusConfig.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      boxShadow: `0 4px 16px ${statusConfig.color}25`,
                      border: '2px solid white',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: -4,
                        borderRadius: 2.5,
                        border: `2px solid ${statusConfig.border}`,
                        pointerEvents: 'none'
                      }
                    }}>
                      {tech.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, pr: 5 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: '#1e293b', 
                        mb: 0.3,
                        fontSize: '1rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} 
                      title={tech.nombre}
                      >
                        {tech.nombre}
                      </Typography>
                      <Chip 
                        label={`${t('technicians.idPrefix')} ${tech.id_tecnico}`} 
                        size="small" 
                        sx={{ 
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: statusConfig.bg,
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.border}`,
                          '& .MuiChip-label': { px: 0.8 }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Correo */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    mb: 2,
                    p: 1.2,
                    bgcolor: '#f8fafc',
                    borderRadius: 1.5,
                    border: '1px solid #e2e8f0'
                  }}>
                      <EmailIcon sx={{ color: '#64748b', fontSize: 16, flexShrink: 0 }} />
                      <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }} 
                      title={tech.correo || t('technicians.noEmail')}
                    >
                      {tech.correo || t('technicians.noEmail')}
                    </Typography>
                  </Box>

                  {/* Estadística de Carga - Estilo KPI */}
                  <Box sx={{ 
                    bgcolor: statusConfig.bg,
                    borderRadius: 2,
                    p: 2,
                    border: `2px solid ${statusConfig.border}`,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${statusConfig.color}08, transparent)`,
                      pointerEvents: 'none'
                    }
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: '#64748b', 
                      fontWeight: 700, 
                      display: 'block', 
                      mb: 0.8,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.6rem'
                    }}>
                      {t('technicians.ticketsActive')}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 900, 
                      color: statusConfig.color,
                      fontSize: '1.75rem',
                      textShadow: `0 2px 4px ${statusConfig.color}15`,
                      mb: 0.3
                    }}>
                      {ticketsAbiertos}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: statusConfig.color,
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}>
                      {ticketsAbiertos === 0 ? t('technicians.noAssignments') : ticketsAbiertos === 1 ? t('technicians.oneTicket') : t('technicians.multipleTickets', { count: ticketsAbiertos })}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {/* Diálogo confirmación */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('home.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          {t('technicians.confirmDeleteBody', { id: targetTecnico?.id_tecnico })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('home.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t('home.delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
      />

      <SuccessOverlay
        open={showDeleteSuccess}
        mode="delete"
        entity={t('technicians.entity')}
        subtitle={t('technicians.deleteSuccessSubtitle', { id: deletedInfo?.id_tecnico })}
        onClose={closeOverlay}
        actions={[{
          label: t('home.close'),
          onClick: closeOverlay,
          variant: 'contained',
          color: 'error'
        }, {
          label: t('technicians.createTechnician'),
          onClick: () => { closeOverlay(); navigate('/tecnicos/crear'); },
          variant: 'outlined',
          color: 'error'
        }]}
      />
    </Container>
  );
}
