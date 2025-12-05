<?php
class NotificacionModel
{
    public $enlace;
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    /** Obtener id de usuario administrador por defecto (primer admin encontrado) */
    private function getDefaultAdminId()
    {
        try {
            $sql = "SELECT u.id_usuario
                    FROM usuario u
                    JOIN rol r ON r.id_rol = u.id_rol
                    WHERE r.descripcion = 'Administrador'
                    ORDER BY u.id_usuario LIMIT 1";
            $rows = $this->enlace->ExecuteSQL($sql);
            if (!empty($rows) && isset($rows[0]->id_usuario)) {
                return (string)$rows[0]->id_usuario;
            }
        } catch (Exception $e) {
            error_log('Error obteniendo admin por defecto: ' . $e->getMessage());
        }
        return null; // si no hay administrador
    }

    /** Exponer id de admin por defecto públicamente para frontend */
    public function obtenerAdminPorDefecto()
    {
        return $this->getDefaultAdminId();
    }

    /**
     * Listar todas las notificaciones
     */
    public function all(){
        try {
            $vSql = "SELECT n.*, 
                            u_dest.nombre AS nombre_destinatario,
                            u_rem.nombre AS nombre_remitente
                     FROM notificacion n
                     LEFT JOIN usuario u_dest ON n.id_usuario_destinatario = u_dest.id_usuario
                     LEFT JOIN usuario u_rem ON n.id_usuario_remitente = u_rem.id_usuario
                     ORDER BY n.fecha_hora DESC";
            
            $vResultado = $this->enlace->ExecuteSQL($vSql);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener una notificación por ID
     */
    public function get($id)
    {
        try {
            $vSql = "SELECT n.*, 
                            u_dest.nombre AS nombre_destinatario,
                            u_rem.nombre AS nombre_remitente
                     FROM notificacion n
                     LEFT JOIN usuario u_dest ON n.id_usuario_destinatario = u_dest.id_usuario
                     LEFT JOIN usuario u_rem ON n.id_usuario_remitente = u_rem.id_usuario
                     WHERE n.id_notificacion = ?";
            
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$id]);
            return $vResultado[0] ?? null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener notificaciones de un usuario específico
     */
    public function getByUsuario($idUsuario)
    {
        try {
            $vSql = "SELECT n.*, 
                            u_dest.nombre AS nombre_destinatario,
                            u_rem.nombre AS nombre_remitente
                     FROM notificacion n
                     LEFT JOIN usuario u_dest ON n.id_usuario_destinatario = u_dest.id_usuario
                     LEFT JOIN usuario u_rem ON n.id_usuario_remitente = u_rem.id_usuario
                     WHERE n.id_usuario_destinatario = ?
                     ORDER BY n.fecha_hora DESC";
            
            $vResultado = $this->enlace->executePrepared($vSql, 's', [(string)$idUsuario]);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener notificaciones no leídas de un usuario
     */
    public function getNoLeidasByUsuario($idUsuario)
    {
        try {
            $vSql = "SELECT n.*, 
                            u_dest.nombre AS nombre_destinatario,
                            u_rem.nombre AS nombre_remitente
                     FROM notificacion n
                     LEFT JOIN usuario u_dest ON n.id_usuario_destinatario = u_dest.id_usuario
                     LEFT JOIN usuario u_rem ON n.id_usuario_remitente = u_rem.id_usuario
                     WHERE n.id_usuario_destinatario = ? AND n.estado = 'No Leida'
                     ORDER BY n.fecha_hora DESC";
            
            $vResultado = $this->enlace->executePrepared($vSql, 's', [(string)$idUsuario]);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Contar notificaciones no leídas de un usuario
     */
    public function countNoLeidas($idUsuario)
    {
        try {
            $vSql = "SELECT COUNT(*) as total 
                     FROM notificacion 
                     WHERE id_usuario_destinatario = ? AND estado = 'No Leida'";
            
            $vResultado = $this->enlace->executePrepared($vSql, 's', [(string)$idUsuario]);
            return (int)($vResultado[0]->total ?? 0);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Crear una nueva notificación
     */
    public function create($objeto)
    {
        try {
            if (empty($objeto->tipo_evento)) {
                throw new Exception("Campo requerido: tipo_evento");
            }

            // Si no viene destinatario (no hay login), usar administrador por defecto
            $idDest = $objeto->id_usuario_destinatario ?? null;
            if (empty($idDest)) {
                $idDest = $this->getDefaultAdminId();
                if (empty($idDest)) {
                    throw new Exception("No se encontró usuario administrador para asignar como destinatario por defecto");
                }
            }

            $idRemitente = $objeto->id_usuario_remitente ?? null;
            $mensaje = $objeto->mensaje ?? null;
            $estado = $objeto->estado ?? 'No Leida';

            $vSql = "INSERT INTO notificacion 
                     (id_usuario_destinatario, id_usuario_remitente, tipo_evento, mensaje, estado, fecha_hora)
                     VALUES (?, ?, ?, ?, ?, NOW())";
            
            $idNotificacion = $this->enlace->executePrepared_DML_last($vSql, 'sssss', [
                (string)$idDest,
                $idRemitente,
                (string)$objeto->tipo_evento,
                $mensaje,
                $estado
            ]);

            return $this->get($idNotificacion);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Marcar notificación como leída
     */
    public function marcarComoLeida($id, $idUsuario = null)
    {
        try {
            // Validar que la notificación pertenezca al usuario (si se proporciona)
            if ($idUsuario) {
                $check = "SELECT id_notificacion FROM notificacion 
                          WHERE id_notificacion = ? AND id_usuario_destinatario = ?";
                $result = $this->enlace->executePrepared($check, 'is', [(int)$id, (string)$idUsuario]);
                if (empty($result)) {
                    throw new Exception("Notificación no encontrada o no pertenece al usuario");
                }
            }

            $vSql = "UPDATE notificacion SET estado = 'Leida' WHERE id_notificacion = ?";
            $this->enlace->executePrepared_DML($vSql, 'i', [(int)$id]);

            return $this->get($id);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    public function marcarTodasComoLeidas($idUsuario)
    {
        try {
            $vSql = "UPDATE notificacion SET estado = 'Leida' 
                     WHERE id_usuario_destinatario = ? AND estado = 'No Leida'";
            
            $this->enlace->executePrepared_DML($vSql, 's', [(string)$idUsuario]);

            return ['success' => true, 'message' => 'Todas las notificaciones marcadas como leídas'];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function marcarComoLeidaUna($objeto){
        try{
          $vSql = "UPDATE notificacion SET estado = 'Leida' WHERE id_notificacion = ?";

            $this->enlace->executePrepared_DML($vSql, 'i', [(int)$objeto->id_notificacion]);
            return ['success' => true, 'message' => 'Notificación marcada como leída'];
        }
        catch(Exception $e){
            handleException($e);
        }
    }

    /**
     * Eliminar notificación
     */
    public function delete($id)
    {
        try {
            $vSql = "DELETE FROM notificacion WHERE id_notificacion = ?";
            $this->enlace->executePrepared_DML($vSql, 'i', [(int)$id]);

            return ['success' => true, 'id_notificacion' => (int)$id];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Notificar a administradores que se creó un mantenimiento (cat/etiq/especialidad)
     * @param string $tipo  Ej: 'Categoría', 'Etiqueta', 'Especialidad'
     * @param string $nombre  Nombre del registro creado
     * @param string|null $idUsuarioRemitente  Usuario que ejecutó la acción (opcional)
     */
    public function notificarMantenimientoCreado($tipo, $nombre, $idUsuarioRemitente = null)
    {
        try {
            $mensajeBase = sprintf("%s '%s' ha sido creado correctamente", $tipo, $nombre);
            $n = $this->create((object)[
                'id_usuario_destinatario' => null, // forzar uso de admin por defecto
                'id_usuario_remitente' => $idUsuarioRemitente,
                'tipo_evento' => 'Mantenimiento creado',
                'mensaje' => $mensajeBase
            ]);
            return ['success' => true, 'notificaciones' => $n ? [$n] : []];
        } catch (Exception $e) {
            error_log('Error notificarMantenimientoCreado: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Crear notificación de cambio de estado de ticket
     */
    public function notificarCambioEstado($idTicket, $idUsuarioRemitente, $nuevoEstado, $observaciones = null)
    {
        try {
            $ticketModel = new TicketModel();
            $ticket = $ticketModel->get($idTicket);
            if (!$ticket) { return ['success' => false, 'error' => 'Ticket no encontrado']; }
            $mensaje = "Se ha cambiado el estado del ticket #{$idTicket}";
            $n = $this->create((object)[
                'id_usuario_destinatario' => null, // fallback a admin
                'id_usuario_remitente' => $idUsuarioRemitente,
                'tipo_evento' => 'Cambio de estado',
                'mensaje' => $mensaje
            ]);
            return ['success' => true, 'notificaciones' => $n ? [$n] : []];
        } catch (Exception $e) {
            // No fallar la operación principal si falla la notificación
            error_log("Error al crear notificaciones: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Crear notificación de inicio de sesión
     */
    public function notificarInicioSesion($idUsuario)
    {
        try {
            $mensaje = "Has iniciado sesión exitosamente el " . date('d/m/Y \a \l\a\s H:i');
            
            $this->create((object)[
                'id_usuario_destinatario' => $idUsuario,
                'id_usuario_remitente' => null,
                'tipo_evento' => 'Inicio de sesión',
                'mensaje' => $mensaje
            ]);

            return ['success' => true];
        } catch (Exception $e) {
            error_log("Error al crear notificación de login: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
