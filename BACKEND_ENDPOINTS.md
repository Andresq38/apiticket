# 📡 Endpoints Backend - Sistema de Tiquetes

Base URL: `/apiticket/`

## Autenticación
- POST `auth/login` → Body: { id_usuario, password } | Respuesta: token + datos usuario
- POST `auth/logout` → Invalida sesión (si se maneja en frontend)

## Tiquetes
- GET `ticket` → Listado resumido
- GET `ticket/getTicketCompletoById/{id}` → Detalle completo (usuario, técnico, SLA, historial, imágenes)
- GET `ticket/getTicketByTecnico/{id_tecnico}` → Tickets asignados a técnico
- GET `ticket/getTicketByUsuario/{id_usuario}` → Tickets creados por usuario
- GET `ticket/prioridades` → Enum de prioridades
- POST `ticket` → Crear (Body JSON)
- PUT `ticket/update` → Actualizar campos (Body JSON)
- PUT `ticket/cambiarEstado` → Cambiar estado (validación flujo + imagen mínima estados ≥3)
- POST `ticket/cambiarEstadoConImagen` → Multipart: estado + una o varias imágenes obligatorias
- DELETE `ticket/delete/{id}` → Eliminar (cascade historial/imágenes) 

## Asignación
- GET `asignacion/pendientes` → Tickets sin técnico (estado Pendiente)
- GET `asignacion/tecnicos` → Técnicos disponibles + especialidades
- POST `asignacion/automatico` → AutoTriage (opcional body { id_ticket })
- POST `asignacion/manual` → Body: { id_ticket, id_tecnico, justificacion }

## Historial de Estados
- GET `historial_estado` → Listado global
- GET `historial_estado/get/{id_historial}` → Registro individual
- GET `historial_estado/ticket/{id_ticket}` → Historial completo extendido (incluye estado anterior vía vista)
- POST `historial_estado` → Crear manual (normalmente gestionado por lógica de ticket/asignación)

## Imágenes
- GET `imagen` → Listado imágenes
- GET `imagen/get/{id_imagen}` → Una imagen
- GET `imagen/getByTicket/{id_ticket}` → Imágenes asociadas al ticket
- GET `imagen/historial/{id_historial}` → Imágenes asociadas a un historial
- POST `imagen/create` → Subir simple (ticket)
- POST `imagen/uploadHistorial` → Subir y asociar a historial existente
- DELETE `imagen/delete/{id_imagen}` → Eliminar imagen física y registro

## Notificaciones
- GET `notificacion` → Todas (según implementación)
- GET `notificacion/usuario/{id_usuario}` → No leídas / todas del usuario
- POST `notificacion/marcarLeida/{id_notificacion}` → Cambiar estado a Leída
- POST `notificacion/marcarTodasLeidas/{id_usuario}` → Masivo
*Generadas automáticamente en login, cambio de estado y asignación.*

## Catálogos
- GET `categoria_ticket` → Categorías
- GET `estado` → Estados
- GET `sla` → SLAs
- GET `etiqueta` → Etiquetas
- GET `especialidad` → Especialidades

## Reglas de Flujo de Estados
Flujo estricto: Pendiente (1) → Asignado (2) → En Proceso (3) → Resuelto (4) → Cerrado (5)
- Validado en backend (`TicketModel::cambiarEstado`)
- Requiere técnico asignado para avanzar > Pendiente
- Requiere ≥1 imagen previa para ingresar a estados ≥3
- Endpoint estricto con imágenes: fuerza al menos una evidencia por transición

## Respuestas Comunes
Formato típico éxito:
```json
{ "success": true, "data": { ... } }
```
Formato error:
```json
{ "success": false, "message": "Descripción del error" }
```

## Seguridad
Actualmente middleware de autenticación deshabilitado (demo). Para producción activar verificación de token en `RoutesController`.

## Notas
- Todas las fechas entregadas en formato UTC desde MySQL y normalizadas en frontend con `formatDateTime`.
- No existen valores monetarios: rubro marcado como "No aplica".
- Vista `historial_estados_ext` mejora trazabilidad sin alterar inserciones.

---
Última actualización: 24/11/2025