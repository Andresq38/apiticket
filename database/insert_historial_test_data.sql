-- Script para insertar datos de prueba en historial_estados
-- Asegura que haya suficientes registros para demostrar la funcionalidad

USE ticket_system;

-- Verificar si ya existen tickets
SELECT 'Tickets existentes:' as info, COUNT(*) as total FROM ticket;

-- Verificar historial existente
SELECT 'Registros de historial:' as info, COUNT(*) as total FROM historial_estados;

-- Si necesitas insertar tickets de prueba adicionales, descomenta:
/*
INSERT INTO ticket (titulo, descripcion, prioridad, id_estado, id_usuario, id_categoria, id_tecnico)
VALUES 
('Error crítico en servidor web', 'El servidor web principal no responde a peticiones HTTP', 'Alta', 2, '1-1343-0736', 4, 1),
('Solicitud de nueva cuenta de usuario', 'Nuevo empleado requiere acceso al sistema', 'Media', 3, '2-0901-0847', 3, 2),
('Problema con impresora de oficina', 'La impresora HP LaserJet no imprime correctamente', 'Baja', 2, '2-0583-0022', 1, 1);
*/

-- Insertar cambios de estado de ejemplo (simular historial)
-- NOTA: Ajusta los id_ticket según los tickets existentes en tu BD

-- Ejemplo: Ticket #1 - Flujo completo
INSERT IGNORE INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario, fecha_cambio)
VALUES 
(1, 1, 'Ticket creado por el usuario. Esperando asignación de técnico.', '1-1343-0736', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, 'Asignación automática: Técnico seleccionado por especialidad en Red y Conectividad y menor carga de trabajo.', '1-2345-6789', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 3, 'Iniciando diagnóstico del problema. Revisando configuración de red.', '2-0854-0194', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 4, 'Problema identificado y solucionado. Se configuró correctamente el firewall.', '2-0854-0194', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 5, 'Cliente confirma que el problema está resuelto. Ticket cerrado.', '1-1343-0736', DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- Ejemplo: Ticket #2 - En proceso
INSERT IGNORE INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario, fecha_cambio)
VALUES 
(2, 1, 'Reporte inicial del cliente sobre problema de acceso.', '2-0901-0847', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 2, 'Asignado al técnico especializado en Gestión de Usuarios.', '1-2345-6789', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 3, 'Trabajando en la creación de credenciales y permisos.', '1-1659-0626', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- Ejemplo: Ticket #3 - Recientemente asignado
INSERT IGNORE INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario, fecha_cambio)
VALUES 
(3, 1, 'Cliente reporta error en aplicación de gestión.', '4-5566-7788', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(3, 2, 'Ticket asignado manualmente debido a especialización requerida.', '1-2345-6789', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- Insertar imágenes de ejemplo asociadas al historial
-- NOTA: Estas son URLs de placeholder, reemplaza con imágenes reales si es necesario
INSERT IGNORE INTO imagen (url, id_historial, id_usuario)
VALUES 
('placeholder_evidencia_1.jpg', 3, '2-0854-0194'),
('placeholder_solucion_1.jpg', 4, '2-0854-0194'),
('placeholder_diagnostico_2.jpg', 7, '1-1659-0626');

-- Verificar resultados
SELECT 'Historial insertado correctamente:' as resultado;
SELECT he.id_historial, he.id_ticket, e.nombre as estado, 
       he.observaciones, u.nombre as usuario, he.fecha_cambio
FROM historial_estados he
LEFT JOIN estado e ON he.id_estado = e.id_estado
LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
ORDER BY he.fecha_cambio DESC
LIMIT 10;

SELECT 'Imágenes asociadas al historial:' as resultado;
SELECT i.id_imagen, i.url, i.id_historial, u.nombre as subido_por
FROM imagen i
LEFT JOIN usuario u ON i.id_usuario = u.id_usuario
WHERE i.id_historial IS NOT NULL
LIMIT 10;
