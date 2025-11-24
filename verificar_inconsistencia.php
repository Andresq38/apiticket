<?php
$config = require 'config.php';
$conn = new mysqli($config['DB_HOST'], $config['DB_USERNAME'], $config['DB_PASSWORD'], $config['DB_DBNAME']);

echo "=== VERIFICACIÓN DE INCONSISTENCIAS ===\n\n";

$result = $conn->query("SELECT id_ticket, titulo, id_estado, id_tecnico FROM ticket WHERE id_ticket IN (100016, 100017, 100019, 100020, 100021) ORDER BY id_ticket");

echo "Tickets ID 100016-100021:\n\n";
$estados = ['', 'Pendiente', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado'];
while($row = $result->fetch_assoc()) {
    $estado = $estados[$row['id_estado']] ?? 'Desconocido';
    echo sprintf("#%d: Estado=%s (%d), Técnico=%s\n", 
        $row['id_ticket'], 
        $estado,
        $row['id_estado'],
        $row['id_tecnico'] ?? 'NULL'
    );
}

echo "\n=== QUERY DEL ENDPOINT /pendientes ===\n";
$result = $conn->query("SELECT id_ticket, titulo, id_estado, id_tecnico FROM ticket WHERE id_estado = 1 AND id_tecnico IS NULL ORDER BY id_ticket");
echo "\nTickets que devuelve el endpoint (id_estado=1 AND id_tecnico IS NULL):\n\n";
while($row = $result->fetch_assoc()) {
    echo sprintf("#%d: %s (Estado=%d, Técnico=%s)\n", 
        $row['id_ticket'],
        $row['titulo'],
        $row['id_estado'],
        $row['id_tecnico'] ?? 'NULL'
    );
}

$conn->close();
