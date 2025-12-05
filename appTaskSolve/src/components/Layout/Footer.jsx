import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

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
        {t('footer.copy', { year: new Date().getFullYear() })}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        {t('footer.developedBy')}
      </Typography>
    </Box>
  );
};

export default Footer;
