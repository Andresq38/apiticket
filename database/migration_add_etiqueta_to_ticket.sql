-- Agregar columna id_etiqueta a la tabla ticket
ALTER TABLE ticket
ADD COLUMN id_etiqueta INT NULL AFTER id_categoria;

-- Agregar clave foránea
ALTER TABLE ticket
ADD CONSTRAINT fk_ticket_etiqueta
FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- Actualizar los registros existentes con una etiqueta por defecto de su categoría
UPDATE ticket t
JOIN categoria_etiqueta ce ON ce.id_categoria_ticket = t.id_categoria
SET t.id_etiqueta = ce.id_etiqueta
WHERE t.id_etiqueta IS NULL
LIMIT 1;
