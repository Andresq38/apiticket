# 🧪 Suite de Tests PHPUnit - Sistema de Tickets

## 📋 Descripción

Suite completa de tests unitarios y de integración para validar las funcionalidades críticas del sistema de tickets.

---

## 🎯 Cobertura de Tests

### ✅ TicketModelTest.php (10 tests)
- `testCambiarEstadoRequiereTecnicoAsignado`: Valida que estados > Pendiente requieren técnico
- `testNoPermiteSaltarEtapasDeEstado`: Valida flujo estricto de estados
- `testCambiarEstadoRequiereImagenesParaEstadosAltos`: Valida imágenes obligatorias estados >= 3
- `testFlujoPendienteACerradoConValidaciones`: Valida flujo completo
- `testCambiarEstadoRequiereObservaciones`: Valida comentarios obligatorios
- `testNoPermiteCambiarEstadoDeTicketInexistente`: Valida IDs válidos
- `testCrearTicketConCamposRequeridos`: Valida creación exitosa
- `testTituloDebeEstarEnRangoValido`: Valida longitud título (5-200)
- `testDescripcionDebeSerSuficientementeDetallada`: Valida longitud descripción (10+)
- `testPrioridadDebeSerValida`: Valida valores de prioridad

### ✅ AsignacionModelTest.php (8 tests)
- `testCalculoPuntajeAutoTriage`: Valida fórmula (prioridad × 1000) - SLA
- `testAsignacionPorEspecialidad`: Valida filtrado por especialidad
- `testAsignacionManualRequiereJustificacion`: Valida justificación obligatoria
- `testAsignacionManualRequiereJustificacionMinima`: Valida mínimo 20 caracteres
- `testNoPermiteAsignarTecnicoSinEspecialidad`: Valida especialidad requerida
- `testNoPermiteReasignacionSinJustificacion`: Valida reasignaciones
- `testAutoTriagePriorizaTicketsCriticos`: Valida ordenamiento por puntaje
- `testRegistraMetodoDeAsignacion`: Valida registro Manual vs Automático

### ✅ NotificacionModelTest.php (10 tests)
- `testCrearNotificacion`: Valida creación con campos requeridos
- `testObtenerNotificacionesPorUsuario`: Valida filtrado por usuario
- `testMarcarComoLeida`: Valida cambio de estado leída
- `testObtenerNoLeidasPorUsuario`: Valida filtrado por leída = false
- `testNoCrearNotificacionesDuplicadas`: Valida anti-duplicados
- `testNotificacionesTienenTimestamp`: Valida fecha_creacion correcta
- `testMarcarTodasLeidasPorUsuario`: Valida marcado masivo
- `testTiposDeNotificacionValidos`: Valida tipos (success, info, warning, error)
- `testNotificacionLoginSeCreanAutomaticamente`: Valida creación automática
- `testNotificacionCambioEstadoSeCrean`: Valida notificaciones de cambios

**Total**: **28 tests** cubriendo funcionalidades críticas

---

## ⚙️ Instalación de PHPUnit

### Opción 1: Via Composer (Recomendado)

```bash
cd C:\xampp\htdocs\apiticket
composer require --dev phpunit/phpunit
```

### Opción 2: Descargar PHAR

```powershell
cd C:\xampp\htdocs\apiticket
Invoke-WebRequest -Uri https://phar.phpunit.de/phpunit-9.phar -OutFile phpunit.phar
php phpunit.phar --version
```

---

## 🚀 Ejecución de Tests

### Ejecutar todos los tests

```bash
# Con Composer
vendor/bin/phpunit

# Con PHAR
php phpunit.phar
```

### Ejecutar suite específica

```bash
# Solo TicketModelTest
vendor/bin/phpunit tests/TicketModelTest.php

# Solo AsignacionModelTest
vendor/bin/phpunit tests/AsignacionModelTest.php

# Solo NotificacionModelTest
vendor/bin/phpunit tests/NotificacionModelTest.php
```

### Ejecutar test específico

```bash
vendor/bin/phpunit --filter testCambiarEstadoRequiereTecnicoAsignado
```

### Con verbosidad detallada

```bash
vendor/bin/phpunit --verbose --testdox
```

### Con reporte de cobertura (requiere Xdebug)

```bash
vendor/bin/phpunit --coverage-html tests/_output/coverage
```

---

## 📊 Salida Esperada

```
PHPUnit 9.x by Sebastian Bergmann and contributors.

TicketModelTest
 ✔ Cambiar estado requiere tecnico asignado
 ✔ No permite saltar etapas de estado
 ✔ Cambiar estado requiere imagenes para estados altos
 ✔ Flujo pendiente a cerrado con validaciones
 ✔ Cambiar estado requiere observaciones
 ✔ No permite cambiar estado de ticket inexistente
 ✔ Crear ticket con campos requeridos
 ✔ Titulo debe estar en rango valido
 ✔ Descripcion debe ser suficientemente detallada
 ✔ Prioridad debe ser valida

AsignacionModelTest
 ✔ Calculo puntaje auto triage
 ✔ Asignacion por especialidad
 ✔ Asignacion manual requiere justificacion
 ✔ Asignacion manual requiere justificacion minima
 ✔ No permite asignar tecnico sin especialidad
 ✔ No permite reasignacion sin justificacion
 ✔ Auto triage prioriza tickets criticos
 ✔ Registra metodo de asignacion

NotificacionModelTest
 ✔ Crear notificacion
 ✔ Obtener notificaciones por usuario
 ✔ Marcar como leida
 ✔ Obtener no leidas por usuario
 ✔ No crear notificaciones duplicadas
 ✔ Notificaciones tienen timestamp
 ✔ Marcar todas leidas por usuario
 ✔ Tipos de notificacion validos
 ✔ Notificacion login se crean automaticamente
 ✔ Notificacion cambio estado se crean

Time: 00:02.458, Memory: 12.00 MB

OK (28 tests, 65 assertions)
```

---

## 🛠️ Configuración

### phpunit.xml

Archivo de configuración principal:
- Define directorio de tests: `./tests`
- Define cobertura: `./models`, `./controllers`
- Configuración de BD de prueba: `ticket_system_test`
- Logs: JUnit XML, HTML testdox

### Base de Datos de Prueba

**IMPORTANTE**: Los tests usan BD separada `ticket_system_test`

```sql
CREATE DATABASE IF NOT EXISTS ticket_system_test;
USE ticket_system_test;

-- Ejecutar schema.sql completo
SOURCE schema.sql;

-- Ejecutar datos de prueba
SOURCE insert_datos_prueba_completos.sql;
```

---

## 🔧 Solución de Problemas

### Error: "Class not found"

**Solución**: Verificar autoload de Composer
```bash
composer dump-autoload
```

### Error: "Database connection failed"

**Solución**: Verificar credenciales en `phpunit.xml`
```xml
<env name="DB_NAME" value="ticket_system_test"/>
<env name="DB_USER" value="root"/>
<env name="DB_PASS" value=""/>
```

### Error: "require_once failed"

**Solución**: Verificar rutas relativas en tests
```php
require_once __DIR__ . '/../models/TicketModel.php';
```

### Tests fallan por datos faltantes

**Solución**: Ejecutar scripts SQL de datos de prueba
```bash
mysql -u root ticket_system_test < insert_datos_prueba_completos.sql
```

---

## 📈 Mejores Prácticas

### 1. Ejecutar tests antes de commits
```bash
git add .
vendor/bin/phpunit
git commit -m "Feature: ..."
```

### 2. Agregar tests para nuevas funcionalidades
```php
/**
 * @test
 * Descripción clara del comportamiento esperado
 */
public function testNuevaFuncionalidad()
{
    // Arrange
    $datos = [...];
    
    // Act
    $resultado = $this->model->nuevaFuncion($datos);
    
    // Assert
    $this->assertEquals($esperado, $resultado);
}
```

### 3. Usar setUp y tearDown para limpieza
```php
protected function setUp(): void
{
    // Crear datos de prueba
}

protected function tearDown(): void
{
    // Limpiar datos de prueba
}
```

### 4. Tests independientes
- Cada test debe poder ejecutarse solo
- No depender del orden de ejecución
- Limpiar datos después de cada test

---

## 📚 Recursos

- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Best Practices for Testing](https://phpunit.de/manual/current/en/writing-tests-for-phpunit.html)
- [Test Doubles](https://phpunit.de/manual/current/en/test-doubles.html)

---

## 📞 Soporte

Para reportar problemas con los tests:
1. Verificar salida del test: `vendor/bin/phpunit --verbose`
2. Revisar logs: `tests/_output/junit.xml`
3. Documentar error con comando exacto ejecutado

---

**Última actualización**: 24 de Noviembre, 2025  
**Versión PHPUnit**: 9.5+  
**Cobertura estimada**: 75% de funcionalidades críticas
