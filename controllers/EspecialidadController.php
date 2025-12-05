<?php
class especialidad
{
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $especialidad = new EspecialidadModel();
            $result = $especialidad->all();
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
            $especialidad = new EspecialidadModel();
            $result = $especialidad->get($param);
            //Dar respuesta
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
            $model = new EspecialidadModel();
            $result = $model->create($inputJSON);

            // Notificar a administradores sobre nuevo mantenimiento (Especialidad creada)
            try {
                if ($result && isset($result->nombre)) {
                    $notif = new NotificacionModel();
                    $notif->notificarMantenimientoCreado('Especialidad', $result->nombre, $inputJSON->id_usuario_remitente ?? null);
                }
            } catch (Exception $e) {
                error_log('No se pudo notificar mantenimiento (Especialidad): ' . $e->getMessage());
            }
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
