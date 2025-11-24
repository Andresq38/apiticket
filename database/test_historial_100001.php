<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../controllers/core/Config.php';
require_once __DIR__ . '/../controllers/core/Logger.php';
require_once __DIR__ . '/../controllers/core/MySqlConnect.php';
require_once __DIR__ . '/../controllers/core/HandleException.php';
require_once __DIR__ . '/../models/Historial_EstadoModel.php';

$model = new Historial_EstadoModel();

echo "=== Test con ticket 100001 (tiene historial) ===\n";
$result = $model->getByTicket(100001);
echo "Total registros: " . count($result) . "\n";
echo json_encode($result, JSON_PRETTY_PRINT) . "\n\n";

echo "=== Test HTTP endpoint ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:81/apiticket/historial_estado/ticket/100001');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
if ($httpCode == 200) {
    echo "✅ Éxito\n";
    echo substr($response, 0, 500) . "\n";
} else {
    echo "❌ Error\n";
    echo $response . "\n";
}
