<?php
class etiqueta
{
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $etiqueta = new EtiquetaModel();
            $result = $etiqueta->all();
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
            $etiqueta = new EtiquetaModel();
            $result = $etiqueta->get($param);
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
            $model = new EtiquetaModel();
            $result = $model->create($inputJSON);

            // Notificar a administradores sobre nuevo mantenimiento (Etiqueta creada)
            try {
                if ($result && isset($result->nombre)) {
                    $notif = new NotificacionModel();
                    $notif->notificarMantenimientoCreado('Etiqueta', $result->nombre, $inputJSON->id_usuario_remitente ?? null);
                }
            } catch (Exception $e) {
                error_log('No se pudo notificar mantenimiento (Etiqueta): ' . $e->getMessage());
            }
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
