<?php
/**
 * Modelo para gestionar asignaciones de tickets a técnicos
 * Incluye lógica de autotriage (asignación automática) y asignación manual
 */
class AsignacionModel
{
    public $enlace;
    
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    /**
     * Obtener tickets pendientes para asignación
     */
    public function getTicketsPendientes()
    {
        try {
            $sql = "SELECT t.*, 
                           c.nombre AS categoria_nombre,
                           c.id_sla,
                           s.tiempo_resolucion_max,
                           u.nombre AS cliente_nombre,
                           TIMESTAMPDIFF(MINUTE, t.fecha_creacion, NOW()) AS minutos_transcurridos
                    FROM ticket t
                    JOIN categoria_ticket c ON t.id_categoria = c.id_categoria
                    JOIN sla s ON c.id_sla = s.id_sla
                    JOIN usuario u ON t.id_usuario = u.id_usuario
                    WHERE t.id_estado = 1 AND t.id_tecnico IS NULL
                    ORDER BY t.prioridad DESC, t.fecha_creacion ASC";
            
            return $this->enlace->ExecuteSQL($sql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener técnicos disponibles con sus especialidades y carga de trabajo
     */
    public function getTecnicosDisponibles()
    {
        try {
            $sql = "SELECT t.id_tecnico,
                           t.id_usuario,
                           u.nombre,
                           u.correo,
                           t.disponibilidad,
                           t.carga_trabajo,
                           (SELECT COUNT(*) FROM ticket tk 
                            WHERE tk.id_tecnico = t.id_tecnico 
                            AND tk.id_estado IN (2,3)) AS tickets_activos
                    FROM tecnico t
                    JOIN usuario u ON t.id_usuario = u.id_usuario
                    WHERE t.disponibilidad = 1
                    ORDER BY t.carga_trabajo ASC, tickets_activos ASC";
            
            $tecnicos = $this->enlace->ExecuteSQL($sql);
            
            // Obtener especialidades de cada técnico
            foreach ($tecnicos as &$tec) {
                $sqlEsp = "SELECT e.id_especialidad, e.nombre, e.id_categoria
                          FROM tecnico_especialidad te
                          JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                          WHERE te.id_tecnico = ?";
                $especialidades = $this->enlace->executePrepared($sqlEsp, 'i', [(int)$tec->id_tecnico]);
                $tec->especialidades = $especialidades;
            }
            
            return $tecnicos;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Calcular puntaje de prioridad para autotriage
     * Fórmula: puntaje = (prioridad * 1000) - tiempoRestanteSLA
     */
    private function calcularPuntajePrioridad($ticket)
    {
        // Mapeo de prioridades
        $prioridadValores = [
            'Baja' => 1,
            'Media' => 2,
            'Alta' => 3
        ];
        
        $prioridad = $prioridadValores[$ticket->prioridad] ?? 2;
        $minutosPasados = (int)$ticket->minutos_transcurridos;
        $tiempoMaxSLA = (int)$ticket->tiempo_resolucion_max;
        $tiempoRestante = $tiempoMaxSLA - $minutosPasados;
        
        // Fórmula del requerimiento
        $puntaje = ($prioridad * 1000) - $tiempoRestante;
        
        return [
            'puntaje' => $puntaje,
            'prioridad_valor' => $prioridad,
            'prioridad_texto' => $ticket->prioridad,
            'tiempo_restante_minutos' => $tiempoRestante,
            'tiempo_restante_horas' => round($tiempoRestante / 60, 2),
            'sla_vencido' => $tiempoRestante < 0
        ];
    }

    /**
     * Asignación automática (AUTOTRIAGE)
     * Asigna tickets pendientes al técnico más adecuado según:
     * 1. Especialidad del técnico vs categoría del ticket
     * 2. Carga de trabajo actual
     * 3. Puntaje de prioridad
     */
    public function asignarAutomatico($idTicket = null)
    {
        try {
            $resultados = [];
            
            // Obtener tickets pendientes
            $tickets = $idTicket 
                ? [$this->getTicketById($idTicket)]
                : $this->getTicketsPendientes();
            
            if (empty($tickets)) {
                return [
                    'success' => false,
                    'message' => 'No hay tickets pendientes para asignar'
                ];
            }

            // Obtener técnicos disponibles
            $tecnicos = $this->getTecnicosDisponibles();
            
            if (empty($tecnicos)) {
                return [
                    'success' => false,
                    'message' => 'No hay técnicos disponibles para asignación'
                ];
            }

            foreach ($tickets as $ticket) {
                $calculos = $this->calcularPuntajePrioridad($ticket);
                $tecnicoAsignado = null;
                $justificacion = '';
                
                // Filtrar técnicos con la especialidad correcta
                $tecnicosConEspecialidad = array_filter($tecnicos, function($tec) use ($ticket) {
                    foreach ($tec->especialidades as $esp) {
                        if ((int)$esp->id_categoria === (int)$ticket->id_categoria) {
                            return true;
                        }
                    }
                    return false;
                });

                if (empty($tecnicosConEspecialidad)) {
                    $resultados[] = [
                        'success' => false,
                        'id_ticket' => $ticket->id_ticket,
                        'message' => 'No hay técnicos con la especialidad requerida para la categoría: ' . $ticket->categoria_nombre,
                        'calculos' => $calculos
                    ];
                    continue;
                }

                // Ordenar por carga de trabajo (menor a mayor)
                usort($tecnicosConEspecialidad, function($a, $b) {
                    return $a->tickets_activos <=> $b->tickets_activos;
                });

                // Seleccionar el técnico con menos carga
                $tecnicoAsignado = $tecnicosConEspecialidad[0];
                
                $justificacion = sprintf(
                    "Asignación automática: Técnico '%s' seleccionado por especialidad en '%s' y menor carga de trabajo (%d tickets activos). Puntaje calculado: %d (Prioridad: %s[%d] * 1000 - Tiempo restante SLA: %d min).",
                    $tecnicoAsignado->nombre,
                    $ticket->categoria_nombre,
                    $tecnicoAsignado->tickets_activos,
                    $calculos['puntaje'],
                    $calculos['prioridad_texto'],
                    $calculos['prioridad_valor'],
                    $calculos['tiempo_restante_minutos']
                );

                // Realizar la asignación
                $resultadoAsignacion = $this->ejecutarAsignacion(
                    $ticket->id_ticket,
                    $tecnicoAsignado->id_tecnico,
                    'Automatica',
                    $justificacion,
                    $calculos['puntaje'], // Pasar el puntaje calculado
                    null // No hay usuario asignador en modo automático
                );

                $resultados[] = array_merge($resultadoAsignacion, [
                    'calculos' => $calculos,
                    'tecnico' => [
                        'id' => $tecnicoAsignado->id_tecnico,
                        'nombre' => $tecnicoAsignado->nombre,
                        'carga' => $tecnicoAsignado->tickets_activos
                    ]
                ]);
            }

            return [
                'success' => true,
                'asignaciones' => $resultados,
                'total_procesados' => count($resultados),
                'total_exitosos' => count(array_filter($resultados, fn($r) => $r['success'] ?? false))
            ];
        } catch (Exception $e) {
            handleException($e);
            return [
                'success' => false,
                'message' => 'Error en asignación automática: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Asignación manual
     */
    public function asignarManual($idTicket, $idTecnico, $justificacion = null, $idUsuarioAsigna = null)
    {
        try {
            // Validar que el ticket esté en estado Pendiente
            $ticket = $this->getTicketById($idTicket);
            if (!$ticket) {
                throw new Exception('Ticket no encontrado');
            }

            if ((int)$ticket->id_estado !== 1) {
                throw new Exception('Solo se pueden asignar tickets en estado Pendiente');
            }

            if ($ticket->id_tecnico) {
                throw new Exception('El ticket ya tiene un técnico asignado');
            }

            // Validar que el técnico tenga la especialidad requerida
            $sqlEsp = "SELECT e.id_especialidad
                      FROM tecnico_especialidad te
                      JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                      WHERE te.id_tecnico = ? AND e.id_categoria = ?";
            
            $especialidad = $this->enlace->executePrepared($sqlEsp, 'ii', [
                (int)$idTecnico,
                (int)$ticket->id_categoria
            ]);

            if (empty($especialidad)) {
                throw new Exception('El técnico seleccionado no tiene la especialidad requerida para esta categoría de ticket');
            }

            $justificacionFinal = $justificacion 
                ? "Asignación manual: " . $justificacion
                : "Asignación manual realizada por administrador";

            return $this->ejecutarAsignacion(
                $idTicket, 
                $idTecnico, 
                'Manual', 
                $justificacionFinal,
                null, // No hay puntaje en asignación manual
                $idUsuarioAsigna
            );
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Ejecutar la asignación (común para automática y manual)
     */
    private function ejecutarAsignacion($idTicket, $idTecnico, $metodo, $justificacion, $puntajeCalculado = null, $idUsuarioAsigna = null)
    {
        try {
            // Actualizar el ticket
            $sqlUpdate = "UPDATE ticket SET id_tecnico = ?, id_estado = 2 WHERE id_ticket = ?";
            $this->enlace->executePrepared_DML($sqlUpdate, 'ii', [(int)$idTecnico, (int)$idTicket]);

            // Registrar en historial CON ID_USUARIO (sistema automático = NULL o admin)
            $sqlHistorial = "INSERT INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario) 
                            VALUES (?, 2, ?, ?)";
            $this->enlace->executePrepared_DML($sqlHistorial, 'iss', [
                (int)$idTicket,
                $justificacion,
                $idUsuarioAsigna
            ]);

            // NUEVO: Registrar en tabla de auditoría de asignaciones
            try {
                $asignacionRegModel = new AsignacionRegistroModel();
                $asignacionRegModel->registrar(
                    $idTicket,
                    $idTecnico,
                    $metodo,
                    $justificacion,
                    $puntajeCalculado,
                    $idUsuarioAsigna
                );
            } catch (Exception $e) {
                error_log("Error al registrar asignación en auditoría: " . $e->getMessage());
            }

            // Incrementar carga de trabajo del técnico
            $sqlCarga = "UPDATE tecnico SET carga_trabajo = carga_trabajo + 1 WHERE id_tecnico = ?";
            $this->enlace->executePrepared_DML($sqlCarga, 'i', [(int)$idTecnico]);

            // Generar notificaciones
            try {
                $notifModel = new NotificacionModel();
                $notifModel->notificarCambioEstado($idTicket, null, 'Asignado', $justificacion);
            } catch (Exception $e) {
                error_log("Error al generar notificaciones: " . $e->getMessage());
            }

            return [
                'success' => true,
                'id_ticket' => $idTicket,
                'id_tecnico' => $idTecnico,
                'metodo' => $metodo,
                'message' => "Ticket asignado exitosamente mediante método: $metodo"
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al ejecutar asignación: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener un ticket por ID (auxiliar)
     */
    private function getTicketById($idTicket)
    {
        $sql = "SELECT t.*, 
                       c.nombre AS categoria_nombre,
                       c.id_sla,
                       s.tiempo_resolucion_max,
                       TIMESTAMPDIFF(MINUTE, t.fecha_creacion, NOW()) AS minutos_transcurridos
                FROM ticket t
                JOIN categoria_ticket c ON t.id_categoria = c.id_categoria
                JOIN sla s ON c.id_sla = s.id_sla
                WHERE t.id_ticket = ?";
        
        $result = $this->enlace->executePrepared($sql, 'i', [(int)$idTicket]);
        return $result[0] ?? null;
    }
}
