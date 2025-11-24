<?php
$config = require 'config.php';
$conn = new mysqli($config['DB_HOST'], $config['DB_USERNAME'], $config['DB_PASSWORD'], $config['DB_DBNAME']);

$result = $conn->query("SELECT id_ticket, titulo, id_estado, id_tecnico, prioridad FROM ticket WHERE id_ticket >= 100019 ORDER BY id_ticket");

echo "Estado de tickets recientes:\n\n";
while($row = $result->fetch_assoc()) {
    $estados = ['', 'Pendiente', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado'];
    $estado = $estados[$row['id_estado']] ?? 'Desconocido';
    echo sprintf("Ticket #%d: Estado=%s, Tecnico=%s, Prioridad=%s\n  %s\n\n", 
        $row['id_ticket'], 
        $estado,
        $row['id_tecnico'] ?? 'NULL', 
        $row['prioridad'], 
        $row['titulo']
    );
}
$conn->close();
