<?php
class TicketModel
{
    public $enlace;
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }
    /*Listar */
    public function all()
    {
        try {
            //Consulta sql
            $vSql = "SELECT 
                        t.id_ticket AS 'Identificador del Ticket',
                        t.titulo AS 'Título',
                        c.nombre AS 'Categoría',
                        e.nombre AS 'Estado actual',
                        CONCAT(
                            FLOOR((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, 
                                CONVERT_TZ(t.fecha_creacion, '+00:00', '-06:00'), 
                                NOW()
                            )) / 60), 
                            'h ',
                            MOD((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, 
                                CONVERT_TZ(t.fecha_creacion, '+00:00', '-06:00'), 
                                NOW()
                            )), 60),
                            'm'
                        ) AS 'Tiempo restante SLA'
                    FROM 
                        ticket t
                    JOIN 
                        categoria_ticket c ON t.id_categoria = c.id_categoria
                    JOIN 
                        estado e ON t.id_estado = e.id_estado
                    JOIN 
                        sla s ON c.id_sla = s.id_sla
                    ORDER BY 
                        t.id_ticket;";
            //Ejecutar la consulta
            $vResultado = $this->enlace->ExecuteSQL($vSql);

            // Retornar el objeto
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketByTecnico($idTecnico)
    {
        try {
            //Consulta sql
            $vSql = "SELECT 
                        t.id_ticket AS 'Identificador del Ticket',
                        t.titulo AS 'Título',
                        c.nombre AS 'Categoría',
                        e.nombre AS 'Estado actual',
                        CONCAT(
                        FLOOR((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, t.fecha_creacion, NOW())) / 60), 
                         'h ',
                        MOD((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, t.fecha_creacion, NOW())), 60),
                         'm'
                         ) AS 'Tiempo restante SLA'
                        FROM 
                            ticket t
                        JOIN 
                            categoria_ticket c ON t.id_categoria = c.id_categoria
                        JOIN 
                            estado e ON t.id_estado = e.id_estado
                        JOIN 
                            sla s ON c.id_sla = s.id_sla
                        WHERE 
                            t.id_tecnico = ?
                        ORDER BY 
                            t.id_ticket;";

            //Ejecutar la consulta con prepared statements
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$idTecnico]);

            // Retornar el objeto
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketByUsuario($idUsuario)
    {
        try {
            $vSql = "SELECT 
                        t.id_ticket AS 'Identificador del Ticket',
                        t.titulo AS 'Título',
                        c.nombre AS 'Categoría',
                        e.nombre AS 'Estado actual',
                        CONCAT(
                            FLOOR((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, 
                                CONVERT_TZ(t.fecha_creacion, '+00:00', '-06:00'), 
                                NOW()
                            )) / 60), 
                            'h ',
                            MOD((s.tiempo_resolucion_max - TIMESTAMPDIFF(MINUTE, 
                                CONVERT_TZ(t.fecha_creacion, '+00:00', '-06:00'), 
                                NOW()
                            )), 60),
                            'm'
                        ) AS 'Tiempo restante SLA'
                    FROM 
                        ticket t
                    JOIN 
                        categoria_ticket c ON t.id_categoria = c.id_categoria
                    JOIN 
                        estado e ON t.id_estado = e.id_estado
                    JOIN 
                        sla s ON c.id_sla = s.id_sla
                    WHERE 
                        t.id_usuario = ?
                    ORDER BY 
                        t.id_ticket;";

            $vResultado = $this->enlace->executePrepared($vSql, 's', [(string)$idUsuario]);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Eliminar un ticket por ID.
     * Se aprovechan las constraints ON DELETE CASCADE para historial_estados e imágenes relacionadas.
     */
    public function delete($id)
    {
        try {
            if (!isset($id)) {
                throw new Exception('ID de ticket requerido');
            }
            $sql = "DELETE FROM ticket WHERE id_ticket = ?";
            $this->enlace->executePrepared($sql, 'i', [(int)$id]);
            return [ 'success' => true, 'id_ticket' => (int)$id ];
        } catch (Exception $e) {
            handleException($e);
        }
    }


    /*Obtener */
    public function get($id)
    {
        try {
            //Consulta sql
            $vSql = "SELECT * FROM ticket WHERE id_ticket = ?";

            //Ejecutar la consulta
            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$id]);
            // Retornar el objeto
            return $vResultado[0] ?? null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /*Cambiar estado del ticket con validaciones estrictas */
    public function cambiarEstado($idTicket, $nuevoEstado, $observaciones = null, $idUsuarioRemitente = null)
    {
        try {
            // VALIDACIONES CRÍTICAS
            
            // 1. Validar que existan observaciones (comentario obligatorio)
            if (!$observaciones || trim($observaciones) === '') {
                throw new Exception('Las observaciones son obligatorias para cambiar el estado del ticket');
            }

            // 2. Obtener ticket actual
            $ticket = $this->get($idTicket);
            if (!$ticket) {
                throw new Exception('Ticket no encontrado');
            }

            $estadoActual = (int)$ticket->id_estado;
            $nuevoEstado = (int)$nuevoEstado;

            // 3. Mapeo de estados: 1=Pendiente, 2=Asignado, 3=En Proceso, 4=Resuelto, 5=Cerrado
            $estadosValidos = [1 => 'Pendiente', 2 => 'Asignado', 3 => 'En Proceso', 4 => 'Resuelto', 5 => 'Cerrado'];
            
            if (!isset($estadosValidos[$nuevoEstado])) {
                throw new Exception('Estado de destino no válido');
            }

            // 4. VALIDAR FLUJO ESTRICTO DE ESTADOS (no permitir saltos)
            $transicionesValidas = [
                1 => [2],           // Pendiente → solo puede ir a Asignado
                2 => [3],           // Asignado → solo puede ir a En Proceso
                3 => [4],           // En Proceso → solo puede ir a Resuelto
                4 => [5],           // Resuelto → solo puede ir a Cerrado
                5 => []             // Cerrado → no puede cambiar (estado final)
            ];

            if (!in_array($nuevoEstado, $transicionesValidas[$estadoActual])) {
                $nombreActual = $estadosValidos[$estadoActual];
                $nombreNuevo = $estadosValidos[$nuevoEstado];
                throw new Exception("Transición no permitida: no se puede cambiar de '{$nombreActual}' a '{$nombreNuevo}'. Debe seguir el flujo: Pendiente → Asignado → En Proceso → Resuelto → Cerrado");
            }

            // 5. VALIDAR TÉCNICO ASIGNADO (excepto en estado Pendiente)
            if ($nuevoEstado > 1 && empty($ticket->id_tecnico)) {
                throw new Exception('No se puede avanzar el ticket sin un técnico asignado. Asigne un técnico primero.');
            }

            // 6. Actualizar el estado actual del ticket
            $sqlUpdate = "UPDATE ticket SET id_estado = ? WHERE id_ticket = ?";
            $this->enlace->executePrepared_DML($sqlUpdate, 'ii', [$nuevoEstado, (int)$idTicket]);

            // 7. Insertar en historial_estados CON ID_USUARIO para trazabilidad
            $sqlHistorial = "INSERT INTO historial_estados (id_ticket, id_estado, observaciones, id_usuario) VALUES (?, ?, ?, ?)";
            $this->enlace->executePrepared_DML($sqlHistorial, 'iiss', [ (int)$idTicket, $nuevoEstado, $observaciones, $idUsuarioRemitente ]);
            // Obtener id_historial recién creado (para validaciones posteriores si se requiere)
            $idHistorialRow = $this->enlace->ExecuteSQL("SELECT LAST_INSERT_ID() AS id_historial");
            $idHistorial = isset($idHistorialRow[0]) ? (int)$idHistorialRow[0]->id_historial : null;

            // 8. Si el nuevo estado es "Cerrado" (id_estado = 5), actualizar fecha_cierre
            if ($nuevoEstado === 5) {
                $sqlCierre = "UPDATE ticket SET fecha_cierre = NOW() WHERE id_ticket = ?";
                $this->enlace->executePrepared_DML($sqlCierre, 'i', [(int)$idTicket]);
            }

            // VALIDACIÓN CRÍTICA DE IMÁGENES: Para avanzar a cualquier estado (excepto Pendiente→Asignado)
            // se exige que el historial recién creado tenga al menos una imagen asociada.
            // NOTA: Esta validación se aplica DESPUÉS de crear el historial pero ANTES de confirmar.
            // El endpoint cambiarEstadoConImagen debe usarse para garantizar esto.
            if ($estadoActual !== 1 || $nuevoEstado !== 2) {
                // Para cualquier transición que NO sea Pendiente→Asignado, validar imágenes
                $sqlCountImgs = "SELECT COUNT(*) AS total FROM historial_imagen hi
                                 WHERE hi.id_historial_estado = ?";
                $resImg = $this->enlace->executePrepared($sqlCountImgs, 'i', [ (int)$idHistorial ]);
                $totalImgs = isset($resImg[0]) ? (int)$resImg[0]->total : 0;
                if ($totalImgs === 0) {
                    throw new Exception('ADVERTENCIA: Debe usar el endpoint /cambiarEstadoConImagen para adjuntar evidencia obligatoria. No se permiten cambios de estado sin imágenes documentales (excepto asignación automática).');
                }
            }

            // 9. GENERAR NOTIFICACIONES
            try {
                $notifModel = new NotificacionModel();
                $nombreEstado = $estadosValidos[$nuevoEstado];
                $notifModel->notificarCambioEstado($idTicket, $idUsuarioRemitente, $nombreEstado, $observaciones);
            } catch (Exception $e) {
                // No fallar la operación si falla la notificación, solo registrar
                error_log("Error al generar notificaciones: " . $e->getMessage());
            }

            return [
                'success' => true,
                'message' => 'Estado del ticket actualizado correctamente a: ' . $estadosValidos[$nuevoEstado],
                'id_historial' => $idHistorial
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Cambiar estado con imágenes en una sola operación (endpoint estricto).
     * Requiere al menos UNA imagen adjunta siempre que se cambie de estado.
     */
    public function cambiarEstadoConImagen($idTicket, $nuevoEstado, $observaciones, $idUsuarioRemitente, $files)
    {
        try {
            if (!$idTicket || !$nuevoEstado) { throw new Exception('Parámetros incompletos'); }
            if (!$observaciones || trim($observaciones) === '') { throw new Exception('Observaciones obligatorias'); }
            if (empty($files) || !is_array($files) || count($files) === 0) { throw new Exception('Debe adjuntar al menos una imagen'); }

            // Reutilizar validaciones de flujo usando método existente (sin imágenes)
            $validacionPrevia = $this->cambiarEstado($idTicket, $nuevoEstado, $observaciones, $idUsuarioRemitente);
            if (!$validacionPrevia['success']) { return $validacionPrevia; }
            $idHistorial = $validacionPrevia['id_historial'] ?? null;
            if (!$idHistorial) { throw new Exception('No se pudo obtener historial para asociar imágenes'); }

            // Subir imágenes y asociarlas
            $imgModel = new ImagenModel();
            $subidas = [];
            foreach ($files as $f) {
                if (!isset($f['name']) || $f['error'] !== 0) { continue; }
                $resultado = $imgModel->uploadForHistorial($f, $idTicket, $idHistorial);
                if ($resultado['success']) {
                    $subidas[] = [ 'id_imagen' => $resultado['id_imagen'], 'filename' => $resultado['filename'] ];
                }
            }
            if (count($subidas) === 0) {
                throw new Exception('No se pudo procesar ninguna imagen. Operación cancelada.');
            }
            return [
                'success' => true,
                'message' => 'Estado e imágenes registrados correctamente',
                'imagenes' => $subidas,
                'id_historial' => $idHistorial
            ];
        } catch (Exception $e) {
            return [ 'success' => false, 'message' => $e->getMessage() ];
        }
    }

    // Obtener ticket completo por ID
    public function getTicketCompletoById($idTicket)
    {
        try {
            // Instancias de los modelos 
            $usuarioM = new UsuarioModel();
            $tecnicoM = new TecnicoModel();
            $categoriaM = new Categoria_ticketModel();
            $slaM = new SlaModel();
            $estadoM = new EstadoModel();
            $etiquetaM = new EtiquetaModel();

            // Traer el ticket principal (solo datos básicos y IDs relacionados)
            $sql = "SELECT * FROM ticket WHERE id_ticket = ?";
            $resultado = $this->enlace->executePrepared($sql, 'i', [(int)$idTicket]);

            if (empty($resultado) || !isset($resultado[0])) {
                return null; // No existe el ticket
            }

            $ticket = $resultado[0];

            // Obtener datos relacionados con comprobaciones de existencia
            $ticket->usuario = $usuarioM->get($ticket->id_usuario) ?? null;
            $ticket->tecnico = isset($ticket->id_tecnico) ? ($tecnicoM->get($ticket->id_tecnico) ?? null) : null;
            $ticket->categoria = $categoriaM->get($ticket->id_categoria) ?? null;
            // Obtener SLA usando la categoria si existe
            if ($ticket->categoria && isset($ticket->categoria->id_sla)) {
                $ticket->sla = $slaM->get($ticket->categoria->id_sla) ?? null;
            } else {
                $ticket->sla = null;
            }
            $ticket->estado = $estadoM->get($ticket->id_estado) ?? null;

            // Obtener etiquetas asociadas a la categoria usando el método adecuado
            if ($ticket->categoria && method_exists($categoriaM, 'getEtiquetasByCategoria')) {
                $ticket->etiquetas = $categoriaM->getEtiquetasByCategoria($ticket->categoria->id_categoria);
            } else {
                $ticket->etiquetas = [];
            }

            // Calcular tiempo restante SLA y fechas de SLA (si existe SLA)
            if ($ticket->sla && isset($ticket->sla->tiempo_resolucion_max) && is_numeric($ticket->sla->tiempo_resolucion_max)) {
                try {
                    $fechaCreacion = new DateTime($ticket->fecha_creacion);
                    $ahora = new DateTime();
                    $interval = $fechaCreacion->diff($ahora);
                    $minutosPasados = ($interval->days * 24 * 60) + ($interval->h * 60) + $interval->i;
                    $tiempoRestanteMin = max(0, $ticket->sla->tiempo_resolucion_max - $minutosPasados);
                    $horas = floor($tiempoRestanteMin / 60);
                    $minutos = $tiempoRestanteMin % 60;
                    $ticket->sla->tiempo_restante = "{$horas}h {$minutos}m";

                    // Fechas SLA basadas en tiempos máximos
                    if (isset($ticket->sla->tiempo_respuesta_max) && is_numeric($ticket->sla->tiempo_respuesta_max)) {
                        $fResp = clone $fechaCreacion;
                        $fResp->modify('+' . (int)$ticket->sla->tiempo_respuesta_max . ' minutes');
                        $ticket->sla_fecha_respuesta = $fResp->format('Y-m-d H:i:s');
                    } else {
                        $ticket->sla_fecha_respuesta = null;
                    }
                    if (isset($ticket->sla->tiempo_resolucion_max) && is_numeric($ticket->sla->tiempo_resolucion_max)) {
                        $fRes = clone $fechaCreacion;
                        $fRes->modify('+' . (int)$ticket->sla->tiempo_resolucion_max . ' minutes');
                        $ticket->sla_fecha_resolucion = $fRes->format('Y-m-d H:i:s');
                    } else {
                        $ticket->sla_fecha_resolucion = null;
                    }
                } catch (Exception $e) {
                    $ticket->sla->tiempo_restante = null;
                    $ticket->sla_fecha_respuesta = null;
                    $ticket->sla_fecha_resolucion = null;
                }
            } else {
                if ($ticket->sla) { $ticket->sla->tiempo_restante = null; }
                $ticket->sla_fecha_respuesta = null;
                $ticket->sla_fecha_resolucion = null;
            }

            // Adjuntar imágenes asociadas al ticket (según esquema actual imagen(id_ticket, imagen))
            try {
                $sqlImgs = "SELECT id_imagen, imagen AS nombre_archivo FROM imagen WHERE id_ticket = ? ORDER BY id_imagen";
                $imgs = $this->enlace->executePrepared($sqlImgs, 'i', [(int)$idTicket]);
                // Normalizar para frontend: incluir url relativa
                $normalizadas = [];
                if (is_array($imgs)) {
                    foreach ($imgs as $im) {
                        $obj = new stdClass();
                        $obj->id_imagen = $im->id_imagen;
                        $obj->imagen = $im->nombre_archivo; // conservar nombre
                        $obj->url = '/apiticket/uploads/' . $im->nombre_archivo;
                        $normalizadas[] = $obj;
                    }
                }
                $ticket->imagenes = $normalizadas;
            } catch (Exception $e) {
                $ticket->imagenes = [];
            }

            // Historial de estados (extendido con estado anterior)
            try {
                // Verificar si la vista extendida existe antes de consultarla para evitar 500
                $checkViewSql = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'historial_estados_ext' LIMIT 1";
                $viewExists = $this->enlace->executePrepared($checkViewSql, 's', [Config::get('DB_DBNAME')], 'asoc');
                if (is_array($viewExists) && count($viewExists) > 0) {
                    $sqlHist = "SELECT he.id_historial,
                                        he.id_ticket,
                                        he.id_estado_actual AS id_estado,
                                        he.estado_actual_nombre AS estado,
                                        he.id_estado_anterior,
                                        he.estado_anterior_nombre,
                                        he.fecha_cambio,
                                        he.observaciones
                                 FROM historial_estados_ext he
                                 WHERE he.id_ticket = ?
                                 ORDER BY he.fecha_cambio ASC";
                    $hist = $this->enlace->executePrepared($sqlHist, 'i', [(int)$idTicket]);
                    $ticket->historial_estados = is_array($hist) ? $hist : [];
                } else {
                    // Fallback a tabla básica historial_estados cuando la vista no existe
                    $sqlHistFallback = "SELECT 
                            he.id_historial,
                            he.id_ticket,
                            he.id_estado AS id_estado,
                            e.nombre AS estado,
                            NULL AS id_estado_anterior,
                            NULL AS estado_anterior_nombre,
                            he.fecha_cambio,
                            he.observaciones
                        FROM historial_estados he
                        LEFT JOIN estado e ON e.id_estado = he.id_estado
                        WHERE he.id_ticket = ?
                        ORDER BY he.fecha_cambio ASC";
                    $hist = $this->enlace->executePrepared($sqlHistFallback, 'i', [(int)$idTicket]);
                    $ticket->historial_estados = is_array($hist) ? $hist : [];
                }
            } catch (Exception $e) {
                $ticket->historial_estados = [];
            }

            return $ticket;
        } catch (Exception $e) {
            handleException($e);
        }
    }




    // Obtener todos los tickets completos
    public function getTicketsCompletos()
    {
        try {
            // Instancias de los modelos relacionados
            $usuarioM = new UsuarioModel();
            $tecnicoM = new TecnicoModel();
            $categoriaM = new Categoria_ticketModel();
            $slaM = new SlaModel();
            $estadoM = new EstadoModel();
            $etiquetaM = new EtiquetaModel();

            // Traer todos los tickets
            $sql = "SELECT * FROM ticket";
            $resultado = $this->enlace->executeSQL($sql);

            /** @var array<object> $resultado */
            if (!is_array($resultado) || empty($resultado)) {
                return []; // No hay tickets
            }

            $ticketsCompletos = [];

            foreach ($resultado as $ticket) {
                // Obtener datos relacionados con comprobaciones de existencia
                $ticket->usuario = $usuarioM->get($ticket->id_usuario) ?? null;
                $ticket->tecnico = isset($ticket->id_tecnico) ? ($tecnicoM->get($ticket->id_tecnico) ?? null) : null;
                $ticket->categoria = $categoriaM->get($ticket->id_categoria) ?? null;

                // Obtener SLA usando la categoría si existe
                if ($ticket->categoria && isset($ticket->categoria->id_sla)) {
                    $ticket->sla = $slaM->get($ticket->categoria->id_sla) ?? null;
                } else {
                    $ticket->sla = null;
                }

                // Obtener estado
                $ticket->estado = $estadoM->get($ticket->id_estado) ?? null;

                // Obtener etiquetas asociadas a la categoría
                if ($ticket->categoria && method_exists($categoriaM, 'getEtiquetasByCategoria')) {
                    $ticket->etiquetas = $categoriaM->getEtiquetasByCategoria($ticket->categoria->id_categoria);
                } else {
                    $ticket->etiquetas = [];
                }

                // Calcular tiempo restante del SLA y fechas SLA (si aplica)
                if ($ticket->sla && isset($ticket->sla->tiempo_resolucion_max) && is_numeric($ticket->sla->tiempo_resolucion_max)) {
                    try {
                        $fechaCreacion = new DateTime($ticket->fecha_creacion);
                        $ahora = new DateTime();
                        $interval = $fechaCreacion->diff($ahora);
                        $minutosPasados = ($interval->days * 24 * 60) + ($interval->h * 60) + $interval->i;
                        $tiempoRestanteMin = max(0, $ticket->sla->tiempo_resolucion_max - $minutosPasados);
                        $horas = floor($tiempoRestanteMin / 60);
                        $minutos = $tiempoRestanteMin % 60;
                        $ticket->sla->tiempo_restante = "{$horas}h {$minutos}m";

                        // Fechas SLA
                        if (isset($ticket->sla->tiempo_respuesta_max) && is_numeric($ticket->sla->tiempo_respuesta_max)) {
                            $fResp = clone $fechaCreacion;
                            $fResp->modify('+' . (int)$ticket->sla->tiempo_respuesta_max . ' minutes');
                            $ticket->sla_fecha_respuesta = $fResp->format('Y-m-d H:i:s');
                        } else {
                            $ticket->sla_fecha_respuesta = null;
                        }
                        if (isset($ticket->sla->tiempo_resolucion_max) && is_numeric($ticket->sla->tiempo_resolucion_max)) {
                            $fRes = clone $fechaCreacion;
                            $fRes->modify('+' . (int)$ticket->sla->tiempo_resolucion_max . ' minutes');
                            $ticket->sla_fecha_resolucion = $fRes->format('Y-m-d H:i:s');
                        } else {
                            $ticket->sla_fecha_resolucion = null;
                        }
                    } catch (Exception $e) {
                        $ticket->sla->tiempo_restante = null;
                        $ticket->sla_fecha_respuesta = null;
                        $ticket->sla_fecha_resolucion = null;
                    }
                } else {
                    if ($ticket->sla) $ticket->sla->tiempo_restante = null;
                    $ticket->sla_fecha_respuesta = null;
                    $ticket->sla_fecha_resolucion = null;
                }

                // Agregar al arreglo final
                $ticketsCompletos[] = $ticket;
            }

            return $ticketsCompletos;
        } catch (Exception $e) {
            handleException($e);
        }
    }
    	public function create($objeto) {
        try {
            // Validaciones y saneo de entrada
            $titulo = isset($objeto->titulo) ? trim((string)$objeto->titulo) : '';
            $descripcion = isset($objeto->descripcion) ? trim((string)$objeto->descripcion) : '';
            $prioridad = isset($objeto->prioridad) ? (string)$objeto->prioridad : 'Media';
            $idUsuario = isset($objeto->id_usuario) ? (string)$objeto->id_usuario : null;
            $idCategoria = isset($objeto->id_categoria) ? (int)$objeto->id_categoria : null;
            $idEtiqueta = isset($objeto->id_etiqueta) ? (int)$objeto->id_etiqueta : null;

            if ($titulo === '' || $descripcion === '' || !$idUsuario) {
                throw new Exception('Faltan campos requeridos: titulo, descripcion, id_usuario');
            }
            // Longitudes y reglas básicas
            if (mb_strlen($titulo) < 5 || mb_strlen($titulo) > 120) {
                throw new Exception('El título debe tener entre 5 y 120 caracteres');
            }
            if (mb_strlen($descripcion) < 10 || mb_strlen($descripcion) > 2000) {
                throw new Exception('La descripción debe tener entre 10 y 2000 caracteres');
            }
            // Normalizar prioridad a ENUM permitido
            $validP = ['Baja','Media','Alta'];
            if (!in_array($prioridad, $validP, true)) { $prioridad = 'Media'; }

            // Derivar categoría a partir de etiqueta si no fue enviada
            if (!$idCategoria && $idEtiqueta) {
                // Verificar existencia de etiqueta
                $chkEt = $this->enlace->executePrepared("SELECT id_etiqueta FROM etiqueta WHERE id_etiqueta = ?", 'i', [ (int)$idEtiqueta ], 'asoc');
                if (empty($chkEt)) {
                    throw new Exception('La etiqueta seleccionada no existe');
                }
                $sqlCat = "SELECT id_categoria_ticket FROM categoria_etiqueta WHERE id_etiqueta = ? LIMIT 1";
                $cat = $this->enlace->executePrepared($sqlCat, 'i', [ (int)$idEtiqueta ], 'asoc');
                if (!empty($cat) && isset($cat[0]['id_categoria_ticket'])) {
                    $idCategoria = (int)$cat[0]['id_categoria_ticket'];
                } else {
                    throw new Exception('No se pudo derivar la categoría desde la etiqueta proporcionada');
                }
            }
            if (!$idCategoria) {
                throw new Exception('Falta id_categoria o id_etiqueta para determinar la categoría');
            }

            // Insert seguro con NOW() y estado inicial "Pendiente"
            $sql = "INSERT INTO ticket (titulo, descripcion, fecha_creacion, prioridad, id_estado, id_usuario, id_categoria)
                    VALUES (?, ?, NOW(), ?, (SELECT id_estado FROM estado WHERE nombre='Pendiente' LIMIT 1), ?, ?)";

            $idTicket = $this->enlace->executePrepared_DML_last($sql, 'ssssi', [
                $titulo,
                $descripcion,
                $prioridad,
                (string)$idUsuario,
                (int)$idCategoria
            ]);

            return $this->get($idTicket);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($objeto)
    {
        try {
            if (!isset($objeto->id_ticket)) {
                throw new Exception('El ID del ticket es obligatorio para actualizar.');
            }

            $sets = [];
            $types = '';
            $params = [];

            if (isset($objeto->titulo)) {
                $sets[] = 'titulo = ?';
                $types .= 's';
                $params[] = (string)$objeto->titulo;
            }
            if (isset($objeto->descripcion)) {
                $sets[] = 'descripcion = ?';
                $types .= 's';
                $params[] = (string)$objeto->descripcion;
            }
            if (isset($objeto->prioridad)) {
                $validP = ['Baja','Media','Alta'];
                $prioridad = in_array((string)$objeto->prioridad, $validP, true) ? (string)$objeto->prioridad : 'Media';
                $sets[] = 'prioridad = ?';
                $types .= 's';
                $params[] = $prioridad;
            }
            if (isset($objeto->id_estado)) {
                $sets[] = 'id_estado = ?';
                $types .= 'i';
                $params[] = (int)$objeto->id_estado;
            }
            if (isset($objeto->comentario)) {
                $sets[] = 'comentario = ?';
                $types .= 's';
                $params[] = (string)$objeto->comentario;
            }
            if (isset($objeto->id_tecnico)) {
                $sets[] = 'id_tecnico = ?';
                $types .= 'i';
                $params[] = (int)$objeto->id_tecnico;
            }
            
            // Si se proporciona id_etiqueta, derivar y actualizar id_categoria
            if (isset($objeto->id_etiqueta)) {
                $idEtiqueta = (int)$objeto->id_etiqueta;
                
                // Verificar que la etiqueta existe
                $chkEt = $this->enlace->executePrepared(
                    "SELECT id_etiqueta FROM etiqueta WHERE id_etiqueta = ?", 
                    'i', 
                    [$idEtiqueta], 
                    'asoc'
                );
                if (empty($chkEt)) {
                    throw new Exception('La etiqueta seleccionada no existe');
                }
                
                // Obtener la categoría asociada a esta etiqueta
                $sqlCat = "SELECT id_categoria_ticket FROM categoria_etiqueta WHERE id_etiqueta = ? LIMIT 1";
                $cat = $this->enlace->executePrepared($sqlCat, 'i', [$idEtiqueta], 'asoc');
                
                if (!empty($cat) && isset($cat[0]['id_categoria_ticket'])) {
                    $idCategoria = (int)$cat[0]['id_categoria_ticket'];
                    $sets[] = 'id_categoria = ?';
                    $types .= 'i';
                    $params[] = $idCategoria;
                } else {
                    throw new Exception('No se pudo derivar la categoría desde la etiqueta proporcionada');
                }
            }

            if (empty($sets)) {
                throw new Exception('No hay campos válidos para actualizar el ticket.');
            }

            $sql = 'UPDATE ticket SET ' . implode(', ', $sets) . ' WHERE id_ticket = ?';
            $types .= 'i';
            $params[] = (int)$objeto->id_ticket;

            $this->enlace->executePrepared_DML($sql, $types, $params);
            return $this->get($objeto->id_ticket);
        } catch (Exception $e) {
            handleException($e);
        }
    }


}
