<?php
class ticket
{
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $ticket = new TicketModel();
            $result = $ticket->all();
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    /**
     * Devuelve las prioridades disponibles desde el ENUM de la tabla ticket.
     * No se consulta la BD: se exponen valores conocidos para poblar el selector del frontend.
     */
    public function prioridades()
    {
        try {
            $response = new Response();
            $response->toJSON(['Baja', 'Media', 'Alta']);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    public function get($param)
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->get($param);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketByTecnico($idTecnico)
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->getTicketByTecnico($idTecnico);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketCompletoById($idTicket)
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->getTicketCompletoById($idTicket);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketByUsuario($idUsuario)
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->getTicketByUsuario($idUsuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getTicketsCompletos()
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->getTicketsCompletos();
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function cambiarEstado()
    {
        try {
            $response = new Response();
            $request = new Request();
            
            // Obtener datos del request (JSON body)
            $data = $request->getJSON();
            
            // Validar que existan los campos requeridos
            if (!isset($data->id_ticket) || !isset($data->id_estado)) {
                $response->toJSON([
                    'success' => false,
                    'message' => 'Faltan parámetros requeridos: id_ticket, id_estado'
                ]);
                return;
            }

            // Validar observaciones obligatorias
            if (!isset($data->observaciones) || trim($data->observaciones) === '') {
                $response->toJSON([
                    'success' => false,
                    'message' => 'Las observaciones son obligatorias para cambiar el estado del ticket'
                ]);
                return;
            }
            
            $ticket = new TicketModel();
            $result = $ticket->cambiarEstado(
                $data->id_ticket,
                $data->id_estado,
                $data->observaciones,
                $data->id_usuario_remitente ?? null
            );
            
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Endpoint estricto: cambiar estado y subir imágenes en una sola operación.
     * POST /apiticket/ticket/cambiarEstadoConImagen
     * FormData: id_ticket, id_estado, observaciones, id_usuario_remitente, files[]
     */
    public function cambiarEstadoConImagen()
    {
        try {
            $response = new Response();

            // Validar presencia de campos en POST
            $idTicket = isset($_POST['id_ticket']) ? (int)$_POST['id_ticket'] : null;
            $idEstado = isset($_POST['id_estado']) ? (int)$_POST['id_estado'] : null;
            $observaciones = isset($_POST['observaciones']) ? trim((string)$_POST['observaciones']) : '';
            $idUsuarioRemitente = isset($_POST['id_usuario_remitente']) ? (string)$_POST['id_usuario_remitente'] : null;

            if (!$idTicket || !$idEstado) {
                $response->toJSON(['success' => false, 'message' => 'Parámetros id_ticket e id_estado requeridos']);
                return;
            }
            if ($observaciones === '') {
                $response->toJSON(['success' => false, 'message' => 'Observaciones obligatorias']);
                return;
            }
            if (empty($_FILES)) {
                $response->toJSON(['success' => false, 'message' => 'Debe adjuntar al menos una imagen']);
                return;
            }

            // Consolidar archivos (soporta múltiples claves ej. file, file0, etc.)
            $archivos = [];
            foreach ($_FILES as $fileField => $fileData) {
                // Si es arreglo múltiple (files[])
                if (is_array($fileData['name'])) {
                    $total = count($fileData['name']);
                    for ($i = 0; $i < $total; $i++) {
                        $archivos[] = [
                            'name' => $fileData['name'][$i],
                            'type' => $fileData['type'][$i],
                            'tmp_name' => $fileData['tmp_name'][$i],
                            'error' => $fileData['error'][$i],
                            'size' => $fileData['size'][$i]
                        ];
                    }
                } else {
                    $archivos[] = $fileData;
                }
            }

            $ticketM = new TicketModel();
            $resultado = $ticketM->cambiarEstadoConImagen($idTicket, $idEstado, $observaciones, $idUsuarioRemitente, $archivos);
            $response->toJSON($resultado);
        } catch (Exception $e) {
            handleException($e);
        }
    }

     public function create()
    {
        try {
            $request = new Request();
            $response = new Response();
            //Obtener json enviado
            $inputJSON = $request->getJSON();
            //Instancia del modelo
            $ticket = new TicketModel();
            //Acción del modelo a ejecutar
            $result = $ticket->create($inputJSON);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    //PUT actualizar
    public function update()
    {
        try {
            $request = new Request();
            $response = new Response();
            //Obtener json enviado
            $inputJSON = $request->getJSON();
            //Instancia del modelo
            $ticket = new TicketModel();
            //Acción del modelo a ejecutar
            $result = $ticket->update($inputJSON);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    
    //DELETE eliminar
    public function delete($idTicket)
    {
        try {
            $response = new Response();
            $ticket = new TicketModel();
            $result = $ticket->delete($idTicket);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    
}
