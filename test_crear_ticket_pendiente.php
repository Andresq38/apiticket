<?php
/**
 * Script para crear un ticket pendiente de prueba
 */
$config = require_once 'config.php';

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
    
    echo "Conexión exitosa a la base de datos\n\n";
    
    // Crear 3 tickets pendientes con diferentes prioridades y categorías
    $tickets = [
        [
            'titulo' => 'Problema con impresora de oficina',
            'descripcion' => 'La impresora HP LaserJet no imprime correctamente, sale con líneas',
            'prioridad' => 'Alta',
            'id_estado' => 1, // Pendiente
            'id_usuario' => '6-1234-5678', // Carlos Ramírez
            'id_categoria' => 1, // Gestión y Soporte de Equipamiento Tecnológico
        ],
        [
            'titulo' => 'Solicitud de acceso a sistema contable',
            'descripcion' => 'Nuevo empleado necesita acceso al sistema SAP',
            'prioridad' => 'Media',
            'id_estado' => 1, // Pendiente
            'id_usuario' => '5-9900-2211', // María Sandi
            'id_categoria' => 3, // Gestión de Usuarios y Accesos
        ],
        [
            'titulo' => 'Problema de conectividad WiFi en sala de juntas',
            'descripcion' => 'La señal WiFi es muy débil en la sala de juntas del piso 3',
            'prioridad' => 'Baja',
            'id_estado' => 1, // Pendiente
            'id_usuario' => '4-5566-7788', // Ana Rodríguez
            'id_categoria' => 4, // Red y Conectividad
        ]
    ];
    
    echo "Creando tickets pendientes...\n\n";
    
    foreach ($tickets as $index => $ticket) {
        $sql = "INSERT INTO ticket (titulo, descripcion, prioridad, id_estado, id_usuario, id_categoria, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssisi', 
            $ticket['titulo'],
            $ticket['descripcion'],
            $ticket['prioridad'],
            $ticket['id_estado'],
            $ticket['id_usuario'],
            $ticket['id_categoria']
        );
        
        if ($stmt->execute()) {
            $id = $stmt->insert_id;
            echo "✓ Ticket #{$id} creado: {$ticket['titulo']} (Prioridad: {$ticket['prioridad']})\n";
            
            // Registrar en historial
            $sqlHistorial = "INSERT INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario) 
                            VALUES (?, 1, 'Ticket creado en estado Pendiente', ?)";
            $stmtHist = $conn->prepare($sqlHistorial);
            $stmtHist->bind_param('is', $id, $ticket['id_usuario']);
            $stmtHist->execute();
            $stmtHist->close();
        } else {
            echo "✗ Error al crear ticket: " . $stmt->error . "\n";
        }
        
        $stmt->close();
    }
    
    echo "\n✓ Proceso completado exitosamente\n";
    echo "\nAhora puedes ir a la pantalla de Asignaciones y verás los tickets pendientes.\n";
    
    $conn->close();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
