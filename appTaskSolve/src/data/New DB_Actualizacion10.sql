-- Schema and seed for ticket_system (created by assistant)
-- =================================================================
-- CREACIÓN DE LA BASE DE DATOS Y ESTRUCTURA (DDL)
-- =================================================================

-- Configuración Inicial
DROP DATABASE IF EXISTS ticket_system;
CREATE DATABASE ticket_system DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE ticket_system;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Tablas Sin Dependencias
CREATE TABLE rol (
  id_rol INT NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sla (
  id_sla INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  tiempo_respuesta_min INT NOT NULL,
  tiempo_respuesta_max INT NOT NULL,
  tiempo_resolucion_min INT NOT NULL,
  tiempo_resolucion_max INT NOT NULL,
  PRIMARY KEY (id_sla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE estado (
  id_estado INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (id_estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE etiqueta (
  id_etiqueta INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_etiqueta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Tablas que Dependen de otras
CREATE TABLE usuario (
  id_usuario VARCHAR(20) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  id_rol INT NOT NULL,
  PRIMARY KEY (id_usuario),
  FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE tecnico (
  id_tecnico INT NOT NULL AUTO_INCREMENT,
  id_usuario VARCHAR(20) NOT NULL,
  disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
  carga_trabajo INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_tecnico),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE categoria_ticket (
  id_categoria INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  id_sla INT NOT NULL,
  PRIMARY KEY (id_categoria),
  FOREIGN KEY (id_sla) REFERENCES sla(id_sla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- NOTA: La tabla especialidad se crea sin la FK de categoria para poder alterar
-- la tabla en el siguiente paso y agregar la FK correctamente.
CREATE TABLE especialidad (
  id_especialidad INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  id_sla INT NOT NULL,
  PRIMARY KEY (id_especialidad),
  FOREIGN KEY (id_sla) REFERENCES sla(id_sla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Tabla intermedia para relacionar técnicos con especialidades (relación muchos a muchos)
CREATE TABLE tecnico_especialidad (
  id_tecnico INT NOT NULL,
  id_especialidad INT NOT NULL,
  PRIMARY KEY (id_tecnico, id_especialidad),
  FOREIGN KEY (id_tecnico) REFERENCES tecnico(id_tecnico)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Tablas Intermedias / De Transacción (Dependencias Múltiples)
CREATE TABLE categoria_etiqueta (
  id_categoria_ticket INT NOT NULL,
  id_etiqueta INT NOT NULL,
  PRIMARY KEY (id_categoria_ticket, id_etiqueta),
  FOREIGN KEY (id_categoria_ticket) REFERENCES categoria_ticket(id_categoria)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE ticket (
  id_ticket INT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME DEFAULT NULL,
  prioridad ENUM('Baja','Media','Alta') NOT NULL DEFAULT 'Media',
  id_estado INT NOT NULL,
  id_usuario VARCHAR(20) NOT NULL,
  id_categoria INT NOT NULL,
  id_etiqueta INT NOT NULL,
  id_especialidad INT NOT NULL,
  id_tecnico INT DEFAULT NULL,
  puntaje TINYINT,
  comentario TEXT,
  PRIMARY KEY (id_ticket),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_categoria) REFERENCES categoria_ticket(id_categoria),
  FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad),
  FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta),
  FOREIGN KEY (id_tecnico) REFERENCES tecnico(id_tecnico),
  FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE historial_estados (
  id_historial INT NOT NULL AUTO_INCREMENT,
  id_ticket INT NOT NULL,
  id_estado INT NOT NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  PRIMARY KEY (id_historial),
  FOREIGN KEY (id_ticket) REFERENCES ticket(id_ticket)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE imagen (
  id_imagen INT NOT NULL AUTO_INCREMENT,
  id_ticket INT NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_imagen),
  FOREIGN KEY (id_ticket) REFERENCES ticket(id_ticket)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE notificacion (
  id_notificacion INT NOT NULL AUTO_INCREMENT,
  id_usuario_destinatario VARCHAR(20) NOT NULL,
  id_usuario_remitente VARCHAR(20),
  tipo_evento VARCHAR(100) NOT NULL,
  mensaje TEXT,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('Leida','No Leida') DEFAULT 'No Leida',
  PRIMARY KEY (id_notificacion),
  FOREIGN KEY (id_usuario_destinatario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario_remitente) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE historial_imagen (
  id_historial_estado INT NOT NULL,
  id_imagen INT NOT NULL,
  PRIMARY KEY (id_historial_estado, id_imagen),
  FOREIGN KEY (id_historial_estado) REFERENCES historial_estados(id_historial)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_imagen) REFERENCES imagen(id_imagen)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- =================================================================
-- PASO 2: MODIFICACIONES ESTRUCTURALES (ALTER TABLE)
-- (Se ejecuta después de crear las tablas, pero antes de insertar datos)
-- =================================================================

-- Agregamos la columna 'id_categoria' y la clave foránea a 'especialidad'
ALTER TABLE especialidad
ADD COLUMN id_categoria INT NOT NULL;

ALTER TABLE especialidad
ADD CONSTRAINT fk_especialidad_categoria
FOREIGN KEY (id_categoria)
REFERENCES categoria_ticket(id_categoria)
ON UPDATE CASCADE
ON DELETE CASCADE;

CREATE OR REPLACE VIEW historial_estados_ext AS
SELECT 
    t.id_historial,
    t.id_ticket,
    t.id_estado_actual,
    t.id_estado_anterior,
    t.fecha_cambio,
    t.observaciones,
    ea.nombre AS estado_anterior_nombre,
    ec.nombre AS estado_actual_nombre
FROM (
    SELECT
        he.id_historial,
        he.id_ticket,
        he.id_estado AS id_estado_actual,
        LAG(he.id_estado) OVER (PARTITION BY he.id_ticket ORDER BY he.fecha_cambio ASC) AS id_estado_anterior,
        he.fecha_cambio,
        he.observaciones
    FROM historial_estados he
) t
LEFT JOIN estado ec ON ec.id_estado = t.id_estado_actual
LEFT JOIN estado ea ON ea.id_estado = t.id_estado_anterior;

CREATE TABLE asignacion (
  id_asignacion INT NOT NULL AUTO_INCREMENT,
  id_ticket INT NOT NULL,
  id_tecnico INT NOT NULL,
  fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo ENUM('Automatica','Manual') NOT NULL,
  justificacion TEXT NOT NULL,
  puntaje_calculado INT NULL COMMENT 'Puntaje del algoritmo autotriage',
  id_usuario_asigna VARCHAR(20) NULL COMMENT 'Usuario que realizó la asignación manual',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- =================================================================
-- PASO 3: INSERCIÓN ORDENADA DE DATOS (DML)
-- (Se respeta el orden de las claves foráneas)
-- =================================================================

-- 3.1: Tablas Padre de Nivel Cero

-- TABLA: rol
INSERT INTO rol (id_rol, descripcion)
VALUES (1, 'Administrador'), (2, 'Técnico'), (3, 'Cliente');

-- TABLA: estado
INSERT INTO estado (nombre)
VALUES ('Pendiente'), ('Asignado'), ('En Proceso'), ('Resuelto'), ('Cerrado');

-- TABLA: sla
INSERT INTO sla (id_sla, nombre, tiempo_respuesta_min, tiempo_respuesta_max, tiempo_resolucion_min, tiempo_resolucion_max)
VALUES
(1, 'SLA Crítico - 30 min / 4h', 5, 30, 60, 240), -- Se agregaron valores min, necesarios por la estructura DDL
(2, 'SLA Alto - 1h / 6h', 10, 60, 120, 360),
(3, 'SLA Medio - 2h / 8h', 30, 120, 240, 480),
(4, 'SLA Bajo - 4h / 48h', 60, 240, 480, 2880),
(5, 'SLA Especial - 4h / Evaluación', 60, 240, 60, NULL);


-- 3.2: Tablas que dependen de SLA
-- TABLA: categoria_ticket (Depende de sla)
INSERT INTO categoria_ticket (id_categoria, nombre, id_sla)
VALUES
(1,'Gestión y Soporte de Equipamiento Tecnológico', 4), -- SLA Bajo
(2,'Soporte de Software y Aplicaciones', 3), -- SLA Medio
(3,'Gestión de Usuarios y Accesos', 1), -- SLA Crítico
(4,'Red y Conectividad', 2), -- SLA Alto
(5,'Servicios Especiales /Requerimientos Específicos', 5); -- SLA Especial


-- 3.3: Tablas que dependen de ROL
-- TABLA: usuario (Depende de rol)
INSERT INTO usuario (id_usuario, nombre, correo, password, id_rol)
VALUES
('1-1343-0736', 'Dayne Mora', 'Daynemora@hotmail.com', SHA2('Cliente', 256), 3),
('2-0901-0847', 'Aarón Segura', 'Aaronsegmora03@gmail.com', SHA2('Cliente', 256), 3),
('2-0583-0022', 'Rodolfo Segura', 'Rodolfosegluna@gmail.com', SHA2('Cliente', 256), 3),
('4-5566-7788', 'Ana Rodríguez', 'Anarodriguez@gmail.com', SHA2('Cliente', 256), 3),
('5-9900-2211', 'María Sandi', 'Mariasandi@gmail.com', SHA2('Cliente', 256), 3),
('1-2345-6789', 'Roosvelt Reyes', 'rreyes@utn.ac.cr', SHA2('Admin', 256), 1),
('2-0854-0194', 'Joseph Segura', 'joseph11segmora@gmail.com', SHA2('Tecnico', 256), 2),
('1-1659-0626', 'Andrés Quesada', 'Asquesadamo@est.utn.ac.cr', SHA2('Tecnico', 256), 2),
('4-0252-0286', 'Andrés Castillo', 'andresscastilloo81@gmail.com', SHA2('Tecnico', 256), 2);

-- 3.4: Tablas que dependen de USUARIO
-- TABLA: tecnico (Depende de usuario)

INSERT INTO tecnico (id_usuario)
VALUES
('2-0854-0194'), -- id_tecnico = 1
('1-1659-0626'), -- id_tecnico = 2
('4-0252-0286'); -- id_tecnico = 3


-- 3.5: Tablas que dependen de CATEGORIA_TICKET y SLA
-- TABLA: especialidad (Depende de sla y categoria_ticket)

-- Categoría 1: Gestión y Soporte de Equipamiento Tecnológico (id_categoria=1, id_sla=4)
INSERT INTO especialidad (nombre, descripcion, id_sla, id_categoria) VALUES
('Instalación y estaciones de trabajo', 'Instalación y estaciones de trabajo', 4, 1),
('Diagnóstico y reparación', 'Diagnóstico y reparación', 4, 1),
('Mantenimiento programado', 'Mantenimiento programado', 4, 1),
('Control y actualización del inventario', 'Control y actualización del inventario', 4, 1),
('Gestión de logística', 'Gestión de logística', 4, 1),
('Evaluación técnica para renovación', 'Evaluación técnica para renovación', 4, 1);

-- Categoría 2: Soporte de Software y Aplicaciones (id_categoria=2, id_sla=3)
INSERT INTO especialidad (nombre, descripcion, id_sla, id_categoria) VALUES
('Soporte de software corporativo', 'Soporte de software corporativo', 3, 2),
('Gestión de incidencias en aplicaciones', 'Gestión de incidencias en aplicaciones', 3, 2),
('Instalación y configuración de programas', 'Instalación y configuración de programas', 3, 2),
('Diagnóstico de errores', 'Diagnóstico de errores', 3, 2);

-- Categoría 3: Gestión de Usuarios y Accesos (id_categoria=3, id_sla=1)
INSERT INTO especialidad (nombre, descripcion, id_sla, id_categoria) VALUES
('Gestión de directorio activo', 'Gestión de directorio activo', 1, 3),
('Administración de cuentas corporativas', 'Administración de cuentas corporativas', 1, 3),
('Seguridad y control de accesos', 'Seguridad y control de accesos', 1, 3),
('Políticas de contraseñas', 'Políticas de contraseñas', 1, 3);

-- Categoría 4: Red y Conectividad (id_categoria=4, id_sla=2)
INSERT INTO especialidad (nombre, descripcion, id_sla, id_categoria) VALUES
('Diagnóstico de red', 'Diagnóstico de red', 2, 4),
('Configuración de VPN', 'Configuración de VPN', 2, 4),
('Soporte de conexión remota', 'Soporte de conexión remota', 2, 4),
('Configuración de dispositivos de red', 'Configuración de dispositivos de red', 2, 4);

-- Categoría 5: Servicios Especiales / Requerimientos Específicos (id_categoria=5, id_sla=5)
INSERT INTO especialidad (nombre, descripcion, id_sla, id_categoria) VALUES
('Atención personalizada', 'Atención personalizada', 5, 5),
('Evaluación técnica previa', 'Evaluación técnica previa', 5, 5),
('Coordinación con otras áreas', 'Coordinación con otras áreas', 5, 5),
('Documentación de cambios', 'Documentación de cambios', 5, 5);


-- 3.6: Tablas de Etiquetas
-- TABLA: etiqueta
INSERT INTO etiqueta (nombre)
VALUES
-- Categoría 1 (id_etiqueta 1 al 6)
('Asignación y devolución de equipos'),
('Inventario de hardware'),
('Preparación y configuración de equipos nuevos'),
('Mantenimiento preventivo y correctivo'),
('Reparación de equipo'),
('Retiro o baja de equipos obsoletos'),
-- Categoría 2 (id_etiqueta 7 al 10)
('Instalación de software'),
('Actualizaciones'),
('Problemas con Office, correo, ERP, etc.'),
('Soporte de aplicaciones empresariales'),
-- Categoría 3 (id_etiqueta 11 al 14)
('Creación de usuarios'),
('Restablecimiento de contraseñas'),
('Asignación de roles y permisos'),
('Acceso a sistemas internos'),
-- Categoría 4 (id_etiqueta 15 al 18)
('Conexión a red LAN/Wi-Fi'),
('VPN'),
('Impresoras de red'),
('Problemas de conectividad'),
-- Categoría 5 (id_etiqueta 19 al 22)
('Instalaciones especiales'),
('Solicitudes de mejoras'),
('Cambios en la configuración del equipo'),
('Requerimientos fuera de soporte estándar');

-- TABLA INTERMEDIA: categoria_etiqueta (Depende de categoria_ticket y etiqueta)
-- Categoría 1 (id_categoria = 1)
INSERT INTO categoria_etiqueta (id_categoria_ticket, id_etiqueta) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6);
-- Categoría 2 (id_categoria = 2)
INSERT INTO categoria_etiqueta (id_categoria_ticket, id_etiqueta) VALUES
(2, 7), (2, 8), (2, 9), (2, 10);
-- Categoría 3 (id_categoria = 3)
INSERT INTO categoria_etiqueta (id_categoria_ticket, id_etiqueta) VALUES
(3, 11), (3, 12), (3, 13), (3, 14);
-- Categoría 4 (id_categoria = 4)
INSERT INTO categoria_etiqueta (id_categoria_ticket, id_etiqueta) VALUES
(4, 15), (4, 16), (4, 17), (4, 18);
-- Categoría 5 (id_categoria = 5)
INSERT INTO categoria_etiqueta (id_categoria_ticket, id_etiqueta) VALUES
(5, 19), (5, 20), (5, 21), (5, 22);

-- =================================================================
-- PASO 3.7: INSERCIÓN DE DATOS PARA LA TABLA TICKET (SIN VALORES NULL)
-- Se elimina el estado 'Pendiente' (1) para asegurar asignación ('id_tecnico')
-- y se proporcionan valores para 'fecha_cierre', 'puntaje' y 'comentario'
-- en los estados 'Resuelto' (4) y 'Cerrado' (5).
-- =================================================================

-- 1. Ticket 'En Proceso' (Asignado/Sin Cerrar) - ESTATUS: ASIGNADO (2)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre, -- NULL en Asignado (2)
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje, -- NULL en Asignado (2)
    comentario -- NULL en Asignado (2)
)
VALUES
(
    100001,
    'Error al acceder al sistema',
    'El usuario reporta que no puede iniciar sesión en la aplicación corporativa. Urgente.',
    '2025-10-21 16:53:36', -- Fecha fija para referencia
    NULL,
    'Alta',
    2, -- Estado: Asignado
    '2-0901-0847', -- Cliente: Aarón Segura
    2, -- Categoría: Soporte de Software y Aplicaciones
    7,
    7,
    1, -- Técnico: Joseph Segura
    NULL,
    NULL
);

-- 2. Ticket Cerrado (Completado y Evaluado) - ESTATUS: CERRADO (5)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre,
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje,
    comentario
)
VALUES
(
    100002,
    'Solicitud de mouse inalámbrico',
    'Se requiere un mouse nuevo para la estación de trabajo debido a fallas en el actual.',
    '2025-10-16 18:53:36',
    '2025-10-18 18:53:36', -- Fecha de cierre provista
    'Baja',
    5, -- Estado: Cerrado
    '1-1343-0736', -- Cliente: Dayne Mora
    1, -- Categoría: Equipamiento Tecnológico
    1,
    1,
    3, -- Técnico: Andrés Castillo
    5, -- Puntuación: 5/5
    'Excelente gestión, la entrega del equipo fue rápida y sin problemas.' -- Comentario provisto
);

-- 3. Ticket en Proceso - ESTATUS: EN PROCESO (3)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre, -- NULL en En Proceso (3)
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje, -- NULL en En Proceso (3)
    comentario -- NULL en En Proceso (3)
)
VALUES
(
    100003,
    'Configuración de acceso VPN',
    'Necesito acceso a la VPN para trabajar de forma remota.',
    '2025-10-20 18:53:36',
    NULL,
    'Media',
    3, -- Estado: En Proceso
    '2-0583-0022', -- Cliente: Rodolfo Segura
    4, -- Categoría: Red y Conectividad
    15,
    15,
    2, -- Técnico: Andrés Quesada
    NULL,
    NULL
);

-- 4. Ticket Resuelto (Pendiente de Cierre) - ESTATUS: RESUELTO (4)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre,
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje, -- NULL en Resuelto (4)
    comentario -- NULL en Resuelto (4)
)
VALUES
(
    100004,
    'Restablecimiento de contraseña de correo',
    'Olvidé mi contraseña de correo y no puedo restablecerla. Necesito acceso urgente.',
    '2025-10-21 12:53:36',
    '2025-10-21 13:15:00', -- Proporcionamos una fecha de resolución (fecha_cierre)
    'Alta',
    4, -- Estado: Resuelto
    '4-5566-7788', -- Cliente: Ana Rodríguez
    3, -- Categoría: Gestión de Usuarios y Accesos
    11,
    11,
    1, -- Técnico: Joseph Segura
    NULL,
    NULL
);

-- 5. Ticket Recién Asignado - ESTATUS: ASIGNADO (2)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre, -- NULL en Asignado (2)
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje, -- NULL en Asignado (2)
    comentario -- NULL en Asignado (2)
)
VALUES
(
    100005,
    'Requerimiento de instalación de software especial',
    'Se requiere la instalación de un software de diseño que no está en la lista estándar.',
    '2025-10-21 18:53:36',
    NULL,
    'Media',
    2, -- Estado: Asignado
    '2-0901-0847', -- Cliente: Aarón Segura
    5, -- Categoría: Servicios Especiales
    22,
    22,
    2, -- Técnico: Andrés Quesada (Asignado inmediatamente)
    NULL,
    NULL
);

-- 6. Otro Ticket Cerrado (Puntuación Baja) - ESTATUS: CERRADO (5)
INSERT INTO ticket (
    id_ticket,
    titulo,
    descripcion,
    fecha_creacion,
    fecha_cierre,
    prioridad,
    id_estado,
    id_usuario,
    id_categoria,
    id_especialidad,
    id_etiqueta,
    id_tecnico,
    puntaje,
    comentario
)
VALUES
(
    100006,
    'Problema de lentitud en PC',
    'La computadora está extremadamente lenta desde la última actualización.',
    '2025-10-11 18:53:36',
    '2025-10-16 18:53:36',
    'Media',
    5, -- Estado: Cerrado
    '1-1343-0736', -- Cliente: Dayne Mora
    1, -- Categoría: Equipamiento Tecnológico
    1,
    1,
    3, -- Técnico: Andrés Castillo
    2, -- Puntuación: 2/5
    'El técnico no pudo resolver el problema por completo; solo reinstaló el sistema operativo.' -- Comentario provisto
);

INSERT INTO `imagen` (`id_imagen`, `id_ticket`, `imagen`) VALUES
(1, 100001, 'ticket1_1.jpg'),
(2, 100001, 'ticket1_2.jpg'),
(3, 100001, 'ticket1_3.jpg'),
(4, 100005, 'ticket5_1.jpg'),
(5, 100005, 'ticket5_2.jpg');

/*cambios realiados al día 10-23-2025 a la tabla ticket*/
ALTER TABLE ticket
ADD COLUMN fecha_asignacion DATETIME NULL;

UPDATE ticket
SET fecha_asignacion = NOW()
WHERE id_ticket = 100001;
