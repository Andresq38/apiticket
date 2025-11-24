-- =====================================================================
-- MIGRACIÓN CRÍTICA: Corrección de Esquema y Tabla de Asignación
-- Fecha: 2025-11-24
-- Descripción: Corrige estructura tabla imagen y crea tabla asignacion
-- =====================================================================

USE ticket_system;

-- =====================================================================
-- PARTE 1: CORRECCIÓN TABLA IMAGEN
-- =====================================================================
-- La tabla imagen en BD real tiene estructura: imagen(id_imagen, id_ticket, imagen)
-- Esta estructura es correcta y funcional con ImagenModel.
-- El schema.sql está desactualizado con imagen(url, id_historial, id_usuario).
-- NO SE MODIFICA LA TABLA REAL - Solo se documenta la corrección en schema.sql

-- Verificar estructura actual (debe coincidir con lo esperado):
-- DESCRIBE imagen;
-- Resultado esperado:
-- +------------+--------------+------+-----+---------+----------------+
-- | Field      | Type         | Null | Key | Default | Extra          |
-- +------------+--------------+------+-----+---------+----------------+
-- | id_imagen  | int(11)      | NO   | PRI | NULL    | auto_increment |
-- | id_ticket  | int(11)      | NO   | MUL | NULL    |                |
-- | imagen     | varchar(255) | NO   |     | NULL    |                |
-- +------------+--------------+------+-----+---------+----------------+

-- NOTA: La tabla historial_imagen permite asociar imágenes con historial de estados
-- manteniendo compatibilidad con el modelo actual


-- =====================================================================
-- PARTE 2: CREACIÓN TABLA ASIGNACION (AUDITORÍA DE ASIGNACIONES)
-- =====================================================================

-- Crear tabla para registro completo de asignaciones de tickets
CREATE TABLE IF NOT EXISTS asignacion (
  id_asignacion INT NOT NULL AUTO_INCREMENT,
  id_ticket INT NOT NULL,
  id_tecnico INT NOT NULL,
  fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo ENUM('Automatica','Manual') NOT NULL,
  justificacion TEXT NOT NULL,
  puntaje_calculado INT NULL COMMENT 'Puntaje del algoritmo autotriage: (prioridad*1000) - tiempoRestanteSLA',
  id_usuario_asigna VARCHAR(20) NULL COMMENT 'Usuario que realizó la asignación manual (NULL si es automática)',
  PRIMARY KEY (id_asignacion),
  FOREIGN KEY (id_ticket) REFERENCES ticket(id_ticket)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_tecnico) REFERENCES tecnico(id_tecnico)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario_asigna) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_ticket (id_ticket),
  INDEX idx_tecnico (id_tecnico),
  INDEX idx_fecha (fecha_asignacion),
  INDEX idx_metodo (metodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 
COMMENT='Registro de auditoría completo de asignaciones de tickets a técnicos';


-- =====================================================================
-- PARTE 3: CREACIÓN DE VISTA PARA CONSULTAS DE ASIGNACIÓN
-- =====================================================================

-- Vista para facilitar consultas de asignaciones con información completa
CREATE OR REPLACE VIEW asignacion_completa AS
SELECT 
  a.id_asignacion,
  a.id_ticket,
  t.titulo AS ticket_titulo,
  t.prioridad AS ticket_prioridad,
  a.id_tecnico,
  u_tec.nombre AS tecnico_nombre,
  u_tec.correo AS tecnico_correo,
  a.fecha_asignacion,
  a.metodo,
  a.justificacion,
  a.puntaje_calculado,
  a.id_usuario_asigna,
  u_asig.nombre AS usuario_asigna_nombre,
  cat.nombre AS categoria_nombre,
  e.nombre AS estado_nombre
FROM asignacion a
JOIN ticket t ON a.id_ticket = t.id_ticket
JOIN tecnico tec ON a.id_tecnico = tec.id_tecnico
JOIN usuario u_tec ON tec.id_usuario = u_tec.id_usuario
LEFT JOIN usuario u_asig ON a.id_usuario_asigna = u_asig.id_usuario
JOIN categoria_ticket cat ON t.id_categoria = cat.id_categoria
JOIN estado e ON t.id_estado = e.id_estado
ORDER BY a.fecha_asignacion DESC;


-- =====================================================================
-- PARTE 4: MIGRACIÓN DE DATOS EXISTENTES (OPCIONAL)
-- =====================================================================

-- Si existen tickets ya asignados sin registro en tabla asignacion,
-- se pueden migrar extrayendo información del historial_estados:

-- Descomentar para ejecutar migración de datos históricos:
/*
INSERT INTO asignacion (id_ticket, id_tecnico, fecha_asignacion, metodo, justificacion, id_usuario_asigna)
SELECT 
  t.id_ticket,
  t.id_tecnico,
  COALESCE(
    (SELECT MIN(he.fecha_cambio) 
     FROM historial_estados he 
     WHERE he.id_ticket = t.id_ticket AND he.id_estado = 2),
    t.fecha_creacion
  ) AS fecha_asignacion,
  'Manual' AS metodo,
  CONCAT('Migración automática de asignación existente. Observaciones del historial: ', 
         COALESCE(
           (SELECT he.observaciones 
            FROM historial_estados he 
            WHERE he.id_ticket = t.id_ticket AND he.id_estado = 2 
            ORDER BY he.fecha_cambio ASC LIMIT 1),
           'Sin observaciones'
         )
  ) AS justificacion,
  (SELECT he.id_usuario 
   FROM historial_estados he 
   WHERE he.id_ticket = t.id_ticket AND he.id_estado = 2 
   ORDER BY he.fecha_cambio ASC LIMIT 1
  ) AS id_usuario_asigna
FROM ticket t
WHERE t.id_tecnico IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM asignacion a WHERE a.id_ticket = t.id_ticket
  );
*/


-- =====================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================================

-- Verificar creación correcta de la tabla
SELECT 'Tabla asignacion creada correctamente' AS resultado
FROM information_schema.tables 
WHERE table_schema = 'ticket_system' 
  AND table_name = 'asignacion';

-- Contar registros migrados (si se ejecutó la migración de datos)
-- SELECT COUNT(*) AS total_asignaciones FROM asignacion;

-- Verificar vista
SELECT 'Vista asignacion_completa creada correctamente' AS resultado
FROM information_schema.views 
WHERE table_schema = 'ticket_system' 
  AND table_name = 'asignacion_completa';

COMMIT;
