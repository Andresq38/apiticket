# 📦 Servicios Frontend - Capa de Abstracción API

**Ubicación:** `appTaskSolve/src/services/`  
**Patrón:** Service Layer Pattern  
**Estado:** ✅ Implementado completamente

---

## 🎯 Objetivo

Centralizar todas las llamadas a la API backend en una capa de servicios reutilizable, mejorando:
- **Mantenibilidad:** Cambios en endpoints se hacen en un solo lugar
- **Testabilidad:** Servicios fáciles de mockear en tests unitarios
- **Consistencia:** Misma interfaz para todas las operaciones API
- **Reutilización:** Componentes comparten lógica de negocio

---

## 📁 Estructura de Servicios

```
appTaskSolve/src/services/
├── TicketService.js          ✅ CRUD tickets + cambios estado
├── AsignacionService.js      ✅ Autotriage + asignación manual
├── NotificacionService.js    ✅ Notificaciones + marcado leído
├── ImageService.js           ✅ Upload imágenes (pre-existente)
└── TecnicoService.js         ✅ Técnicos + especialidades (pre-existente)
```

---

## 🎫 TicketService.js

### Métodos Disponibles

```javascript
import TicketService from '../../services/TicketService';

// CRUD básico
const tickets = await TicketService.getAll({ estado: 'Pendiente' });
const ticket = await TicketService.getById(123);
const nuevo = await TicketService.create({ titulo: 'Bug crítico', ... });
const actualizado = await TicketService.update({ id_ticket: 123, titulo: 'Nuevo título' });
await TicketService.delete(123);

// Cambios de estado
const resultado = await TicketService.cambiarEstado({
  id_ticket: 123,
  id_estado_nuevo: 3,
  observaciones: 'Cambio a En Proceso',
  id_usuario_remitente: 'user123'
});

// Cambios de estado CON imágenes (recomendado)
const formData = new FormData();
formData.append('id_ticket', 123);
formData.append('id_estado_nuevo', 4);
formData.append('observaciones', 'Resuelto con evidencia');
formData.append('imagenes[]', archivoImagen1);
formData.append('imagenes[]', archivoImagen2);
const resultado = await TicketService.cambiarEstadoConImagen(formData);

// Consultas especiales
const prioridades = await TicketService.getPrioridades();
const estados = await TicketService.getEstados();
const porTecnico = await TicketService.getByTecnico('tecnico123');
const porCliente = await TicketService.getByCliente('user456');
const pendientes = await TicketService.getPendientes();
```

### Endpoints Mapeados

| Método | Endpoint Backend |
|--------|------------------|
| `getAll()` | `GET /ticket/getTicketsCompletos` |
| `getById(id)` | `GET /ticket/getTicketCompletoById/{id}` |
| `create(data)` | `POST /ticket` |
| `update(data)` | `PUT /ticket` |
| `delete(id)` | `DELETE /ticket/{id}` |
| `cambiarEstado(data)` | `POST /ticket/cambiarEstado` |
| `cambiarEstadoConImagen(formData)` | `POST /ticket/cambiarEstadoConImagen` |
| `getPrioridades()` | `GET /ticket/prioridades` |
| `getEstados()` | `GET /apiticket/estado` |

---

## 👥 AsignacionService.js

### Métodos Disponibles

```javascript
import AsignacionService from '../../services/AsignacionService';

// Asignación automática (autotriage)
const resultado = await AsignacionService.asignarAutomatico();
// Retorna: { success: true, total_procesados: 5, total_exitosos: 4, errores: [...] }

// Asignación manual
const resultado = await AsignacionService.asignarManual({
  id_ticket: 123,
  id_tecnico: 5,
  justificacion: 'Técnico con mayor experiencia en esta área',
  id_usuario_asigna: 'admin'
});

// Consultas
const ticketsPendientes = await AsignacionService.getTicketsPendientes();
const tecnicos = await AsignacionService.getTecnicosDisponibles();
const historial = await AsignacionService.getHistorial({ id_ticket: 123 });
const asignacionActual = await AsignacionService.getAsignacionActual(123);
const stats = await AsignacionService.getEstadisticas();

// Reasignación
const resultado = await AsignacionService.reasignar({
  id_ticket: 123,
  id_tecnico_nuevo: 8,
  justificacion: 'Técnico anterior de vacaciones',
  id_usuario_asigna: 'admin'
});
```

### Endpoints Mapeados

| Método | Endpoint Backend |
|--------|------------------|
| `asignarAutomatico()` | `POST /asignacion/automatico` |
| `asignarManual(data)` | `POST /asignacion/manual` |
| `getTicketsPendientes()` | `GET /asignacion/pendientes` |
| `getTecnicosDisponibles()` | `GET /asignacion/tecnicos` |
| `getHistorial(filtros)` | `GET /asignacion/historial` |
| `getAsignacionActual(id)` | `GET /asignacion/ticket/{id}` |
| `getEstadisticas()` | `GET /asignacion/estadisticas` |

---

## 🔔 NotificacionService.js

### Métodos Disponibles

```javascript
import NotificacionService from '../../services/NotificacionService';

// Consultas básicas
const todas = await NotificacionService.getAll('user123');
const noLeidas = await NotificacionService.getNoLeidas('user123');
const count = await NotificacionService.contarNoLeidas('user123');
const notif = await NotificacionService.getById(456);

// Marcar como leídas
await NotificacionService.marcarComoLeida(456, 'user123');
await NotificacionService.marcarTodasLeidas('user123');

// CRUD (uso interno/admin)
const nueva = await NotificacionService.crear({
  id_usuario: 'user123',
  tipo_evento: 'Cambio de estado',
  mensaje: 'Tu ticket fue resuelto',
  id_remitente: 'tecnico456'
});
await NotificacionService.eliminar(456);

// Historial con filtros
const historial = await NotificacionService.getHistorial('user123', {
  tipo_evento: 'Asignación',
  estado: 'Leida',
  fecha_desde: '2025-11-01',
  fecha_hasta: '2025-11-24'
});

// Estadísticas
const stats = await NotificacionService.getEstadisticas('user123');
// Retorna: { total: 50, leidas: 45, noLeidas: 5, porTipo: { 'Cambio de estado': 30, ... } }
```

### Endpoints Mapeados

| Método | Endpoint Backend |
|--------|------------------|
| `getAll(userId)` | `GET /notificacion/porUsuario/{userId}` |
| `getNoLeidas(userId)` | `GET /notificacion/noLeidas/{userId}` |
| `contarNoLeidas(userId)` | `GET /notificacion/contarNoLeidas/{userId}` |
| `getById(id)` | `GET /notificacion/{id}` |
| `marcarComoLeida(id, userId)` | `PUT /notificacion/marcarLeida/{id}` |
| `marcarTodasLeidas(userId)` | `POST /notificacion/marcarTodasLeidas` |
| `crear(data)` | `POST /notificacion` |
| `eliminar(id)` | `DELETE /notificacion/{id}` |

### Integración con SSE

**NOTA:** EventSource para notificaciones en tiempo real se maneja directamente en `NotificacionesBadge.jsx`, no en el servicio.

```javascript
// En componentes:
const eventSource = new EventSource(`${apiBase}/apiticket/notificationstream/stream/${userId}`);
eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  // NotificacionService.getNoLeidas() se llama para obtener lista completa
});
```

---

## 🖼️ ImageService.js (Pre-existente)

```javascript
import ImageService from '../../services/ImageService';

const formData = new FormData();
formData.append('imagen', archivoImagen);
formData.append('id_ticket', 123);
const resultado = await ImageService.createImage(formData);
```

---

## 👨‍💻 TecnicoService.js (Pre-existente)

```javascript
import TecnicoService from '../../services/TecnicoService';

const tecnicos = await TecnicoService.getAll();
```

---

## 🔧 Uso en Componentes

### ❌ ANTES: Axios directo (malo)

```jsx
import axios from 'axios';
import { getApiOrigin } from '../../utils/apiBase';

const DetalleTicket = () => {
  const apiBase = getApiOrigin();
  
  const fetchTicket = async () => {
    const res = await axios.get(`${apiBase}/apiticket/ticket/getTicketCompletoById/${id}`);
    setTicket(res.data);
  };
  
  const cambiarEstado = async () => {
    await axios.post(`${apiBase}/apiticket/ticket/cambiarEstado`, {
      id_ticket: id,
      id_estado_nuevo: nuevoEstado,
      observaciones: obs
    });
  };
};
```

### ✅ DESPUÉS: Servicio (bueno)

```jsx
import TicketService from '../../services/TicketService';

const DetalleTicket = () => {
  const fetchTicket = async () => {
    const ticket = await TicketService.getById(id);
    setTicket(ticket);
  };
  
  const cambiarEstado = async () => {
    await TicketService.cambiarEstado({
      id_ticket: id,
      id_estado_nuevo: nuevoEstado,
      observaciones: obs
    });
  };
};
```

**Ventajas:**
- ✅ Sin importar `axios` ni `getApiOrigin` en cada componente
- ✅ Cambios en endpoints solo en `TicketService.js`
- ✅ Fácil mockear en tests: `jest.mock('../../services/TicketService')`
- ✅ TypeScript autocompletion (si migras a TS)

---

## 📊 Componentes Refactorizados

### ✅ Completados

| Componente | Servicios Usados | Estado |
|-----------|------------------|--------|
| `DetalleTicket.jsx` | TicketService | ✅ Refactorizado |
| `AsignacionManager.jsx` | AsignacionService | ✅ Refactorizado |
| `NotificacionesBadge.jsx` | NotificacionService | ✅ Refactorizado |

### 📝 Pendientes (opcional)

| Componente | Servicios a Usar | Prioridad |
|-----------|------------------|-----------|
| `TicketsList.jsx` | TicketService | Media |
| `EditTicket.jsx` | TicketService, ImageService | Media |
| `CreateTicket.jsx` | TicketService | Media |
| `TicketsPorTecnico.jsx` | TicketService, TecnicoService | Baja |
| `TicketsPorCliente.jsx` | TicketService | Baja |

---

## 🧪 Testing con Servicios

### Ejemplo con Jest

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import DetalleTicket from './DetalleTicket';
import TicketService from '../../services/TicketService';

// Mock del servicio
jest.mock('../../services/TicketService');

describe('DetalleTicket', () => {
  it('debe cargar y mostrar ticket', async () => {
    // Arrange
    const mockTicket = { id_ticket: 123, titulo: 'Bug crítico' };
    TicketService.getById.mockResolvedValue(mockTicket);
    
    // Act
    render(<DetalleTicket />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Bug crítico')).toBeInTheDocument();
    });
    expect(TicketService.getById).toHaveBeenCalledWith(123);
  });
  
  it('debe cambiar estado correctamente', async () => {
    // Arrange
    TicketService.cambiarEstado.mockResolvedValue({ success: true });
    render(<DetalleTicket />);
    
    // Act
    fireEvent.click(screen.getByText('Cambiar Estado'));
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '3' } });
    fireEvent.click(screen.getByText('Confirmar'));
    
    // Assert
    await waitFor(() => {
      expect(TicketService.cambiarEstado).toHaveBeenCalled();
    });
  });
});
```

---

## 🔒 Manejo de Errores

Todos los servicios usan `try/catch` en componentes:

```javascript
try {
  const ticket = await TicketService.getById(id);
  setTicket(ticket);
} catch (error) {
  console.error('Error al cargar ticket:', error);
  setError(error.response?.data?.message || 'Error desconocido');
  setSnackbar({ 
    open: true, 
    message: 'No se pudo cargar el ticket', 
    severity: 'error' 
  });
}
```

### Errores Backend Típicos

```javascript
// Backend retorna:
{ success: false, message: 'Ticket no encontrado' }

// Servicio retorna:
response.data // { success: false, message: '...' }

// Componente maneja:
if (!result.success) {
  showError(result.message);
}
```

---

## 🚀 Próximas Mejoras

### 1. Interceptores Axios Globales

```javascript
// services/apiClient.js
import axios from 'axios';
import { getApiOrigin } from '../utils/apiBase';

const apiClient = axios.create({
  baseURL: getApiOrigin(),
  timeout: 30000
});

// Interceptor de request (agregar token)
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response (manejar errores)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. TypeScript Types

```typescript
// services/types/Ticket.ts
export interface Ticket {
  id_ticket: number;
  titulo: string;
  descripcion: string;
  prioridad: 1 | 2 | 3 | 4 | 5;
  id_estado: number;
  fecha_creacion: string;
  id_usuario_reporta: string;
  id_tecnico_asignado?: number;
}

// services/TicketService.ts
import { Ticket } from './types/Ticket';

class TicketService {
  async getById(id: number): Promise<Ticket> {
    const response = await apiClient.get(`/ticket/${id}`);
    return response.data;
  }
}
```

### 3. Cache con React Query

```javascript
// hooks/useTicket.js
import { useQuery, useMutation } from '@tanstack/react-query';
import TicketService from '../services/TicketService';

export const useTicket = (id) => {
  return useQuery(['ticket', id], () => TicketService.getById(id), {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000
  });
};

export const useCambiarEstado = () => {
  return useMutation(TicketService.cambiarEstado, {
    onSuccess: (data, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries(['ticket', variables.id_ticket]);
    }
  });
};
```

---

## ✅ Checklist de Implementación

- [x] TicketService.js creado
- [x] AsignacionService.js creado
- [x] NotificacionService.js creado
- [x] DetalleTicket.jsx refactorizado
- [x] AsignacionManager.jsx refactorizado
- [x] NotificacionesBadge.jsx refactorizado
- [ ] TicketsList.jsx refactorizado (opcional)
- [ ] EditTicket.jsx refactorizado (opcional)
- [ ] CreateTicket.jsx refactorizado (opcional)
- [ ] Interceptores axios globales
- [ ] Migración a TypeScript
- [ ] Tests unitarios de servicios
- [ ] Cache con React Query

---

## 📚 Referencias

- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Query](https://tanstack.com/query/latest)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Estado Final:** ✅ **SERVICIOS FRONTEND IMPLEMENTADOS Y FUNCIONANDO**

**Impacto:** Código más mantenible, testeable y reutilizable. Próxima refactorización de componentes es opcional y no bloqueante.
