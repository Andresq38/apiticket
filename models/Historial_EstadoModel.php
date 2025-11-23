<?php
class Historial_EstadoModel
{
    public $enlace;
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    /**
     * Listar todo el historial con información completa
     */
    public function all(){
        try {
            $vSql = "SELECT he.*, 
                            e.nombre AS estado_nombre,
                            u.nombre AS usuario_nombre,
                            u.correo AS usuario_correo,
                            t.titulo AS ticket_titulo
                     FROM historial_estados he
                     LEFT JOIN estado e ON he.id_estado = e.id_estado
                     LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
                     LEFT JOIN ticket t ON he.id_ticket = t.id_ticket
                     ORDER BY he.fecha_cambio DESC";
            
            $vResultado = $this->enlace->ExecuteSQL($vSql);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener un registro de historial por ID
     */
    public function get($id)
    {
        try {
            $vSql = "SELECT he.*, 
                            e.nombre AS estado_nombre,
                            u.nombre AS usuario_nombre,
                            u.correo AS usuario_correo,
                            t.titulo AS ticket_titulo
                     FROM historial_estados he
                     LEFT JOIN estado e ON he.id_estado = e.id_estado
                     LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
                     LEFT JOIN ticket t ON he.id_ticket = t.id_ticket
                     WHERE he.id_historial = ?";
            
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$id]);
            return !empty($vResultado) ? $vResultado[0] : null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener historial completo de un ticket específico
     * Incluye información del usuario responsable, estado, y opcionalmente imágenes
     */
    public function getByTicket($idTicket)
    {
        try {
            $vSql = "SELECT he.*, 
                            e.nombre AS estado_nombre,
                            u.nombre AS usuario_nombre,
                            u.correo AS usuario_correo
                     FROM historial_estados he
                     LEFT JOIN estado e ON he.id_estado = e.id_estado
                     LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
                     WHERE he.id_ticket = ?
                     ORDER BY he.fecha_cambio ASC";
            
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$idTicket]);
            
            // Para cada entrada de historial, obtener las imágenes asociadas
            foreach ($vResultado as &$historial) {
                $historial->imagenes = $this->getImagenesByHistorial($historial->id_historial);
            }
            
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener imágenes asociadas a un registro de historial
     */
    public function getImagenesByHistorial($idHistorial)
    {
        try {
            $vSql = "SELECT * FROM imagen WHERE id_historial = ? ORDER BY id_imagen ASC";
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$idHistorial]);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
            return [];
        }
    }

    /**
     * Crear un nuevo registro de historial
     */
    public function create($objeto)
    {
        try {
            if (empty($objeto->id_ticket) || empty($objeto->id_estado)) {
                throw new Exception("Campos requeridos: id_ticket, id_estado");
            }

            $observaciones = $objeto->observaciones ?? null;
            $idUsuario = $objeto->id_usuario ?? null;

            $vSql = "INSERT INTO historial_estados 
                     (id_ticket, id_estado, observaciones, id_usuario, fecha_cambio)
                     VALUES (?, ?, ?, ?, NOW())";
            
            $idHistorial = $this->enlace->executePrepared_DML_last($vSql, 'iiss', [
                (int)$objeto->id_ticket,
                (int)$objeto->id_estado,
                $observaciones,
                $idUsuario
            ]);

            return $this->get($idHistorial);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener el historial más reciente de un ticket
     */
    public function getUltimoByTicket($idTicket)
    {
        try {
            $vSql = "SELECT he.*, 
                            e.nombre AS estado_nombre,
                            u.nombre AS usuario_nombre
                     FROM historial_estados he
                     LEFT JOIN estado e ON he.id_estado = e.id_estado
                     LEFT JOIN usuario u ON he.id_usuario = u.id_usuario
                     WHERE he.id_ticket = ?
                     ORDER BY he.fecha_cambio DESC
                     LIMIT 1";
            
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$idTicket]);
            return !empty($vResultado) ? $vResultado[0] : null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener estadísticas del historial (para reportes)
     */
    public function getEstadisticas()
    {
        try {
            $vSql = "SELECT 
                        e.nombre AS estado,
                        COUNT(he.id_historial) AS total_cambios,
                        COUNT(DISTINCT he.id_ticket) AS tickets_afectados
                     FROM historial_estados he
                     JOIN estado e ON he.id_estado = e.id_estado
                     GROUP BY e.id_estado, e.nombre
                     ORDER BY total_cambios DESC";
            
            return $this->enlace->ExecuteSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
