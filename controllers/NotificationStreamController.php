<?php
/**
 * NotificationStreamController.php
 * 
 * Controlador para Server-Sent Events (SSE) de notificaciones en tiempo real.
 * Establece conexión persistente que envía eventos cuando hay nuevas notificaciones.
 * 
 * Endpoint: GET /apiticket/notificacion/stream/{id_usuario}
 * 
 * Flujo:
 * 1. Cliente abre EventSource a este endpoint
 * 2. Servidor envía eventos SSE cada vez que detecta cambios
 * 3. Cliente recibe eventos y actualiza UI sin polling
 * 
 * Formato evento SSE:
 * event: notification
 * data: {"count": 5, "latest": {...}}
 * 
 * event: heartbeat
 * data: {"timestamp": "2025-11-24T10:30:00"}
 */
class NotificationStreamController
{
    private $userId;
    private $lastChecksum;
    
    /**
     * Establece conexión SSE y envía eventos de notificaciones
     * GET /apiticket/notificacion/stream/{id_usuario}
     */
    public function stream($idUsuario)
    {
        try {
            if (!$idUsuario) {
                http_response_code(400);
                echo "data: " . json_encode(['error' => 'id_usuario requerido']) . "\n\n";
                return;
            }

            $this->userId = $idUsuario;
            $this->setupSSE();
            $this->sendEvents();
            
        } catch (Exception $e) {
            error_log("Error en NotificationStreamController: " . $e->getMessage());
            http_response_code(500);
            echo "data: " . json_encode(['error' => 'Error en servidor SSE']) . "\n\n";
        }
    }

    /**
     * Configura headers HTTP para Server-Sent Events
     */
    private function setupSSE()
    {
        // Desactivar buffers y configurar headers SSE
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // Nginx: desactivar buffering
        header('Access-Control-Allow-Origin: *'); // CORS
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type');
        
        // Desactivar compresión y buffers PHP
        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', 'false');
        @apache_setenv('no-gzip', 1);
        
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        // Establecer timeout largo para conexión persistente
        set_time_limit(0);
        ignore_user_abort(true);
    }

    /**
     * Loop principal: envía eventos SSE cuando detecta cambios
     * Polling interno cada 5 segundos, pero cliente recibe push instantáneo
     */
    private function sendEvents()
    {
        $notifModel = new NotificacionModel();
        $this->lastChecksum = null;
        $heartbeatCounter = 0;

        // Loop infinito con verificación cada 5 segundos
        while (true) {
            // Verificar si cliente desconectó
            if (connection_aborted()) {
                break;
            }

            try {
                // Obtener notificaciones no leídas actuales
                $notificaciones = $notifModel->getNoLeidasByUsuario($this->userId);
                $notificaciones = is_array($notificaciones) ? $notificaciones : [];
                $count = count($notificaciones);
                
                // Calcular checksum para detectar cambios
                $currentChecksum = $this->calculateChecksum($notificaciones);

                // Si hay cambios, enviar evento notification
                if ($this->lastChecksum === null || $currentChecksum !== $this->lastChecksum) {
                    $this->lastChecksum = $currentChecksum;
                    
                    $latest = !empty($notificaciones) ? $notificaciones[0] : null;
                    
                    $this->sendEvent('notification', [
                        'count' => $count,
                        'latest' => $latest,
                        'timestamp' => date('Y-m-d\TH:i:s')
                    ]);
                }

                // Enviar heartbeat cada 6 ciclos (30 segundos)
                $heartbeatCounter++;
                if ($heartbeatCounter >= 6) {
                    $this->sendEvent('heartbeat', [
                        'timestamp' => date('Y-m-d\TH:i:s'),
                        'connection' => 'active'
                    ]);
                    $heartbeatCounter = 0;
                }

            } catch (Exception $e) {
                error_log("Error en loop SSE: " . $e->getMessage());
                $this->sendEvent('error', ['message' => 'Error temporal en servidor']);
            }

            // Esperar 5 segundos antes del próximo check
            sleep(5);
        }
    }

    /**
     * Calcula checksum de notificaciones para detectar cambios
     * Incluye IDs, estados y fecha de última modificación
     */
    private function calculateChecksum($notificaciones)
    {
        if (empty($notificaciones)) {
            return 'empty';
        }

        $data = array_map(function($n) {
            return $n->id_notificacion . '_' . $n->estado . '_' . $n->fecha_hora;
        }, $notificaciones);

        return md5(implode('|', $data));
    }

    /**
     * Envía un evento SSE con formato estándar
     * 
     * @param string $eventName - Nombre del evento (notification, heartbeat, error)
     * @param array $data - Datos del evento en formato array
     */
    private function sendEvent($eventName, $data)
    {
        echo "event: {$eventName}\n";
        echo "data: " . json_encode($data) . "\n\n";
        
        // Forzar envío inmediato al cliente
        if (ob_get_level()) {
            ob_flush();
        }
        flush();
    }
}
