<?php
/**
 * Modelo para gestionar el registro de auditoría de asignaciones de tickets
 * Mantiene trazabilidad completa de todas las asignaciones (automáticas y manuales)
 */
class AsignacionRegistroModel
{
    public $enlace;
    
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    /**
     * Registrar una nueva asignación en el log de auditoría
     * 
     * @param int $idTicket ID del ticket asignado
     * @param int $idTecnico ID del técnico asignado
     * @param string $metodo 'Automatica' o 'Manual'
     * @param string $justificacion Razón de la asignación
     * @param int|null $puntajeCalculado Puntaje del autotriage (solo para automáticas)
     * @param string|null $idUsuarioAsigna ID del usuario que asigna (solo para manuales)
     * @return array Resultado de la operación
     */
    public function registrar($idTicket, $idTecnico, $metodo, $justificacion, $puntajeCalculado = null, $idUsuarioAsigna = null)
    {
        try {
            if (!in_array($metodo, ['Automatica', 'Manual'])) {
                throw new Exception("Método de asignación inválido. Debe ser 'Automatica' o 'Manual'");
            }

            $sql = "INSERT INTO asignacion 
                    (id_ticket, id_tecnico, fecha_asignacion, metodo, justificacion, puntaje_calculado, id_usuario_asigna)
                    VALUES (?, ?, NOW(), ?, ?, ?, ?)";
            
            $idAsignacion = $this->enlace->executePrepared_DML_last($sql, 'iissis', [
                (int)$idTicket,
                (int)$idTecnico,
                $metodo,
                $justificacion,
                $puntajeCalculado,
                $idUsuarioAsigna
            ]);

            return [
                'success' => true,
                'id_asignacion' => $idAsignacion,
                'message' => 'Asignación registrada correctamente en auditoría'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al registrar asignación: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener todas las asignaciones con información completa
     */
    public function getAll()
    {
        try {
            $sql = "SELECT * FROM asignacion_completa ORDER BY fecha_asignacion DESC";
            return $this->enlace->ExecuteSQL($sql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener asignaciones de un ticket específico
     */
    public function getByTicket($idTicket)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa WHERE id_ticket = ? ORDER BY fecha_asignacion DESC";
            return $this->enlace->executePrepared($sql, 'i', [(int)$idTicket]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener asignaciones de un técnico específico
     */
    public function getByTecnico($idTecnico)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa WHERE id_tecnico = ? ORDER BY fecha_asignacion DESC";
            return $this->enlace->executePrepared($sql, 'i', [(int)$idTecnico]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener la última asignación de un ticket
     */
    public function getUltimaAsignacion($idTicket)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa 
                    WHERE id_ticket = ? 
                    ORDER BY fecha_asignacion DESC 
                    LIMIT 1";
            $result = $this->enlace->executePrepared($sql, 'i', [(int)$idTicket]);
            return $result[0] ?? null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener estadísticas de asignaciones
     */
    public function getEstadisticas()
    {
        try {
            $sql = "SELECT 
                        metodo,
                        COUNT(*) as total_asignaciones,
                        COUNT(DISTINCT id_ticket) as tickets_asignados,
                        COUNT(DISTINCT id_tecnico) as tecnicos_involucrados,
                        AVG(puntaje_calculado) as puntaje_promedio
                    FROM asignacion
                    GROUP BY metodo";
            return $this->enlace->ExecuteSQL($sql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener historial de asignaciones por rango de fechas
     */
    public function getByFechas($fechaInicio, $fechaFin)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa 
                    WHERE fecha_asignacion BETWEEN ? AND ? 
                    ORDER BY fecha_asignacion DESC";
            return $this->enlace->executePrepared($sql, 'ss', [$fechaInicio, $fechaFin]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener asignaciones automáticas con su puntaje
     */
    public function getAutomaticas($limit = 100)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa 
                    WHERE metodo = 'Automatica' 
                    ORDER BY fecha_asignacion DESC 
                    LIMIT ?";
            return $this->enlace->executePrepared($sql, 'i', [(int)$limit]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener asignaciones manuales con usuario asignador
     */
    public function getManuales($limit = 100)
    {
        try {
            $sql = "SELECT * FROM asignacion_completa 
                    WHERE metodo = 'Manual' 
                    ORDER BY fecha_asignacion DESC 
                    LIMIT ?";
            return $this->enlace->executePrepared($sql, 'i', [(int)$limit]);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
