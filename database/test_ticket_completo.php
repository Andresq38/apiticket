<?php
/**
 * Test directo del endpoint getTicketCompletoById
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing getTicketCompletoById endpoint\n";
echo "==========================================\n\n";

// Autoload
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../controllers/core/Response.php';
require_once __DIR__ . '/../controllers/core/Config.php';

// Mock Logger si no existe
if (!class_exists('Logger')) {
    class Logger {
        public static function log($msg, $level = 'INFO') {}
    }
}

// Mock handleException si no existe
if (!function_exists('handleException')) {
    function handleException($e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

require_once __DIR__ . '/../controllers/core/MySqlConnect.php';
require_once __DIR__ . '/../models/TicketModel.php';
require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../models/TecnicoModel.php';
require_once __DIR__ . '/../models/Categoria_ticketModel.php';
require_once __DIR__ . '/../models/SlaModel.php';
require_once __DIR__ . '/../models/EstadoModel.php';
require_once __DIR__ . '/../models/EtiquetaModel.php';

echo "Autoload completado\n\n";

// Test 1: Verificar que TicketModel existe
echo "Test 1: Verificar TicketModel... ";
if (class_exists('TicketModel')) {
    echo "PASÓ\n";
} else {
    echo "FALLÓ\n";
    exit(1);
}

// Test 2: Crear instancia de TicketModel
echo "Test 2: Crear instancia TicketModel... ";
try {
    $ticketModel = new TicketModel();
    echo "PASÓ\n";
} catch (Exception $e) {
    echo "FALLÓ: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Verificar que método existe
echo "Test 3: Verificar método getTicketCompletoById... ";
if (method_exists($ticketModel, 'getTicketCompletoById')) {
    echo "PASÓ\n";
} else {
    echo "FALLÓ\n";
    exit(1);
}

// Test 4: Obtener primer ticket disponible
echo "Test 4: Obtener lista de tickets... ";
try {
    $tickets = $ticketModel->all();
    if (empty($tickets)) {
        echo "No hay tickets en la BD\n";
        exit(0);
    }
    $primerTicket = $tickets[0];
    $idTicket = isset($primerTicket->id_ticket) ? $primerTicket->id_ticket : (isset($primerTicket->{'Identificador del Ticket'}) ? $primerTicket->{'Identificador del Ticket'} : null);
    
    if (!$idTicket) {
        echo "FALLÓ: No se pudo obtener ID del primer ticket\n";
        var_dump($primerTicket);
        exit(1);
    }
    
    echo "PASÓ (ID encontrado: {$idTicket})\n";
} catch (Exception $e) {
    echo "FALLÓ: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 5: Llamar a getTicketCompletoById
echo "Test 5: Llamar getTicketCompletoById({$idTicket})... \n";
try {
    $ticket = $ticketModel->getTicketCompletoById($idTicket);
    
    if ($ticket === null) {
        echo "FALLÓ: Método retornó null\n";
        exit(1);
    }
    
    echo "PASÓ\n";
    echo "\nResultado:\n";
    echo "- ID: " . ($ticket->id_ticket ?? 'N/A') . "\n";
    echo "- Título: " . ($ticket->titulo ?? 'N/A') . "\n";
    echo "- Estado: " . ($ticket->estado->nombre ?? 'N/A') . "\n";
    echo "- Usuario: " . ($ticket->usuario->nombre ?? 'N/A') . "\n";
    echo "- Técnico: " . ($ticket->tecnico->nombre ?? 'N/A') . "\n";
    echo "- Categoría: " . ($ticket->categoria->nombre ?? 'N/A') . "\n";
    
} catch (Exception $e) {
    echo "FALLÓ: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

echo "\n==========================================\n";
echo "TODOS LOS TESTS PASARON\n";
