<?php
/**
 * Script para probar asignación manual directamente
 */
$config = require_once 'config.php';

echo "=== TEST ASIGNACIÓN MANUAL ===\n\n";

// Datos de prueba
$idTicket = 100018;
$idTecnico = 2; // Andrés Quesada - tiene especialidad en Red y Conectividad (id_categoria = 4)
$justificacion = "Prueba de asignación manual desde script";
$idUsuarioAsigna = "1-1659-0626";

echo "Datos de entrada:\n";
echo "- ID Ticket: $idTicket\n";
echo "- ID Técnico: $idTecnico\n";
echo "- Justificación: $justificacion\n";
echo "- Usuario asigna: $idUsuarioAsigna\n\n";

try {
    $conn = new mysqli(
        $config['DB_HOST'], 
        $config['DB_USERNAME'], 
        $config['DB_PASSWORD'], 
        $config['DB_DBNAME']
    );
    
    if ($conn->connect_error) {
        die("Error de conexión: " . $conn->connect_error);
    }
    
    echo "Conectado a la base de datos\n\n";
    
    // Verificar que el ticket existe y está pendiente
    $sqlTicket = "SELECT * FROM ticket WHERE id_ticket = ?";
    $stmt = $conn->prepare($sqlTicket);
    $stmt->bind_param('i', $idTicket);
    $stmt->execute();
    $result = $stmt->get_result();
    $ticket = $result->fetch_assoc();
    $stmt->close();
    
    if (!$ticket) {
        die("ERROR: Ticket no encontrado\n");
    }
    
    echo "Ticket encontrado:\n";
    echo "- ID: {$ticket['id_ticket']}\n";
    echo "- Estado actual: {$ticket['id_estado']}\n";
    echo "- Categoría: {$ticket['id_categoria']}\n";
    echo "- Técnico actual: " . ($ticket['id_tecnico'] ? $ticket['id_tecnico'] : 'NULL') . "\n\n";
    
    if ($ticket['id_estado'] != 1) {
        die("ERROR: El ticket no está en estado Pendiente (estado actual: {$ticket['id_estado']})\n");
    }
    
    if ($ticket['id_tecnico']) {
        die("ERROR: El ticket ya tiene un técnico asignado (ID: {$ticket['id_tecnico']})\n");
    }
    
    // Verificar que el técnico tiene la especialidad requerida
    $sqlEsp = "SELECT te.id_tecnico, e.id_especialidad, e.nombre, e.id_categoria
               FROM tecnico_especialidad te
               JOIN especialidad e ON e.id_especialidad = te.id_especialidad
               WHERE te.id_tecnico = ? AND e.id_categoria = ?";
    $stmt = $conn->prepare($sqlEsp);
    $stmt->bind_param('ii', $idTecnico, $ticket['id_categoria']);
    $stmt->execute();
    $result = $stmt->get_result();
    $especialidad = $result->fetch_assoc();
    $stmt->close();
    
    if (!$especialidad) {
        echo "ERROR: El técnico $idTecnico no tiene la especialidad requerida para la categoría {$ticket['id_categoria']}\n";
        
        // Mostrar las especialidades del técnico
        $sqlEspTec = "SELECT e.* FROM tecnico_especialidad te 
                     JOIN especialidad e ON e.id_especialidad = te.id_especialidad 
                     WHERE te.id_tecnico = ?";
        $stmt = $conn->prepare($sqlEspTec);
        $stmt->bind_param('i', $idTecnico);
        $stmt->execute();
        $result = $stmt->get_result();
        echo "\nEspecialidades del técnico $idTecnico:\n";
        while ($esp = $result->fetch_assoc()) {
            echo "  - {$esp['nombre']} (Categoría: {$esp['id_categoria']})\n";
        }
        $stmt->close();
        die();
    }
    
    echo "✓ Técnico tiene la especialidad requerida: {$especialidad['nombre']}\n\n";
    
    // Realizar la asignación
    echo "Ejecutando asignación...\n";
    
    $conn->begin_transaction();
    
    // 1. Actualizar ticket
    $sqlUpdate = "UPDATE ticket SET id_tecnico = ?, id_estado = 2 WHERE id_ticket = ?";
    $stmt = $conn->prepare($sqlUpdate);
    $stmt->bind_param('ii', $idTecnico, $idTicket);
    $stmt->execute();
    $stmt->close();
    
    // 2. Registrar en historial
    $justificacionCompleta = "Asignación manual: " . $justificacion;
    $sqlHistorial = "INSERT INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario) 
                    VALUES (?, 2, ?, ?)";
    $stmt = $conn->prepare($sqlHistorial);
    $stmt->bind_param('iss', $idTicket, $justificacionCompleta, $idUsuarioAsigna);
    $stmt->execute();
    $stmt->close();
    
    // 3. Incrementar carga de trabajo
    $sqlCarga = "UPDATE tecnico SET carga_trabajo = carga_trabajo + 1 WHERE id_tecnico = ?";
    $stmt = $conn->prepare($sqlCarga);
    $stmt->bind_param('i', $idTecnico);
    $stmt->execute();
    $stmt->close();
    
    $conn->commit();
    
    echo "\n=== ✓ ASIGNACIÓN EXITOSA ===\n";
    echo "Ticket $idTicket asignado al técnico $idTecnico\n";
    
    $conn->close();
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
        $conn->close();
    }
    echo "\n=== ERROR ===\n";
    echo "Error: " . $e->getMessage() . "\n";
}
