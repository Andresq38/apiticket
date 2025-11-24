import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

/**
 * Velocímetro/Gauge para mostrar SLA Compliance
 * Valores:
 * - 90-100%: Verde (Excelente)
 * - 75-89%: Amarillo (Aceptable)
 * - 0-74%: Rojo (Crítico)
 */
const SLAGauge = ({ value, totalTickets, onTimeTickets }) => {
  const getColor = (val) => {
    if (val >= 90) return '#10b981'; // Verde
    if (val >= 75) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  const getStatus = (val) => {
    if (val >= 90) return { text: 'EXCELENTE', emoji: '🎯' };
    if (val >= 75) return { text: 'ACEPTABLE', emoji: '⚠️' };
    return { text: 'CRÍTICO', emoji: '🚨' };
  };

  const color = getColor(value);
  const status = getStatus(value);

  return (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s',
      '&:hover': {
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        transform: 'translateY(-2px)'
      }
    }}>
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)`
      }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white', 
              fontWeight: 700,
              mb: 0.5,
              fontSize: '1.1rem',
              letterSpacing: 0.5
            }}
          >
            📊 SLA COMPLIANCE
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem'
            }}
          >
            Cumplimiento de tiempos de respuesta
          </Typography>
        </Box>

        {/* Gauge */}
        <Box sx={{ 
          width: 200, 
          height: 200, 
          mx: 'auto',
          mb: 2,
          position: 'relative'
        }}>
          <CircularProgressbar
            value={value}
            text={`${value}%`}
            styles={buildStyles({
              rotation: 0.25,
              strokeLinecap: 'round',
              textSize: '20px',
              pathTransitionDuration: 1,
              pathColor: color,
              textColor: 'white',
              trailColor: 'rgba(255, 255, 255, 0.1)',
              backgroundColor: 'transparent',
            })}
          />
          
          {/* Centro decorativo */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            mt: 3,
            textAlign: 'center'
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.65rem',
                display: 'block'
              }}
            >
              Compliance
            </Typography>
          </Box>
        </Box>

        {/* Status Badge */}
        <Box sx={{ 
          textAlign: 'center',
          bgcolor: `${color}20`,
          border: `2px solid ${color}`,
          borderRadius: 2,
          p: 1.5,
          mb: 2
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: color,
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: 1
            }}
          >
            {status.emoji} {status.text}
          </Typography>
        </Box>

        {/* Métricas detalladas */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          pt: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#10b981',
                fontWeight: 700,
                mb: 0.5
              }}
            >
              {onTimeTickets}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.7rem',
                display: 'block'
              }}
            >
              A tiempo
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#ef4444',
                fontWeight: 700,
                mb: 0.5
              }}
            >
              {totalTickets - onTimeTickets}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.7rem',
                display: 'block'
              }}
            >
              Retrasados
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default SLAGauge;
