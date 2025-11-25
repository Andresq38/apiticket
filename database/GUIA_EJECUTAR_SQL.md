# 📋 GUÍA RÁPIDA - Ejecutar Scripts SQL

## 🔴 TAREA CRÍTICA: Insertar Datos de Prueba

### Opción 1: Ejecutar Script BAT (Automático)

1. Abrir carpeta `database`
2. Hacer doble clic en **`EJECUTAR_DATOS_PRUEBA.bat`**
3. El script intentará conectarse automáticamente
4. Si requiere contraseña, seguir Opción 2

---

### Opción 2: MySQL Workbench (Manual - Recomendado)

#### Paso 1: Insertar Datos de Prueba

1. Abrir **MySQL Workbench**
2. Conectar a `localhost` (usuario: `root`)
3. Menú: **File → Open SQL Script**
4. Seleccionar: `database/insert_datos_prueba_completos.sql`
5. Clic en botón ⚡ **Execute** (o presionar `Ctrl+Shift+Enter`)
6. Verificar en Output:
   ```
   ✓ 6 tickets creados exitosamente
   ✓ 15+ registros de historial creados
   ✓ 5 asignaciones creadas
   ```

#### Paso 2: Verificar Datos Mínimos

1. En MySQL Workbench (misma conexión)
2. Menú: **File → Open SQL Script**
3. Seleccionar: `database/verificar_datos_minimos.sql`
4. Clic en botón ⚡ **Execute**
5. Revisar resultado - debe mostrar:
   - ✅ CUMPLE en todas las tablas (o mínimo 7/9)
   - Porcentaje de cumplimiento ≥ 77%

---

### Opción 3: phpMyAdmin

1. Abrir navegador: http://localhost/phpmyadmin
2. Clic en base de datos: **`ticket_system`**
3. Pestaña **SQL** (arriba)
4. Copiar contenido completo de `insert_datos_prueba_completos.sql`
5. Pegar en editor SQL
6. Clic en botón **Continuar** (abajo derecha)
7. Repetir con `verificar_datos_minimos.sql`

---

### Opción 4: Línea de Comandos

```powershell
# Cambiar a carpeta database
cd C:\xampp\htdocs\apiticket\database

# Ejecutar script (sin contraseña)
& "C:\xampp\mysql\bin\mysql.exe" -u root ticket_system < insert_datos_prueba_completos.sql

# Verificar datos
& "C:\xampp\mysql\bin\mysql.exe" -u root ticket_system < verificar_datos_minimos.sql
```

**Si requiere contraseña:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -p ticket_system < insert_datos_prueba_completos.sql
# Ingresar contraseña cuando lo solicite
```

---

## ✅ Verificación Exitosa

Después de ejecutar, deberías ver:

```
═══════════════════════════════════════════════════
     VERIFICACIÓN DE DATOS MÍNIMOS (3+ registros)  
═══════════════════════════════════════════════════

tabla          total_registros  estado         observacion
──────────────────────────────────────────────────────────
usuarios                     4  ✅ CUMPLE      Tiene datos suficientes
tecnicos                     3  ✅ CUMPLE      Tiene datos suficientes
categorias                   5  ✅ CUMPLE      Tiene datos suficientes
etiquetas                    8  ✅ CUMPLE      Tiene datos suficientes
especialidades               4  ✅ CUMPLE      Tiene datos suficientes
estados                      5  ✅ CUMPLE      Tiene datos suficientes (5 estados estándar)
slas                         3  ✅ CUMPLE      Tiene datos suficientes
tickets                      6  ✅ CUMPLE      Tiene datos suficientes
roles                        3  ✅ CUMPLE      Tiene roles básicos (Admin, Usuario, Técnico)

📊 RESUMEN EJECUTIVO
total_tablas: 9
tablas_ok: 9
tablas_pendientes: 0
porcentaje_cumplimiento: 100.0%

✅ TODAS LAS TABLAS CUMPLEN CON EL MÍNIMO REQUERIDO
```

---

## 🔧 Solución de Problemas

### Error: "Access denied for user 'root'"
**Solución:** Usar MySQL Workbench (Opción 2) o configurar contraseña en comando

### Error: "Unknown database 'ticket_system'"
**Solución:** 
```sql
CREATE DATABASE IF NOT EXISTS ticket_system;
USE ticket_system;
```

### Error: "Table doesn't exist"
**Solución:** Ejecutar primero `schema.sql` completo

### Tickets no aparecen en frontend
**Solución:**
1. Verificar Apache está corriendo (XAMPP Control Panel)
2. Abrir: http://localhost/apiticket/ticket
3. Debe mostrar JSON con tickets

---

## 📊 Contenido del Script

El script `insert_datos_prueba_completos.sql` crea:

- ✅ **6 Tickets** en diferentes estados:
  - Ticket #1: Pendiente (sin asignar)
  - Ticket #2: Asignado recientemente
  - Ticket #3: En Proceso
  - Ticket #4: Resuelto
  - Ticket #5: Cerrado
  - Ticket #6: Crítico y reciente

- ✅ **15+ Registros de Historial**:
  - Cambios de estado con timestamps reales
  - Observaciones descriptivas
  - Usuario responsable de cada cambio

- ✅ **5 Asignaciones**:
  - Métodos: Manual y Automático
  - Justificaciones completas
  - Auditoría de quién asigna

- ✅ **Prioridades variadas**: Alta, Media, Baja
- ✅ **SLAs diversos**: Desde críticos hasta normales
- ✅ **Fechas realistas**: Distribuidas en últimos 5 días

---

## ⏱️ Tiempo Estimado

- **Opción 1 (BAT)**: 1 minuto
- **Opción 2 (Workbench)**: 3 minutos
- **Opción 3 (phpMyAdmin)**: 4 minutos
- **Opción 4 (CMD)**: 2 minutos

---

**Siguiente paso:** Una vez ejecutado, continuar con verificación en frontend:
http://localhost:81/apiticket/appTaskSolve (o puerto configurado)
