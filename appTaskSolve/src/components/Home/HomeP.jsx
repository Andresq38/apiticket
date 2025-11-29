import React, { useState } from 'react';
import { Box, Typography, Container, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/TaskSolve-Logo.jpg';

const authors = [
  'Joseph Rodolfo Segura Mora',
  'Andres Mauricio Castillo Cruz',
  'Andrés Quesada Molina'
];

const imageFallbacks = [logo];

function ImageCard() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const src = imageFallbacks[index];

  return (
    <Box>
      {!failed ? (
        <Box
          component="img"
          src={src}
          alt="TaskSolve"
          sx={{ width: '100%', height: { xs: 360, md: 650 }, objectFit: 'contain', display: 'block'}}
          onError={() => {
            if (index < imageFallbacks.length - 1) setIndex(index + 1);
            else setFailed(true);
          }}
        />
      ) : (
  <Box sx={{ width: '100%', height: { xs: 360, md: 520 }, bgcolor: 'linear-gradient(135deg,#0b3d91,#062c5f)' }} />
      )}
    </Box>
  );
}

const HomeP = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <Box sx={{display: 'flex', justifyContent: 'center', py: 6, gap: 2, flexDirection: 'column', alignItems: 'center' , margin: '0 auto' }}>
        {/* Image card */}
        <Card sx={{ width: { xs: '95%', md: 1000 }, borderRadius: 3, boxShadow: 8, overflow: 'hidden' }}>
          <ImageCard />
        </Card>

        {/* Quote card */}
        <Card sx={{ width: { xs: '95%', md: 1000 }, borderRadius: 3, boxShadow: 8 }}>
          <CardContent sx={{ bgcolor: 'rgba(11,61,145,0.95)', color: '#fff', p: { xs: 4, md: 8 } }}>
            <Typography variant="h2" component="h1" sx={{ color: '#fff', fontWeight: 900, fontStyle: 'italic' }}>
              "{t('homePage.tagline')}"
            </Typography>
            <Typography variant="h6" sx={{ color: '#e6f0ff', mt: 2, fontWeight: 800, fontSize: { xs: 14, md: 18 } }}>
              {t('homePage.description')}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Container sx={{ py: 6 }}>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', mb: 4, fontWeight: 800, color: 'primary.main' }}>
          {t('homePage.authorsTitle')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          {authors.map((name) => {
            const initials = name
              .split(' ')
              .map((s) => s[0] || '')
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <Box key={name} sx={{ width: 260, p: 2, borderRadius: 2, boxShadow: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', fontWeight: 800, fontSize: 20, mb: 1 }}>
                  {initials}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{name}</Typography>
                <Typography variant="caption" color="text.secondary">{t('homePage.teamLabel')}</Typography>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default HomeP;
