<?php
/**
 * Controlador para gestionar asignaciones de tickets
 */
class Asignacion
{
    /**
     * Obtener tickets pendientes
     * GET /apiticket/asignacion/pendientes
     */
    public function pendientes()
    {
        try {
            $response = new Response();
            $asignacion = new AsignacionModel();
            $result = $asignacion->getTicketsPendientes();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener técnicos disponibles con especialidades
     * GET /apiticket/asignacion/tecnicos
     */
    public function tecnicos()
    {
        try {
            $response = new Response();
            $asignacion = new AsignacionModel();
            $result = $asignacion->getTecnicosDisponibles();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Asignación automática (autotriage)
     * POST /apiticket/asignacion/automatico
     * Body (opcional): { "id_ticket": 123 }
     */
    public function automatico()
    {
        try {
            $request = new Request();
            $response = new Response();
            $body = $request->getJSON();
            
            $idTicket = $body->id_ticket ?? null;
            
            $asignacion = new AsignacionModel();
            $result = $asignacion->asignarAutomatico($idTicket);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Asignación manual
     * POST /apiticket/asignacion/manual
     * Body: { "id_ticket": 123, "id_tecnico": 1, "justificacion": "...", "id_usuario_asigna": "..." }
     */
    public function manual()
    {
        try {
            $request = new Request();
            $response = new Response();
            $body = $request->getJSON();
            
            if (!isset($body->id_ticket) || !isset($body->id_tecnico)) {
                $response->toJSON([
                    'success' => false,
                    'message' => 'Faltan parámetros requeridos: id_ticket, id_tecnico'
                ]);
                return;
            }
            
            $asignacion = new AsignacionModel();
            $result = $asignacion->asignarManual(
                $body->id_ticket,
                $body->id_tecnico,
                $body->justificacion ?? null,
                $body->id_usuario_asigna ?? null
            );
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
