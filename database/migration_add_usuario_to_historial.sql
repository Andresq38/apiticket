-- Migración: Agregar campo id_usuario a historial_estados
-- Fecha: 2025-11-22
-- Descripción: Permite registrar qué usuario realizó cada cambio de estado
-- Este campo es CRÍTICO para cumplir con el requerimiento de trazabilidad

USE ticket_system;

-- Agregar la columna id_usuario a la tabla historial_estados
ALTER TABLE historial_estados
ADD COLUMN id_usuario VARCHAR(20) NULL AFTER observaciones,
ADD CONSTRAINT fk_historial_usuario
FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Actualizar registros existentes (opcional - asignar al admin por defecto)
-- UPDATE historial_estados SET id_usuario = '1-2345-6789' WHERE id_usuario IS NULL;

-- Verificar la estructura actualizada
DESCRIBE historial_estados;

-- Consulta de prueba para verificar el historial con usuarios
SELECT he.*, 
       e.nombre AS estado_nombre,
       u.nombre AS usuario_nombre,
       t.titulo AS ticket_titulo
FROM historial_estados he
LEFT JOIN estado e ON he.id_estado = e.id_estado
LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
LEFT JOIN ticket t ON he.id_ticket = t.id_ticket
ORDER BY he.fecha_cambio DESC
LIMIT 5;
