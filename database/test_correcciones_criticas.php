<?php
/**
 * Script de Validación - Correcciones Críticas
 * Verifica que las correcciones implementadas funcionen correctamente
 */

// Configurar headers para JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Cargar autoloader de Composer y archivos core
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../controllers/core/Config.php';
require_once __DIR__ . '/../controllers/core/Logger.php';
require_once __DIR__ . '/../controllers/core/MySqlConnect.php';
require_once __DIR__ . '/../models/AsignacionRegistroModel.php';

$resultados = [];

try {
    // TEST 1: Verificar estructura tabla imagen
    $resultados['test_1'] = [
        'nombre' => 'Verificar estructura tabla imagen',
        'status' => 'ejecutando'
    ];
    
    $conn = new MySqlConnect();
    $estructura = $conn->ExecuteSQL("DESCRIBE imagen");
    
    $camposEsperados = ['id_imagen', 'id_ticket', 'imagen'];
    $camposEncontrados = array_map(function($row) { return $row->Field; }, $estructura);
    
    $resultados['test_1']['status'] = (
        in_array('id_ticket', $camposEncontrados) && 
        in_array('imagen', $camposEncontrados)
    ) ? '✅ PASÓ' : '❌ FALLÓ';
    $resultados['test_1']['estructura'] = $estructura;
    
    // TEST 2: Verificar tabla asignacion existe
    $resultados['test_2'] = [
        'nombre' => 'Verificar tabla asignacion creada',
        'status' => 'ejecutando'
    ];
    
    $checkTable = $conn->ExecuteSQL(
        "SELECT COUNT(*) as existe FROM information_schema.tables 
         WHERE table_schema = 'ticket_system' AND table_name = 'asignacion'"
    );
    
    $resultados['test_2']['status'] = ($checkTable[0]->existe == 1) ? '✅ PASÓ' : '❌ FALLÓ';
    $resultados['test_2']['existe'] = (bool)$checkTable[0]->existe;
    
    // TEST 3: Verificar vista asignacion_completa
    $resultados['test_3'] = [
        'nombre' => 'Verificar vista asignacion_completa',
        'status' => 'ejecutando'
    ];
    
    $checkVista = $conn->ExecuteSQL(
        "SELECT COUNT(*) as existe FROM information_schema.views 
         WHERE table_schema = 'ticket_system' AND table_name = 'asignacion_completa'"
    );
    
    $resultados['test_3']['status'] = ($checkVista[0]->existe == 1) ? '✅ PASÓ' : '❌ FALLÓ';
    $resultados['test_3']['existe'] = (bool)$checkVista[0]->existe;
    
    // TEST 4: Probar AsignacionRegistroModel
    $resultados['test_4'] = [
        'nombre' => 'Probar AsignacionRegistroModel->getAll()',
        'status' => 'ejecutando'
    ];
    
    try {
        $asignacionModel = new AsignacionRegistroModel();
        $asignaciones = $asignacionModel->getAll();
        
        $resultados['test_4']['status'] = '✅ PASÓ';
        $resultados['test_4']['total_registros'] = is_array($asignaciones) ? count($asignaciones) : 0;
        $resultados['test_4']['muestra'] = is_array($asignaciones) ? array_slice($asignaciones, 0, 2) : []; // Primeros 2 registros
    } catch (Exception $e) {
        $resultados['test_4']['status'] = '❌ FALLÓ';
        $resultados['test_4']['error'] = $e->getMessage();
    }
    
    // TEST 5: Verificar estructura tabla asignacion
    $resultados['test_5'] = [
        'nombre' => 'Verificar campos tabla asignacion',
        'status' => 'ejecutando'
    ];
    
    $estructuraAsignacion = $conn->ExecuteSQL("DESCRIBE asignacion");
    $camposAsignacion = array_map(function($row) { return $row->Field; }, $estructuraAsignacion);
    
    $camposRequeridos = [
        'id_asignacion', 'id_ticket', 'id_tecnico', 'fecha_asignacion', 
        'metodo', 'justificacion', 'puntaje_calculado', 'id_usuario_asigna'
    ];
    
    $todosCamposPresentes = true;
    foreach ($camposRequeridos as $campo) {
        if (!in_array($campo, $camposAsignacion)) {
            $todosCamposPresentes = false;
            break;
        }
    }
    
    $resultados['test_5']['status'] = $todosCamposPresentes ? '✅ PASÓ' : '❌ FALLÓ';
    $resultados['test_5']['campos'] = $estructuraAsignacion;
    
    // TEST 6: Verificar índices tabla asignacion
    $resultados['test_6'] = [
        'nombre' => 'Verificar índices tabla asignacion',
        'status' => 'ejecutando'
    ];
    
    $indices = $conn->ExecuteSQL("SHOW INDEX FROM asignacion");
    $nombresIndices = array_unique(array_map(function($row) { return $row->Key_name; }, $indices));
    
    $indicesRequeridos = ['PRIMARY', 'idx_ticket', 'idx_tecnico', 'idx_fecha', 'idx_metodo'];
    $todosIndicesPresentes = true;
    foreach ($indicesRequeridos as $idx) {
        if (!in_array($idx, $nombresIndices)) {
            $todosIndicesPresentes = false;
            break;
        }
    }
    
    $resultados['test_6']['status'] = $todosIndicesPresentes ? '✅ PASÓ' : '❌ FALLÓ';
    $resultados['test_6']['indices_encontrados'] = $nombresIndices;
    
    // Resumen
    $testsPasados = 0;
    $testsTotal = 0;
    foreach ($resultados as $test) {
        if (isset($test['status'])) {
            $testsTotal++;
            if (strpos($test['status'], '✅') !== false) {
                $testsPasados++;
            }
        }
    }
    
    $resultados['resumen'] = [
        'total_tests' => $testsTotal,
        'tests_pasados' => $testsPasados,
        'tests_fallados' => $testsTotal - $testsPasados,
        'porcentaje_exito' => round(($testsPasados / $testsTotal) * 100, 2) . '%',
        'estado_general' => ($testsPasados === $testsTotal) ? '✅ TODOS LOS TESTS PASARON' : '⚠️ ALGUNOS TESTS FALLARON'
    ];
    
} catch (Exception $e) {
    $resultados['error_fatal'] = [
        'mensaje' => $e->getMessage(),
        'archivo' => $e->getFile(),
        'linea' => $e->getLine()
    ];
}

echo json_encode($resultados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
