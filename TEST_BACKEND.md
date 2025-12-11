# Verificación del Backend

## Pruebas para confirmar que el backend funciona

### 1. **Prueba básica (sin autenticación)**
Abrir en el navegador:
```
http://localhost:81/apiticket/auth/status
```
**Esperado:** JSON con `"status": "ok"` y mensaje confirmando que el backend funciona.

### 2. **Prueba de login (POST)**
Usar Postman o hacer desde la consola del navegador:

```javascript
fetch('http://localhost:81/apiticket/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'rreyes@utn.ac.cr',
    password: 'Admin'
  })
})
.then(r => r.json())
.then(data => console.log('Respuesta:', data))
.catch(err => console.error('Error:', err));
```

**Esperado:** Respuesta con `token` y datos del usuario.

### 3. **Prueba con ruta protegida (sin token)**
```
http://localhost:81/apiticket/ticket
```
**Esperado:** 401 Unauthorized (confirma que la protección funciona)

---

## Mensajes normales que NO son errores:

| URL | Respuesta | ¿Es normal? |
|-----|-----------|-------------|
| `http://localhost:81/apiticket/` | "Controlador no especificado" | SÍ - falta el controlador |
| `http://localhost:81/apiticket` | "Controlador no especificado" | SÍ - falta el controlador |
| `http://localhost:81/apiticket/ticket` | 401 Unauthorized | SÍ - ruta protegida sin token |
| `http://localhost:81/` | Página XAMPP dashboard | SÍ - raíz de Apache |

---

## Cómo saber si hay un problema REAL:

1. **Desde la aplicación React** → hacer login
2. Si el login funciona → backend OK ✅
3. Si aparece 404 o error de conexión → revisar:
   - ¿Apache está corriendo en el puerto 81?
   - ¿El archivo `.env` tiene `VITE_API_BASE=http://localhost:81`?
   - ¿Se reinició el servidor de Vite después de cambiar `.env`?

---

## 📝 Resumen:

- **"Controlador no especificado"** = Backend funcionando correctamente
- El backend espera rutas como: `/apiticket/{controlador}/{accion}`
- No está diseñado para acceder directamente a `/apiticket/`
- La aplicación React es la que hace las peticiones correctas automáticamente
