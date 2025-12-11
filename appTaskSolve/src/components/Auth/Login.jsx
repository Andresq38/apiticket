import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Fade,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ConfirmationNumber,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const getFrom = (state) => state?.from?.pathname || '/home';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!email || !email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!password || !password.trim()) {
      setError('La contraseña es requerida');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      
      // Normalizar rol para determinar redirección
      const normalizedRole = (user?.rol || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      
      // Redirigir según el rol del usuario
      let redirectPath = '/';
      if (normalizedRole === 'tecnico') {
        redirectPath = '/';
      } else if (normalizedRole === 'administrador') {
        redirectPath = '/';
      } else if (normalizedRole === 'cliente') {
        redirectPath = '/';
      }
      
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('❌ Error en login:', err);
      console.error('❌ Response:', err?.response?.data);
      const msg = err?.response?.data?.error || err?.message || 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      <Fade in timeout={800}>
        <Box
          sx={{
            p: 5,
            maxWidth: 480,
            width: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: 3,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                mb: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                fontSize: '2rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
              }}
            >
              TS
            </Avatar>
            <Typography
              variant="h4"
              fontWeight="700"
              gutterBottom
              sx={{ color: '#1976d2' }}
            >
              Bienvenido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema de Tickets
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ingresa tus credenciales para continuar
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error && error.includes('correo')) setError('');
              }}
              error={error && error.toLowerCase().includes('correo')}
              helperText={error && error.toLowerCase().includes('correo') ? error : ' '}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error && error.includes('contraseña')) setError('');
              }}
              error={error && error.toLowerCase().includes('contraseña')}
              helperText={error && error.toLowerCase().includes('contraseña') ? error : ' '}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 4,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                },
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>

            {/* Quick Login Chips */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5, textAlign: 'center' }}
              >
                Acceso rápido de prueba:
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                flexWrap="wrap"
                gap={1}
              >
                <Chip
                  label="Admin"
                  size="small"
                  onClick={() => quickLogin('rreyes@utn.ac.cr', 'Admin')}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
                <Chip
                  label="Técnico"
                  size="small"
                  onClick={() =>
                    quickLogin('joseph11segmora@gmail.com', 'Tecnico')
                  }
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
                <Chip
                  label="Cliente"
                  size="small"
                  onClick={() => quickLogin('Daynemora@hotmail.com', 'Cliente')}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
              </Stack>
            </Box>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 3 }}
          >
            {t('footer.copy', { year: new Date().getFullYear() })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            {t('footer.developedBy')}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
