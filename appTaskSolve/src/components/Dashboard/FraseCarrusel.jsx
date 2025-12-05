import React, { useEffect, useRef, useState } from 'react';
import frases from '../../data/frases.json';
import { Card, Box, Typography, IconButton, Fade } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const INTERVAL = 15000; // 15 segundos

export default function FraseCarrusel() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * frases.length));
  const [paused, setPaused] = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % frases.length);
      }, INTERVAL);
    }
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const handlePrev = () => {
    setIndex(i => (i - 1 + frases.length) % frases.length);
    setPaused(true);
  };
  const handleNext = () => {
    setIndex(i => (i + 1) % frases.length);
    setPaused(true);
  };

  const frase = frases[index];
  const isTip = frase.tipo === 'tip';
  const icon = isTip ? '💡' : '🌟';
  const headerText = isTip ? 'Tip rápido' : 'Frase del día';
  const headerColor = isTip ? '#1976d2' : '#F5A000';

  return (
    <Card elevation={6} sx={{
      maxWidth: 520,
      mx: 'auto',
      my: 2,
      p: 0,
      borderRadius: 4,
      background: 'linear-gradient(135deg, #e3f2fd 0%, #fffde7 100%)',
      boxShadow: '0 8px 32px rgba(25,118,210,0.13)',
      border: '2px solid #e0e7ef',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 140
    }}>
      {/* Encabezado */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        px: 3,
        py: 1.5,
        borderBottom: '2px solid #e0e7ef',
        background: 'linear-gradient(90deg, #1976d2 0%, #F5A000 100%)',
        boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
      }}>
        <Box sx={{ fontSize: 28, animation: 'pulseTip 1.8s infinite', color: headerColor }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white', fontSize: '1.15rem', letterSpacing: '-0.5px', textShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>{headerText}</Typography>
      </Box>
      {/* Texto principal */}
      <Box sx={{ flex: 1, textAlign: 'center', px: 4, py: 3 }}>
        <Fade in>
          <Typography variant="h6" sx={{ fontWeight: 500, color: '#222', fontSize: '1.18rem', lineHeight: 1.5 }}>
            {frase.texto}
          </Typography>
        </Fade>
      </Box>
      {/* Botones de navegación */}
      <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(25,118,210,0.08)', '&:hover': { bgcolor: '#1976d2', color: 'white' }, transition: 'all .2s' }}>
        <ChevronLeftIcon fontSize="large" />
      </IconButton>
      <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(25,118,210,0.08)', '&:hover': { bgcolor: '#1976d2', color: 'white' }, transition: 'all .2s' }}>
        <ChevronRightIcon fontSize="large" />
      </IconButton>
      {/* Indicadores de página */}
      <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
        {frases.map((_, i) => (
          <Box key={i} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: i === index ? '#1976d2' : '#bdbdbd', opacity: i === index ? 1 : 0.5, boxShadow: i === index ? '0 0 6px #1976d2' : 'none', transition: 'all .2s' }} />
        ))}
      </Box>
      {/* Animación para el icono */}
      <style>{`
        @keyframes pulseTip {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>
    </Card>
  );
}
