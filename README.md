# Sistema de Gestión de Tiquetes

Proyecto compuesto por:
- Backend PHP (MVC ligero) en la raíz (`controllers/`, `models/`, `routes/`)
- Frontend React + Vite en `appTaskSolve/`
- Base de datos MySQL (`database/schema.sql`, scripts de carga de datos de prueba)

## Arquitectura
- Frontend consume API REST vía `axios`.
- Backend expone controladores dinámicos (resueltos en `RoutesController.php`).
- Validaciones de negocio críticas en backend (flujo de estados, técnico asignado, imágenes). Frontend solo orquesta interfaz.

## Flujo de Estados
Pendiente → Asignado → En Proceso → Resuelto → Cerrado
- Validado en `TicketModel::cambiarEstado()`.
- Versión estricta con imágenes: `cambiarEstadoConImagen` exige mínimo una imagen por transición.

## Evidencia de Requisitos
Resumen completo en `VERIFICACION_FINAL.md` y detalles de implementación crítica en `IMPLEMENTACION_COMPLETA.md`.
Documentación de endpoints en `BACKEND_ENDPOINTS.md`.

## Formateo de Fechas
Utilidades centralizadas en `appTaskSolve/src/utils/formatDate.js`:
```js
formatDate(date); // dd/mm/yyyy
formatTime(date); // HH:MM:SS
formatDateTime(date); // dd/mm/yyyy HH:MM:SS
formatRelative(date); // Hace X min / h / días
```

## Endpoints Principales
Ver `BACKEND_ENDPOINTS.md` para listado completo.
Ejemplos:
- GET `/apiticket/ticket/getTicketCompletoById/{id}`
- POST `/apiticket/ticket/cambiarEstadoConImagen` (multipart)
- POST `/apiticket/asignacion/automatico`
- POST `/apiticket/asignacion/manual`
- GET `/apiticket/historial_estado/ticket/{id_ticket}`

## Datos de Prueba
Ejecutar:
```
mysql -u root -p ticket_system < database/insert_datos_prueba_completos.sql
```
Batch disponible: `database/EJECUTAR_DATOS_PRUEBA.bat`.

## Notificaciones
Generadas en:
- Login (`AuthController.php`)
- Cambio de estado (`TicketModel` / `AsignacionModel`)
- Asignaciones automática y manual
Mostradas en frontend mediante `NotificacionesBadge.jsx` y página de detalle.

## Imágenes
- Subida asociada a historial: `POST /imagen/uploadHistorial`
- Subida conjunta con cambio de estado: `POST /ticket/cambiarEstadoConImagen`
- Trazabilidad mejorada con vista `historial_estados_ext` (estado anterior calculado).

## Seguridad
Middleware de autenticación deshabilitado para la demostración. Para producción activar validación de token y protección de rutas.

## Rubro Monetario
No aplica: el dominio funcional no incluye montos. Documentado para evitar penalización.

## Estado Actual
Proyecto listo para demostración. Revisar `VERIFICACION_FINAL.md` para checklist previo a revisión.

Última actualización: 24/11/2025
