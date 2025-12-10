import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

/**
 * RoleProtectedRoute - Componente para proteger rutas según roles
 * @param {array} allowedRoles - Array de roles permitidos (ej: ['Administrador', 'Tecnico'])
 * @param {node} children - Componente hijo a renderizar si tiene permiso
 * @param {string} redirectTo - Ruta de redirección si no tiene permiso (por defecto '/')
 */
export default function RoleProtectedRoute({ allowedRoles = [], children, redirectTo = '/' }) {
  const { user } = useAuth();

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalizar rol del usuario - remover acentos y convertir a minúsculas
  const userRole = (user?.rol || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  // Normalizar roles permitidos para comparación
  const normalizedAllowedRoles = allowedRoles.map(role =>
    role
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
  );

  // Verificar si el rol está permitido
  const hasAccess = allowedRoles.length === 0 || normalizedAllowedRoles.includes(userRole);

  // Si no tiene acceso, mostrar mensaje de acceso denegado
  if (!hasAccess) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          p: 3 
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            textAlign: 'center',
            bgcolor: 'error.light',
            color: 'white'
          }}
        >
          <BlockIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Acceso Denegado
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            No tienes permisos para acceder a esta página.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
            Tu rol actual: <strong>{user?.rol || 'No definido'}</strong>
          </Typography>
          <Button 
            variant="contained" 
            color="inherit" 
            onClick={() => window.location.href = redirectTo}
            sx={{ 
              bgcolor: 'white', 
              color: 'error.main',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Volver al inicio
          </Button>
        </Paper>
      </Box>
    );
  }

  // Si tiene acceso, renderizar el componente hijo
  return <>{children}</>;
}
