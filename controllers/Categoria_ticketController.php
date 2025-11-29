<?php
class categoria_ticket
{
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $categoria = new Categoria_ticketModel();
            $result = $categoria->all();
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    public function get($param)
    {
        try {
            $response = new Response();
            $categoria = new Categoria_ticketModel();
            $result = $categoria->get($param);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getEspecialidades($param)
    {
        try {
            $response = new Response();
            $especialidadModel = new Categoria_ticketModel;
            $result = $especialidadModel->getEspecialidadesByCategoria($param);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

     public function getEtiquetas($param)
    {
        try {
            $response = new Response();
            $especialidadModel = new Categoria_ticketModel;
            $result = $especialidadModel->getEtiquetasByCategoria($param);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }



    public function getCategoriaByEtiqueta($idEtiqueta)
    {
        try {
            $response = new Response();
            $categoria = new Categoria_ticketModel();
            $result = $categoria->getCategoriaByEtiqueta($idEtiqueta);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();
            $model = new Categoria_ticketModel();
            $result = $model->create($inputJSON);

            // Notificar a administradores sobre nuevo mantenimiento (Categoría creada)
            try {
                if ($result && isset($result->nombre)) {
                    $notif = new NotificacionModel();
                    $notif->notificarMantenimientoCreado('Categoría', $result->nombre, $inputJSON->id_usuario_remitente ?? null);
                }
            } catch (Exception $e) {
                error_log('No se pudo notificar mantenimiento (Categoría): ' . $e->getMessage());
            }
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($id = null)
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();
            if ($id && empty($inputJSON->id_categoria)) {
                $inputJSON->id_categoria = (int)$id; // permitir /categoria_ticket/update/{id}
            }
            $model = new Categoria_ticketModel();
            $result = $model->update($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /** Eliminar categoría si no tiene tickets asociados */
    public function delete($id = null)
    {
        try {
            if (empty($id)) {
                throw new Exception('id de categoría requerido para eliminar');
            }
            $response = new Response();
            $model = new Categoria_ticketModel();
            $result = $model->delete((int)$id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
