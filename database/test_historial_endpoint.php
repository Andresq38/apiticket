<?php
// Script de prueba directo para endpoint de historial
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../controllers/core/Config.php';
require_once __DIR__ . '/../controllers/core/Logger.php';
require_once __DIR__ . '/../controllers/core/MySqlConnect.php';
require_once __DIR__ . '/../controllers/core/HandleException.php';
require_once __DIR__ . '/../models/Historial_EstadoModel.php';

echo "=== TEST HISTORIAL ENDPOINT ===\n\n";

// 1. Test directo del modelo
echo "1. Test directo del modelo:\n";
try {
    $model = new Historial_EstadoModel();
    $result = $model->getByTicket(100014);
    echo "✅ Modelo respondió correctamente\n";
    echo "Total registros: " . count($result) . "\n";
    if (!empty($result)) {
        echo "Primer registro:\n";
        print_r($result[0]);
    }
} catch (Exception $e) {
    echo "❌ Error en modelo: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n2. Test HTTP endpoint:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:81/apiticket/historial_estado/ticket/100014');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
if ($httpCode == 200) {
    echo "✅ Endpoint respondió correctamente\n";
    list($headers, $body) = explode("\r\n\r\n", $response, 2);
    echo "Response Body:\n";
    echo substr($body, 0, 500) . "...\n";
} else {
    echo "❌ Error HTTP $httpCode\n";
    echo "Response:\n";
    echo $response . "\n";
}
