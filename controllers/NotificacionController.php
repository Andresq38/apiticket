<?php
class notificacion
{
    public function index()
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $result = $notificacion->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($param)
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $result = $notificacion->get($param);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener notificaciones de un usuario específico
     * GET /apiticket/notificacion/porUsuario/{id_usuario}
     */
    public function porUsuario($idUsuario)
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $result = $notificacion->getByUsuario($idUsuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener notificaciones no leídas de un usuario
     * GET /apiticket/notificacion/noLeidas/{id_usuario}
     */
    public function noLeidas($idUsuario)
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $result = $notificacion->getNoLeidasByUsuario($idUsuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Contar notificaciones no leídas de un usuario
     * GET /apiticket/notificacion/contarNoLeidas/{id_usuario}
     */
    public function contarNoLeidas($idUsuario)
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $count = $notificacion->countNoLeidas($idUsuario);
            $response->toJSON(['count' => $count]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Obtener id de administrador por defecto (para frontend sin login)
     * GET /apiticket/notificacion/adminDefault
     */
    public function adminDefault()
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $idAdmin = $notificacion->obtenerAdminPorDefecto();
            $response->toJSON(['id_admin' => $idAdmin]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Marcar notificación como leída
     * PUT /apiticket/notificacion/marcarLeida/{id}
     */
    public function marcarLeida($id)
    {
        try {
            $request = new Request();
            $response = new Response();
            $body = $request->getJSON();
            
            $idUsuario = $body->id_usuario ?? null;
            
            $notificacion = new NotificacionModel();
            $result = $notificacion->marcarComoLeida($id, $idUsuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     * POST /apiticket/notificacion/marcarTodasLeidas
     */
    public function marcarTodasLeidas()
    {
        try {
            $request = new Request();
            $response = new Response();
            $body = $request->getJSON();
            
            if (!isset($body->id_usuario)) {
                $response->toJSON(['success' => false, 'message' => 'id_usuario requerido']);
                return;
            }
            
            $notificacion = new NotificacionModel();
            $result = $notificacion->marcarTodasComoLeidas($body->id_usuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Crear nueva notificación
     * POST /apiticket/notificacion
     */
    public function create()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();
            
            $notificacion = new NotificacionModel();
            $result = $notificacion->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /**
     * Eliminar notificación
     * DELETE /apiticket/notificacion/{id}
     */
    public function delete($id)
    {
        try {
            $response = new Response();
            $notificacion = new NotificacionModel();
            $result = $notificacion->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
