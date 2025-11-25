-- ============================================================
-- VERIFICACIÓN DE DATOS MÍNIMOS (3+ registros por tabla)
-- Sistema de Tickets - Control de Calidad
-- ============================================================
-- Este script verifica que todas las tablas cumplan con el
-- requerimiento de tener al menos 3 registros precargados
-- ============================================================

USE ticket_system;

SELECT '═══════════════════════════════════════════════════' AS separador;
SELECT '     VERIFICACIÓN DE DATOS MÍNIMOS (3+ registros)  ' AS titulo;
SELECT '═══════════════════════════════════════════════════' AS separador;

-- Verificación con indicadores visuales
SELECT 
    'usuarios' AS tabla,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END AS estado,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END AS observacion
FROM usuario

UNION ALL

SELECT 
    'tecnicos',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM tecnico

UNION ALL

SELECT 
    'categorias',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM categoria_ticket

UNION ALL

SELECT 
    'etiquetas',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM etiqueta

UNION ALL

SELECT 
    'especialidades',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM especialidad

UNION ALL

SELECT 
    'estados',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes (5 estados estándar)'
        WHEN COUNT(*) > 0 THEN 'Revisar estructura de estados'
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM estado

UNION ALL

SELECT 
    'slas',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM sla

UNION ALL

SELECT 
    'tickets',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'Tiene datos suficientes'
        WHEN COUNT(*) > 0 THEN CONCAT('Faltan ', 3 - COUNT(*), ' registros')
        ELSE 'Ejecutar insert_datos_prueba_completos.sql'
    END
FROM ticket

UNION ALL

SELECT 
    'roles',
    COUNT(*),
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ CUMPLE'
        WHEN COUNT(*) > 0 THEN '⚠️  INSUFICIENTE'
        ELSE '❌ VACÍA'
    END,
    CASE 
        WHEN COUNT(*) >= 2 THEN 'Tiene roles básicos (Admin, Usuario, Técnico)'
        WHEN COUNT(*) > 0 THEN 'Faltan roles básicos'
        ELSE 'Tabla vacía - CRÍTICO'
    END
FROM rol;

SELECT '═══════════════════════════════════════════════════' AS separador;

-- Resumen ejecutivo
SELECT 
    '📊 RESUMEN EJECUTIVO' AS categoria,
    COUNT(*) AS total_tablas,
    SUM(CASE WHEN total >= 3 THEN 1 ELSE 0 END) AS tablas_ok,
    SUM(CASE WHEN total < 3 THEN 1 ELSE 0 END) AS tablas_pendientes,
    CONCAT(
        ROUND(SUM(CASE WHEN total >= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1), 
        '%'
    ) AS porcentaje_cumplimiento
FROM (
    SELECT COUNT(*) AS total FROM usuario
    UNION ALL SELECT COUNT(*) FROM tecnico
    UNION ALL SELECT COUNT(*) FROM categoria_ticket
    UNION ALL SELECT COUNT(*) FROM etiqueta
    UNION ALL SELECT COUNT(*) FROM especialidad
    UNION ALL SELECT COUNT(*) FROM estado
    UNION ALL SELECT COUNT(*) FROM sla
    UNION ALL SELECT COUNT(*) FROM ticket
    UNION ALL SELECT COUNT(*) FROM rol
) AS counts;

SELECT '═══════════════════════════════════════════════════' AS separador;

-- Detalle de tickets por estado (si existen)
SELECT 
    '📋 DISTRIBUCIÓN DE TICKETS POR ESTADO' AS titulo;

SELECT 
    e.nombre AS estado,
    COUNT(t.id_ticket) AS cantidad_tickets,
    CONCAT(
        ROUND(COUNT(t.id_ticket) * 100.0 / (SELECT COUNT(*) FROM ticket), 1),
        '%'
    ) AS porcentaje
FROM estado e
LEFT JOIN ticket t ON e.id_estado = t.id_estado
GROUP BY e.id_estado, e.nombre
ORDER BY e.id_estado;

SELECT '═══════════════════════════════════════════════════' AS separador;

-- Recomendaciones
SELECT '🔍 RECOMENDACIONES' AS titulo;

SELECT 
    CASE
        WHEN (SELECT COUNT(*) FROM usuario) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Agregar más usuarios (clientes)'
        WHEN (SELECT COUNT(*) FROM tecnico) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Agregar más técnicos'
        WHEN (SELECT COUNT(*) FROM ticket) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Ejecutar insert_datos_prueba_completos.sql'
        WHEN (SELECT COUNT(*) FROM especialidad) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Agregar más especialidades'
        WHEN (SELECT COUNT(*) FROM categoria_ticket) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Agregar más categorías'
        WHEN (SELECT COUNT(*) FROM etiqueta) < 3 THEN '⚠️  ACCIÓN REQUERIDA: Agregar más etiquetas'
        ELSE '✅ TODAS LAS TABLAS CUMPLEN CON EL MÍNIMO REQUERIDO'
    END AS accion_requerida;

SELECT '═══════════════════════════════════════════════════' AS separador;
