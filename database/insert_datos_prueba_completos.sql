-- ============================================================
-- SCRIPT COMPLETO DE DATOS DE PRUEBA
-- Sistema de Tickets - Datos para Demostración
-- ============================================================
-- Este script crea un conjunto completo de datos de prueba
-- que permite demostrar todas las funcionalidades del sistema
-- ============================================================

USE ticket_system;

-- ============================================================
-- 1. VERIFICAR DATOS BÁSICOS EXISTENTES
-- ============================================================

SELECT '=== VERIFICANDO DATOS EXISTENTES ===' AS Info;

SELECT CONCAT('Usuarios: ', COUNT(*)) AS total FROM usuario;
SELECT CONCAT('Técnicos: ', COUNT(*)) AS total FROM tecnico;
SELECT CONCAT('Categorías: ', COUNT(*)) AS total FROM categoria_ticket;
SELECT CONCAT('Etiquetas: ', COUNT(*)) AS total FROM etiqueta;
SELECT CONCAT('Estados: ', COUNT(*)) AS total FROM estado;
SELECT CONCAT('SLAs: ', COUNT(*)) AS total FROM sla;

-- ============================================================
-- 2. INSERTAR TICKETS DE PRUEBA
-- ============================================================

SELECT '=== INSERTANDO TICKETS DE PRUEBA ===' AS Info;

-- Ticket 1: Pendiente (sin asignar)
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, comentario)
VALUES (
    'Equipo de cómputo no enciende',
    'La computadora del escritorio 305 no arranca. Se escucha un pitido continuo al presionar el botón de encendido.',
    'Alta',
    '1-1343-0736',  -- Dayne Mora (Cliente)
    1,  -- Categoría: Gestión y Soporte de Equipamiento Tecnológico
    1,  -- Estado: Pendiente
    DATE_SUB(NOW(), INTERVAL 2 HOUR),
    'Es urgente, necesito la computadora para trabajar hoy'
);
SET @ticket1 = LAST_INSERT_ID();

-- Ticket 2: Asignado recientemente
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, comentario)
VALUES (
    'Instalación de software de diseño',
    'Requiero instalación de Adobe Creative Suite en mi estación de trabajo. Tengo la licencia corporativa.',
    'Media',
    '1-1343-0736',
    2,  -- Categoría: Soporte de Software y Aplicaciones
    2,  -- Estado: Asignado
    DATE_SUB(NOW(), INTERVAL 5 HOUR),
    'Necesito comenzar con el proyecto de diseño lo antes posible'
);
SET @ticket2 = LAST_INSERT_ID();

-- Ticket 3: En proceso
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, comentario)
VALUES (
    'Problemas de conectividad en red WiFi',
    'La conexión WiFi se cae constantemente en la sala de reuniones del 3er piso. Afecta a todas las reuniones virtuales.',
    'Alta',
    '2-0987-0654',  -- Otro usuario
    4, -- Categoría: Red y Conectividad
    3,  -- Estado: En Proceso
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'Los clientes se quejan de las interrupciones en las videollamadas'
);
SET @ticket3 = LAST_INSERT_ID();

-- Ticket 4: Resuelto
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, comentario)
VALUES (
    'Recuperación de contraseña de correo',
    'No puedo acceder a mi cuenta de correo corporativo. Olvidé mi contraseña.',
    'Media',
    '3-0654-0321',
    3, -- Categoría: Gestión de Usuarios y Accesos
    4,  -- Estado: Resuelto
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    'Urgente, necesito acceder a correos importantes'
);
SET @ticket4 = LAST_INSERT_ID();

-- Ticket 5: Cerrado
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, fecha_cierre, comentario)
VALUES (
    'Configuración de impresora de red',
    'La impresora HP LaserJet del departamento de contabilidad no imprime desde mi computadora.',
    'Baja',
    '1-1343-0736',
    1,  -- Categoría: Gestión y Soporte de Equipamiento Tecnológico
    5,  -- Estado: Cerrado
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'Problema resuelto satisfactoriamente. Todo funcionando correctamente.'
);
SET @ticket5 = LAST_INSERT_ID();

-- Ticket 6: Crítico y reciente
INSERT INTO ticket (titulo, descripcion, prioridad, id_usuario, id_categoria, id_estado, fecha_creacion, comentario)
VALUES (
    'Servidor de base de datos caído',
    'El servidor principal de base de datos no responde. Aplicaciones críticas están fuera de servicio.',
    'Alta',
    '4-1234-5678',
    5, -- Categoría: Servicios Especiales
    2,  -- Estado: Asignado
    DATE_SUB(NOW(), INTERVAL 30 MINUTE),
    'CRÍTICO: Afecta a toda la operación. Clientes no pueden acceder al sistema.'
);
SET @ticket6 = LAST_INSERT_ID();

SELECT CONCAT('✓ ', ROW_COUNT(), ' tickets creados exitosamente') AS resultado;

-- ============================================================
-- 3. INSERTAR HISTORIAL DE ESTADOS COMPLETO
-- ============================================================

SELECT '=== CREANDO HISTORIAL DE ESTADOS ===' AS Info;

-- Historial Ticket 1 (Pendiente)
INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES (@ticket1, 1, 'Ticket creado por el cliente', DATE_SUB(NOW(), INTERVAL 2 HOUR), '1-1343-0736');

INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES 
(@ticket2, 1, 'Ticket creado', DATE_SUB(NOW(), INTERVAL 5 HOUR), '1-1343-0736'),
(@ticket2, 2, 'Asignado a técnico especializado en software. Se procederá con la instalación según procedimiento estándar.', DATE_SUB(NOW(), INTERVAL 4 HOUR), 'admin');

INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES 
(@ticket3, 1, 'Ticket creado - Problema de conectividad reportado', DATE_SUB(NOW(), INTERVAL 1 DAY), '2-0987-0654'),
(@ticket3, 2, 'Asignado a equipo de redes. Se verificará el access point de la sala.', DATE_SUB(NOW(), INTERVAL 23 HOUR), 'admin'),
(@ticket3, 3, 'Técnico en sitio. Diagnosticando problema. Se detectó interferencia con otro dispositivo. Procediendo con reconfiguración.', DATE_SUB(NOW(), INTERVAL 20 HOUR), '1-0987-6543');

INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES 
(@ticket4, 1, 'Solicitud de recuperación de contraseña', DATE_SUB(NOW(), INTERVAL 3 DAY), '3-0654-0321'),
(@ticket4, 2, 'Asignado a soporte de usuarios. Se verificará identidad antes de proceder.', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 30 MINUTE, 'admin'),
(@ticket4, 3, 'Identidad verificada. Generando nueva contraseña temporal. Se enviará por canal seguro.', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 HOUR, '2-0987-6543'),
(@ticket4, 4, 'Contraseña restablecida exitosamente. Usuario confirmó acceso. Se solicitó cambio de contraseña en primer inicio de sesión.', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR, '2-0987-6543');

INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES 
(@ticket5, 1, 'Problema con impresora de red', DATE_SUB(NOW(), INTERVAL 5 DAY), '1-1343-0736'),
(@ticket5, 2, 'Asignado a técnico de hardware. Se verificarán drivers y configuración de red.', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 1 HOUR, 'admin'),
(@ticket5, 3, 'Técnico en sitio. Se detectó driver desactualizado. Procediendo con actualización e instalación de controladores correctos.', DATE_SUB(NOW(), INTERVAL 4 DAY), '3-5678-9012'),
(@ticket5, 4, 'Drivers actualizados. Impresora configurada correctamente. Pruebas de impresión exitosas.', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR, '3-5678-9012'),
(@ticket5, 5, 'Cliente confirmó que todo funciona correctamente. Caso cerrado.', DATE_SUB(NOW(), INTERVAL 1 DAY), '1-1343-0736');

INSERT INTO historial_estados (id_ticket, id_estado, observaciones, fecha_cambio, id_usuario)
VALUES 
(@ticket6, 1, 'CRÍTICO: Servidor de BD caído', DATE_SUB(NOW(), INTERVAL 30 MINUTE), '4-1234-5678'),
(@ticket6, 2, 'URGENTE: Asignado a equipo senior de infraestructura. Prioridad máxima. Se está iniciando diagnóstico de servicios y logs del servidor.', DATE_SUB(NOW(), INTERVAL 25 MINUTE), 'admin');

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros de historial creados') AS resultado;

-- ============================================================
-- 4. INSERTAR ASIGNACIONES DE TICKETS
-- ============================================================

SELECT '=== CREANDO ASIGNACIONES ===' AS Info;

-- Asignar Ticket 2 a un técnico
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo_asignacion, justificacion)
VALUES (@ticket2, 1, DATE_SUB(NOW(), INTERVAL 4 HOUR), 'Manual', 
'Técnico especializado en instalación de software corporativo. Cuenta con certificación Adobe y experiencia en despliegue de Creative Suite.');

-- Asignar Ticket 3 a técnico de redes
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo_asignacion, justificacion)
VALUES (@ticket3, 2, DATE_SUB(NOW(), INTERVAL 23 HOUR), 'Automatico', 
'Sistema AutoTriage: Técnico con especialidad en redes y menor carga de trabajo. Puntaje: 3450. SLA crítico: 60 min.');

-- Asignar Ticket 4 (ya resuelto)
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo_asignacion, justificacion)
VALUES (@ticket4, 1, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 30 MINUTE, 'Automatico', 
'Sistema AutoTriage: Técnico disponible con especialidad en gestión de usuarios. Puntaje: 2890.');

-- Asignar Ticket 5 (cerrado)
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo_asignacion, justificacion)
VALUES (@ticket5, 3, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 1 HOUR, 'Manual', 
'Técnico con amplia experiencia en configuración de impresoras y dispositivos de red. Disponibilidad inmediata.');

-- Asignar Ticket 6 (crítico)
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo_asignacion, justificacion)
VALUES (@ticket6, 2, DATE_SUB(NOW(), INTERVAL 25 MINUTE), 'Manual', 
'CRÍTICO: Técnico senior con experiencia en servidores de base de datos. Único disponible con credenciales para acceso a infraestructura crítica.');

SELECT CONCAT('✓ ', ROW_COUNT(), ' asignaciones creadas') AS resultado;

-- ============================================================
-- 5. VERIFICAR RESULTADOS
-- ============================================================

SELECT '=== RESUMEN FINAL ===' AS Info;

SELECT 
    '📊 ESTADÍSTICAS GENERALES' AS categoria,
    CONCAT('Tickets creados: ', COUNT(*)) AS detalle
FROM ticket
WHERE id_ticket IN (@ticket1, @ticket2, @ticket3, @ticket4, @ticket5, @ticket6)

UNION ALL

SELECT 
    '📝 HISTORIAL',
    CONCAT('Cambios de estado registrados: ', COUNT(*))
FROM historial_estados
WHERE id_ticket IN (@ticket1, @ticket2, @ticket3, @ticket4, @ticket5, @ticket6)

UNION ALL

SELECT 
    '👨‍💻 ASIGNACIONES',
    CONCAT('Técnicos asignados: ', COUNT(*))
FROM asignacion
WHERE id_ticket IN (@ticket1, @ticket2, @ticket3, @ticket4, @ticket5, @ticket6)

UNION ALL

SELECT 
    '📋 DISTRIBUCIÓN POR ESTADO',
    CONCAT(e.nombre, ': ', COUNT(t.id_ticket), ' ticket(s)')
FROM estado e
LEFT JOIN ticket t ON e.id_estado = t.id_estado 
    AND t.id_ticket IN (@ticket1, @ticket2, @ticket3, @ticket4, @ticket5, @ticket6)
GROUP BY e.id_estado, e.nombre;

-- ============================================================
-- 6. INFORMACIÓN PARA PRUEBAS
-- ============================================================

SELECT '=== IDs DE TICKETS CREADOS PARA PRUEBAS ===' AS Info;

SELECT 
    @ticket1 AS 'Ticket 1 (Pendiente)',
    @ticket2 AS 'Ticket 2 (Asignado)',
    @ticket3 AS 'Ticket 3 (En Proceso)',
    @ticket4 AS 'Ticket 4 (Resuelto)',
    @ticket5 AS 'Ticket 5 (Cerrado)',
    @ticket6 AS 'Ticket 6 (Crítico)';

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                  ✅ DATOS DE PRUEBA CREADOS                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ✓ 6 Tickets en diferentes estados                            ║
║  ✓ Historial completo de cambios de estado                    ║
║  ✓ 5 Asignaciones (manual y automática)                       ║
║  ✓ Tickets con prioridades Alta, Media y Baja                 ║
║  ✓ Casos desde Pendiente hasta Cerrado                        ║
║  ✓ Incluye caso CRÍTICO reciente                              ║
║                                                                ║
║  📌 Listo para demostración al profesor                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS '🎉 RESULTADO';
