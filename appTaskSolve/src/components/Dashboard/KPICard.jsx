import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * Tarjeta de KPI mejorada con:
 * - Animación de conteo
 * - Mini sparkline
 * - Indicador de tendencia
 * - Comparativa temporal
 */
const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend, 
  trendValue, 
  sparklineData = [],
  unit = '',
  alert = false 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animación de conteo
  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1 segundo
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const isPositiveTrend = trend === 'up';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <Card sx={{ 
      borderRadius: 3,
      background: gradient,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      transition: 'all 0.3s',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': { 
        transform: 'translateY(-4px)', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
      },
      '&::before': alert ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #ff6b6b, #ee5a6f)',
        animation: 'pulse 2s infinite'
      } : {}
    }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                mb: 1.5, 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {title}
              {alert && (
                <Chip 
                  label="¡ALERTA!" 
                  size="small"
                  sx={{ 
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              )}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 800, 
                  color: 'white', 
                  lineHeight: 1,
                  fontSize: '3rem',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}
              >
                {displayValue}
              </Typography>
              {unit && (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontWeight: 600 
                  }}
                >
                  {unit}
                </Typography>
              )}
            </Box>

            {/* Indicador de tendencia */}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Chip
                  icon={<TrendIcon sx={{ fontSize: 16, color: 'white !important' }} />}
                  label={`${isPositiveTrend ? '+' : ''}${trendValue}%`}
                  size="small"
                  sx={{
                    height: 24,
                    bgcolor: isPositiveTrend 
                      ? 'rgba(16, 185, 129, 0.25)' 
                      : 'rgba(239, 68, 68, 0.25)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: `1.5px solid ${isPositiveTrend ? '#10b981' : '#ef4444'}`,
                    '& .MuiChip-icon': {
                      ml: 0.5
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  vs ayer
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 2, 
            p: 1.5, 
            display: 'flex',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {Icon && <Icon sx={{ fontSize: 32, color: 'white' }} />}
          </Box>
        </Box>

        {/* Mini Sparkline */}
        {sparklineData.length > 0 && (
          <Box sx={{ 
            height: 50, 
            mt: 2, 
            pt: 2, 
            borderTop: '1px solid rgba(255, 255, 255, 0.2)' 
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="rgba(255, 255, 255, 0.9)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.65rem',
                display: 'block',
                textAlign: 'center',
                mt: 0.5
              }}
            >
              Últimos 7 días
            </Typography>
          </Box>
        )}
      </CardContent>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </Card>
  );
};

export default KPICard;
