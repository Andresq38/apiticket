<?php
/**
 * Test HTTP real del endpoint getTicketCompletoById
 */

$ticketId = $argv[1] ?? 100014;
$url = "http://localhost:81/apiticket/ticket/getTicketCompletoById/{$ticketId}";

echo "🌐 Testing endpoint HTTP: {$url}\n";
echo "=====================================\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status Code: {$httpCode}\n";

if ($error) {
    echo "❌ CURL Error: {$error}\n";
    exit(1);
}

echo "\nHeaders:\n";
echo $headers . "\n";

echo "\nResponse Body (primeros 500 chars):\n";
echo substr($body, 0, 500) . "\n";

if ($httpCode === 200) {
    echo "\n✅ Endpoint respondió correctamente\n";
    
    $json = json_decode($body, true);
    if ($json) {
        echo "\nDatos decodificados:\n";
        echo "- id_ticket: " . ($json['id_ticket'] ?? 'N/A') . "\n";
        echo "- titulo: " . ($json['titulo'] ?? 'N/A') . "\n";
        echo "- estado: " . (isset($json['estado']['nombre']) ? $json['estado']['nombre'] : 'N/A') . "\n";
    }
} else {
    echo "\n❌ Error HTTP {$httpCode}\n";
}
