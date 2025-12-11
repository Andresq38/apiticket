# INSTRUCCIONES CRÍTICAS - Migración Base de Datos

## IMPORTANTE: EJECUTAR ANTES DE LA REVISIÓN

Para que el **Historial de Estados** funcione correctamente con trazabilidad completa, es **OBLIGATORIO** ejecutar esta migración.

### Pasos para Ejecutar la Migración:

#### Opción 1: Usando phpMyAdmin (Recomendado)
1. Abre phpMyAdmin (http://localhost/phpmyadmin)
2. Selecciona la base de datos `ticket_system`
3. Ve a la pestaña "SQL"
4. Abre el archivo `migration_add_usuario_to_historial.sql`
5. Copia y pega todo el contenido
6. Haz clic en "Continuar" o "Ejecutar"

#### Opción 2: Usando línea de comandos MySQL
```bash
# Navega a la carpeta database
cd C:\xampp\htdocs\apiticket\database

# Ejecuta la migración (te pedirá la contraseña de root)
C:\xampp\mysql\bin\mysql.exe -u root -p ticket_system < migration_add_usuario_to_historial.sql
```

#### Opción 3: Desde MySQL Workbench
1. Abre MySQL Workbench
2. Conecta a tu servidor local
3. Abre el archivo `migration_add_usuario_to_historial.sql`
4. Ejecuta el script (botón ⚡ o Ctrl+Shift+Enter)

### Verificación de que la migración fue exitosa:

Ejecuta esta consulta en phpMyAdmin o MySQL:

```sql
USE ticket_system;
DESCRIBE historial_estados;
```

Deberías ver una columna llamada `id_usuario` de tipo `VARCHAR(20)` con valor NULL permitido.

### 📋 ¿Qué hace esta migración?

- Agrega el campo `id_usuario` a la tabla `historial_estados`
- Este campo registra **quién** hizo cada cambio de estado
- Cumple con el requerimiento del profesor: "Usuario responsable de realizar la acción"
- Permite la trazabilidad completa del historial

### 🚨 Si NO ejecutas esta migración:

El historial se mostrará, pero **NO** aparecerá el nombre del usuario que hizo cada cambio. Esto resultará en **pérdida de puntos** durante la revisión.

---

## Verificación de Datos Precargados

Después de la migración, verifica que tienes suficientes datos de prueba:

```sql
-- Verificar tickets (mínimo 3)
SELECT COUNT(*) as total_tickets FROM ticket;

-- Verificar técnicos (mínimo 3)
SELECT COUNT(*) as total_tecnicos FROM tecnico;

-- Verificar categorías (mínimo 3)
SELECT COUNT(*) as total_categorias FROM categoria_ticket;

-- Verificar historial
SELECT COUNT(*) as total_cambios FROM historial_estados;
```

Si alguna tabla tiene menos de 3 registros, ejecuta también el archivo `insert_test_data.sql` ubicado en la carpeta `database/`.

---

**Fecha:** 2025-11-22
**Responsable:** GitHub Copilot Assistant
**Prioridad:** 🔴 CRÍTICA
