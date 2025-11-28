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
     * --- Helpers de normalización ---
     * normalizeResult: asegura que siempre devuelva un array de objetos (aunque la BD retorne null, [] o arrays asociativos)
     */
    private function normalizeResult($data)
    {
        if ($data === null) return [];

        // Si viene un solo objeto (no en array), manejarlo
        if (!is_array($data)) {
            // Puede ser un objeto -> devolver array con ese objeto
            if (is_object($data)) return [$data];
            return [];
        }

        $out = [];
        foreach ($data as $row) {
            if (is_object($row)) {
                $out[] = $row;
            } elseif (is_array($row)) {
                // convertir array asociativo a objeto para mantener acceso -> propiedad
                $out[] = (object) $row;
            } else {
                // valor inesperado, ignorar
            }
        }
        return $out;
    }

    /**
     * normalizeSingle: convierte un resultado (array[0] o objeto) en objeto o null
     */
    private function normalizeSingle($data)
    {
        if ($data === null) return null;
        if (is_object($data)) return $data;
        if (is_array($data)) {
            // si es array de filas, tomar la primera
            if (count($data) === 0) return null;
            $first = $data[0];
            return is_object($first) ? $first : (object)$first;
        }
        return null;
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
                    ORDER BY FIELD(t.prioridad, 'Alta', 'Media', 'Baja') DESC, t.fecha_creacion ASC";

            $res = $this->enlace->ExecuteSQL($sql);
            return $this->normalizeResult($res);
        } catch (Exception $e) {
            handleException($e);
            return [];
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

            $tecnicosRaw = $this->enlace->ExecuteSQL($sql);
            $tecnicos = $this->normalizeResult($tecnicosRaw);

            // Obtener especialidades de cada técnico (si no tiene, dejar array vacío)
            foreach ($tecnicos as &$tec) {
                // proteger si la fila vino como array asociativo convertido a objeto
                $idTec = isset($tec->id_tecnico) ? (int)$tec->id_tecnico : null;
                if ($idTec === null) {
                    $tec->especialidades = [];
                    $tec->tickets_activos = isset($tec->tickets_activos) ? (int)$tec->tickets_activos : 0;
                    continue;
                }

                $sqlEsp = "SELECT e.id_especialidad, e.nombre, e.id_categoria
                           FROM tecnico_especialidad te
                           JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                           WHERE te.id_tecnico = ?";

                $especialidadesRaw = $this->enlace->executePrepared($sqlEsp, 'i', [$idTec]);
                $especialidades = $this->normalizeResult($especialidadesRaw);

                $tec->especialidades = $especialidades; // siempre array (posiblemente vacío)
                // normalizar tickets_activos a int
                $tec->tickets_activos = isset($tec->tickets_activos) ? (int)$tec->tickets_activos : 0;
                // garantizar carga_trabajo como int
                $tec->carga_trabajo = isset($tec->carga_trabajo) ? (int)$tec->carga_trabajo : 0;
            }
            unset($tec);

            return $tecnicos;
        } catch (Exception $e) {
            handleException($e);
            return [];
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

        $prioridadTexto = isset($ticket->prioridad) ? $ticket->prioridad : 'Media';
        $prioridad = $prioridadValores[$prioridadTexto] ?? 2;
        $minutosPasados = isset($ticket->minutos_transcurridos) ? (int)$ticket->minutos_transcurridos : 0;
        $tiempoMaxSLA = isset($ticket->tiempo_resolucion_max) ? (int)$ticket->tiempo_resolucion_max : 0;
        $tiempoRestante = $tiempoMaxSLA - $minutosPasados;

        // Fórmula del requerimiento
        $puntaje = ($prioridad * 1000) - $tiempoRestante;

        return [
            'puntaje' => $puntaje,
            'prioridad_valor' => $prioridad,
            'prioridad_texto' => $prioridadTexto,
            'tiempo_restante_minutos' => $tiempoRestante,
            'tiempo_restante_horas' => round($tiempoRestante / 60, 2),
            'sla_vencido' => $tiempoRestante < 0
        ];
    }

    /**
     * Asignación automática (AUTOTRIAGE)
     */
    public function asignarAutomatico($idTicket = null)
    {
        try {
            $resultados = [];

            // Obtener tickets pendientes (o el ticket específico)
            if ($idTicket !== null) {
                $ticketObj = $this->getTicketById($idTicket);
                $tickets = $ticketObj ? [$ticketObj] : [];
            } else {
                $tickets = $this->getTicketsPendientes();
            }

            // Normalizar
            $tickets = is_array($tickets) ? $tickets : [];
            if (empty($tickets)) {
                return [
                    'success' => false,
                    'message' => 'No hay tickets pendientes para asignar'
                ];
            }

            // Obtener técnicos disponibles
            $tecnicos = $this->getTecnicosDisponibles();
            $tecnicos = is_array($tecnicos) ? $tecnicos : [];

            if (empty($tecnicos)) {
                return [
                    'success' => false,
                    'message' => 'No hay técnicos disponibles para asignación'
                ];
            }

            foreach ($tickets as $ticket) {
                if (!$ticket) continue; // protección extra

                $calculos = $this->calcularPuntajePrioridad($ticket);

                // Filtrar técnicos con la especialidad correcta (protegemos si no tiene especialidades)
                $tecnicosConEspecialidad = array_filter($tecnicos, function($tec) use ($ticket) {
                    if (!isset($tec->especialidades) || !is_array($tec->especialidades)) return false;
                    foreach ($tec->especialidades as $esp) {
                        // proteger si esp es objeto o array
                        $catId = isset($esp->id_categoria) ? (int)$esp->id_categoria : (isset($esp['id_categoria']) ? (int)$esp['id_categoria'] : null);
                        if ($catId !== null && isset($ticket->id_categoria) && $catId === (int)$ticket->id_categoria) {
                            return true;
                        }
                    }
                    return false;
                });

                if (empty($tecnicosConEspecialidad)) {
                    $resultados[] = [
                        'success' => false,
                        'id_ticket' => isset($ticket->id_ticket) ? $ticket->id_ticket : null,
                        'message' => 'No hay técnicos con la especialidad requerida para la categoría: ' . (isset($ticket->categoria_nombre) ? $ticket->categoria_nombre : ''),
                        'calculos' => $calculos
                    ];
                    continue;
                }

                // Ordenar por tickets_activos (menor a mayor)
                usort($tecnicosConEspecialidad, function($a, $b) {
                    $ta = isset($a->tickets_activos) ? (int)$a->tickets_activos : 0;
                    $tb = isset($b->tickets_activos) ? (int)$b->tickets_activos : 0;
                    return $ta <=> $tb;
                });

                $tecnicoAsignado = $tecnicosConEspecialidad[0];

                $justificacion = sprintf(
                    "Asignación automática: Técnico '%s' seleccionado por especialidad en '%s' y menor carga de trabajo (%d tickets activos). Puntaje calculado: %d (Prioridad: %s[%d] - Tiempo restante SLA: %d min).",
                    isset($tecnicoAsignado->nombre) ? $tecnicoAsignado->nombre : 'N/A',
                    isset($ticket->categoria_nombre) ? $ticket->categoria_nombre : 'N/A',
                    isset($tecnicoAsignado->tickets_activos) ? (int)$tecnicoAsignado->tickets_activos : 0,
                    $calculos['puntaje'],
                    $calculos['prioridad_texto'],
                    $calculos['prioridad_valor'],
                    $calculos['tiempo_restante_minutos']
                );

                // Realizar la asignación
                $resultadoAsignacion = $this->ejecutarAsignacion(
                    isset($ticket->id_ticket) ? $ticket->id_ticket : null,
                    isset($tecnicoAsignado->id_tecnico) ? $tecnicoAsignado->id_tecnico : null,
                    'Automatica',
                    $justificacion,
                    $calculos['puntaje']
                );

                // Actualizar tickets_activos del técnico asignado en memoria
                if ($resultadoAsignacion['success']) {
                    $tecnicoAsignado->tickets_activos = (isset($tecnicoAsignado->tickets_activos) ? (int)$tecnicoAsignado->tickets_activos : 0) + 1;
                }

                $resultados[] = array_merge($resultadoAsignacion, [
                    'calculos' => $calculos,
                    'tecnico' => [
                        'id' => isset($tecnicoAsignado->id_tecnico) ? $tecnicoAsignado->id_tecnico : null,
                        'nombre' => isset($tecnicoAsignado->nombre) ? $tecnicoAsignado->nombre : null,
                        'carga' => isset($tecnicoAsignado->tickets_activos) ? (int)$tecnicoAsignado->tickets_activos : 0
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
    public function asignarManual($idTicket, $idTecnico, $justificacion = null)
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

            if (!empty($ticket->id_tecnico)) {
                throw new Exception('El ticket ya tiene un técnico asignado');
            }

            // Validar que el técnico tenga la especialidad requerida
            $sqlEsp = "SELECT e.id_especialidad
                      FROM tecnico_especialidad te
                      JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                      WHERE te.id_tecnico = ? AND e.id_categoria = ?";
            
            $especialidadRaw = $this->enlace->executePrepared($sqlEsp, 'ii', [
                (int)$idTecnico,
                (int)$ticket->id_categoria
            ]);
            $especialidad = $this->normalizeResult($especialidadRaw);

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
                null // No hay puntaje en asignación manual
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
    private function ejecutarAsignacion($idTicket, $idTecnico, $metodo, $justificacion, $puntajeCalculado = null)
    {
        try {
            if ($idTicket === null || $idTecnico === null) {
                throw new Exception("Parámetros inválidos para ejecutar asignación");
            }

            // Actualizar el ticket
            $sqlUpdate = "UPDATE ticket SET id_tecnico = ?, id_estado = 2 WHERE id_ticket = ?";
            $this->enlace->executePrepared_DML($sqlUpdate, 'ii', [(int)$idTecnico, (int)$idTicket]);

            // Registrar en historial
            $sqlHistorial = "INSERT INTO historial_estados (id_ticket, id_estado, observaciones) 
                            VALUES (?, ?, ?)";
            $this->enlace->executePrepared_DML($sqlHistorial, 'iis', [
                (int)$idTicket,
                2,
                $justificacion
            ]);

            // Incrementar carga de trabajo del técnico
            $sqlCarga = "UPDATE tecnico SET carga_trabajo = carga_trabajo + 1 WHERE id_tecnico = ?";
            $this->enlace->executePrepared_DML($sqlCarga, 'i', [(int)$idTecnico]);

            // Registrar auditoría de asignación en tabla 'asignacion'
            $sqlAuditoria = "INSERT INTO asignacion (id_ticket, id_tecnico, metodo, justificacion, puntaje_calculado, id_usuario_asigna)
                             VALUES (?, ?, ?, ?, ?, ?)";
            // Para asignación automática, el usuario asigna es el sistema (ID '1-ADMIN' si existe) o null
            $idUsuarioAsigna = ($metodo === 'Automatica') ? null : (isset($_SESSION['id_usuario']) ? $_SESSION['id_usuario'] : null);
            $this->enlace->executePrepared_DML($sqlAuditoria, 'iissis', [
                (int)$idTicket,
                (int)$idTecnico,
                $metodo,
                $justificacion,
                $puntajeCalculado !== null ? (int)$puntajeCalculado : null,
                $idUsuarioAsigna
            ]);
            // CRÍTICO: Generar notificaciones al técnico Y al cliente
            // Sistema automático como remitente (usuario ID 1 - Administrador por defecto)
            require_once 'NotificacionModel.php';
            $notifModel = new NotificacionModel();
            $notifModel->notificarCambioEstado($idTicket, 1, 'Asignado', $justificacion);


            return [
                'success' => true,
                'id_ticket' => $idTicket,
                'id_tecnico' => $idTecnico,
                'metodo' => $metodo,
                'message' => "Ticket asignado exitosamente mediante método: $metodo"
            ];
        } catch (Exception $e) {
            error_log("Error en ejecutarAsignacion: " . $e->getMessage());
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
        try {
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
            // retornar como objeto o null
            return $this->normalizeSingle($result);
        } catch (Exception $e) {
            handleException($e);
            return null;
        }
    }
}
