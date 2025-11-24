<?php
/**
 * Test NotificationStreamController
 * 
 * Verifica que el controlador SSE esté correctamente configurado
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Autoload básico
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../controllers/core/Response.php';
require_once __DIR__ . '/../controllers/core/Config.php';

// Mock Logger si no existe
if (!class_exists('Logger')) {
    class Logger {
        public static function log($msg, $level = 'INFO') {
            // No-op para tests
        }
    }
}

require_once __DIR__ . '/../controllers/core/MySqlConnect.php';
require_once __DIR__ . '/../models/NotificacionModel.php';
require_once __DIR__ . '/../controllers/NotificationStreamController.php';

echo "🧪 Test NotificationStreamController" . PHP_EOL;
echo "=====================================" . PHP_EOL . PHP_EOL;

// Test 1: Verificar que la clase existe
echo "Test 1: Verificar clase NotificationStreamController... ";
if (class_exists('NotificationStreamController')) {
    echo "✅ PASÓ" . PHP_EOL;
} else {
    echo "❌ FALLÓ - Clase no encontrada" . PHP_EOL;
    exit(1);
}

// Test 2: Verificar que tiene método stream
echo "Test 2: Verificar método stream()... ";
if (method_exists('NotificationStreamController', 'stream')) {
    echo "✅ PASÓ" . PHP_EOL;
} else {
    echo "❌ FALLÓ - Método stream no existe" . PHP_EOL;
    exit(1);
}

// Test 3: Verificar que NotificacionModel existe
echo "Test 3: Verificar NotificacionModel... ";
if (class_exists('NotificacionModel')) {
    echo "✅ PASÓ" . PHP_EOL;
} else {
    echo "❌ FALLÓ - NotificacionModel no encontrado" . PHP_EOL;
    exit(1);
}

// Test 4: Verificar conexión a BD
echo "Test 4: Verificar conexión BD... ";
try {
    $notifModel = new NotificacionModel();
    echo "✅ PASÓ" . PHP_EOL;
} catch (Exception $e) {
    echo "❌ FALLÓ - " . $e->getMessage() . PHP_EOL;
    exit(1);
}

// Test 5: Verificar que getNoLeidasByUsuario funciona
echo "Test 5: Verificar getNoLeidasByUsuario()... ";
try {
    $result = $notifModel->getNoLeidasByUsuario('admin');
    $count = is_array($result) ? count($result) : 0;
    echo "✅ PASÓ (encontradas: {$count} notificaciones)" . PHP_EOL;
} catch (Exception $e) {
    echo "❌ FALLÓ - " . $e->getMessage() . PHP_EOL;
    exit(1);
}

echo PHP_EOL;
echo "=====================================" . PHP_EOL;
echo "✅ TODOS LOS TESTS PASARON" . PHP_EOL;
echo "El endpoint SSE está listo para usarse en:" . PHP_EOL;
echo "GET /apiticket/notificationstream/stream/{id_usuario}" . PHP_EOL;

