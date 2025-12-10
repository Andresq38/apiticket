<?php
class historial_estado
{
    /**
     * Obtener estadísticas mensuales de tickets resueltos y no resueltos
     * GET /apiticket/historial_estado/estadisticas_mensuales
     */
    public function estadisticasMensuales()
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->getEstadisticasMensuales();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    /**
     * Listar todo el historial
     * GET /apiticket/historial_estado
     */
    public function index()
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener un registro de historial por ID
     * GET /apiticket/historial_estado/{id}
     */
    public function get($param)
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->get($param);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener historial completo de un ticket
     * GET /apiticket/historial_estado/ticket/{id_ticket}
     */
    public function ticket($idTicket)
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->getByTicket($idTicket);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Crear un nuevo registro de historial
     * POST /apiticket/historial_estado
     */
    public function create()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();
            
            $hestado = new Historial_EstadoModel();
            $result = $hestado->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener el último registro de historial de un ticket
     * GET /apiticket/historial_estado/ultimo/{id_ticket}
     */
    public function ultimo($idTicket)
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->getUltimoByTicket($idTicket);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener estadísticas del historial
     * GET /apiticket/historial_estado/estadisticas
     */
    public function estadisticas()
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->getEstadisticas();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener imágenes de un registro de historial
     * GET /apiticket/historial_estado/imagenes/{id_historial}
     */
    public function imagenes($idHistorial)
    {
        try {
            $response = new Response();
            $hestado = new Historial_EstadoModel();
            $result = $hestado->getImagenesByHistorial($idHistorial);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
