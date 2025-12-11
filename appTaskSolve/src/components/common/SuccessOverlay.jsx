import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Stack, Chip, Divider, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

/**
 * SuccessOverlay reusable dialog.
 * Props:
 *  - open: boolean
 *  - mode: 'create' | 'update' | 'delete' | 'assign'
 *  - entity: string (e.g. 'Categoría', 'Técnico', 'Ticket')
 *  - gender: 'masculine' | 'feminine' (default: 'feminine')
 *  - onClose: () => void
 *  - actions: array of { label, onClick, variant ('contained'|'outlined'), color }
 *  - subtitle: optional custom subtitle text
 *  - title: optional custom title
 */
export default function SuccessOverlay({
  open,
  mode = 'create',
  entity = 'Registro',
  gender = 'feminine',
  onClose,
  actions = [],
  subtitle,
  title: customTitle,
  variant = 'default', // 'default' | 'extended'
  details, // optional: { id, prioridad, categoria, etiqueta, extra: [{label, value}] }
  illustration, // optional React node for custom hero instead of default colored circle
}) {
  const isCreate = mode === 'create';
  const isUpdate = mode === 'update';
  const isDelete = mode === 'delete';
  const isAssign = mode === 'assign';
  const isMasculine = gender === 'masculine';

  const verb = isCreate 
    ? (isMasculine ? 'creado' : 'creada') 
    : isUpdate 
      ? (isMasculine ? 'actualizado' : 'actualizada') 
      : isAssign
        ? (isMasculine ? 'asignado' : 'asignada')
        : (isMasculine ? 'eliminado' : 'eliminada');
  
  const title = customTitle || `¡${entity} ${verb}!`;
  
  const defaultSubtitle = isCreate
    ? `${isMasculine ? 'El' : 'La'} ${entity.toLowerCase()} se registró correctamente. Puedes continuar sin abandonar la pantalla.`
    : isUpdate
      ? `Los cambios ${isMasculine ? 'del' : 'de la'} ${entity.toLowerCase()} se guardaron correctamente.`
      : isAssign
        ? `${isMasculine ? 'El' : 'La'} ${entity.toLowerCase()} se asignó correctamente.`
        : `${isMasculine ? 'El' : 'La'} ${entity.toLowerCase()} se eliminó correctamente. Esta acción no se puede deshacer.`;

  const renderHero = () => {
    if (illustration) return (
      <Box sx={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 160, height: 160 }}>
        {illustration}
      </Box>
    );
    return (
      <Box sx={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)' }}>
        <Box sx={{
          width: 100,
          height: 100,
          bgcolor: isCreate ? 'success.main' : isUpdate ? 'warning.main' : isAssign ? 'success.main' : 'error.main',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0))',
            pointerEvents: 'none'
          }
        }}>
          {isCreate && <CheckCircleIcon sx={{ fontSize: 64, color: 'common.white' }} />}
          {isUpdate && <AutoFixHighIcon sx={{ fontSize: 64, color: 'common.white' }} />}
          {isAssign && <CheckCircleIcon sx={{ fontSize: 64, color: 'common.white' }} />}
          {isDelete && <DeleteForeverIcon sx={{ fontSize: 64, color: 'common.white' }} />}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 4,
          py: 4,
          position: 'relative',
          overflow: 'visible',
          textAlign: 'center',
          background: variant === 'extended'
            ? 'linear-gradient(135deg, #ffffff 0%, #f4f9ff 55%)'
            : 'background.paper'
        }
      }}
    >
      {renderHero()}
      <DialogTitle sx={{ mt: 6, fontWeight: 800, textAlign: 'center' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
          {subtitle || defaultSubtitle}
        </Typography>
        {isCreate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            (Los campos se han reiniciado)
          </Typography>
        )}
        {variant === 'extended' && details && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            
            {/* Información principal en chips */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>
                Detalles del Ticket
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mb: 2 }}>
                {details.id && (
                  <Chip 
                    color={isCreate ? 'success' : isUpdate ? 'info' : isAssign ? 'success' : 'error'} 
                    variant="outlined" 
                    label={`ID: #${details.id}`}
                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                  />
                )}
                {details.prioridad && (
                  <Chip 
                    color={details.prioridad === 'Alta' ? 'error' : details.prioridad === 'Media' ? 'warning' : 'info'} 
                    label={`Prioridad: ${details.prioridad}`}
                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                  />
                )}
              </Stack>

              {/* Categoría y Etiqueta */}
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                {details.categoria && (
                  <Chip 
                    variant="outlined" 
                    label={`Categoría: ${details.categoria}`}
                    sx={{ fontSize: '0.85rem' }}
                  />
                )}
                {details.etiqueta && (
                  <Chip 
                    variant="outlined" 
                    label={`Etiqueta: ${details.etiqueta}`}
                    sx={{ fontSize: '0.85rem' }}
                  />
                )}
              </Stack>
            </Box>

            {/* Información adicional */}
            {Array.isArray(details.extra) && details.extra.length > 0 && (
              <Box sx={{ 
                backgroundColor: '#f8f9fa', 
                borderRadius: 2, 
                p: 2, 
                border: '1px solid #e9ecef'
              }}>
                <Stack spacing={1}>
                  {details.extra.map((e, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#495057', minWidth: 100 }}>
                        {e.label}:
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#212529', 
                          fontWeight: 500,
                          maxWidth: '60%',
                          wordBreak: 'break-word',
                          textAlign: 'right'
                        }}
                      >
                        {e.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, flexWrap: 'wrap', gap: 2 }}>
        {actions.map((a, idx) => (
          <Button
            key={idx}
            onClick={a.onClick}
            variant={a.variant || 'contained'}
            color={a.color || (isCreate ? 'success' : isUpdate ? 'warning' : isAssign ? 'success' : 'error')}
            sx={{ minWidth: 160, fontWeight: 700 }}
          >
            {a.label}
          </Button>
        ))}
        {!actions.length && (
          <Button onClick={onClose} variant="contained" color={isCreate ? 'success' : isUpdate ? 'warning' : isAssign ? 'success' : 'error'} sx={{ minWidth: 160, fontWeight: 700 }}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
