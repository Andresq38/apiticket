import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        textAlign: 'center', 
        bgcolor: '#f5f5f5', 
        borderTop: '1px solid #e0e0e0',
        mt: 'auto'
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        © {new Date().getFullYear()} Sistema de Tiquetes. Todos los derechos reservados.
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Desarrollado por Joseph Segura • Andres Quesada • Andres Castillo
      </Typography>
    </Box>
  );
};

export default Footer;
