-- Migración: Crear vista historial_estados_ext
-- La vista original usa LAG() en JOIN que no es soportado en MySQL 8.0
-- Se simplifica para incluir solo datos esenciales del historial

USE ticket_system;

-- Crear vista simplificada
CREATE OR REPLACE VIEW historial_estados_ext AS
SELECT 
  he.id_historial,
  he.id_ticket,
  he.id_estado AS id_estado_actual,
  ec.nombre AS estado_actual_nombre,
  NULL AS id_estado_anterior,
  NULL AS estado_anterior_nombre,
  he.fecha_cambio,
  he.observaciones,
  he.id_usuario
FROM historial_estados he
LEFT JOIN estado ec ON ec.id_estado = he.id_estado
ORDER BY he.id_ticket, he.fecha_cambio ASC;

-- Verificación
SELECT 'Vista historial_estados_ext creada correctamente' AS resultado;
SELECT COUNT(*) AS total_registros FROM historial_estados_ext;
