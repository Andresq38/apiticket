<?php
class Usuario
{
    /**
     * Retorna los datos del usuario autenticado usando JWT
     */
    public function me()
    {
        try {
            $response = new Response();
            $authUser = $_SERVER['auth_user'] ?? null;
            if (!$authUser) {
                http_response_code(401);
                $response->toJSON(['error' => 'No autenticado']);
                return;
            }
            $usuario = new UsuarioModel();
            $userData = $usuario->get($authUser['id_usuario']);
            $response->toJSON($userData);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $usuario = new UsuarioModel();
            $result = $usuario->all();
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
            $usuario = new UsuarioModel();
            $result = $usuario->get($param);
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
            //Obtener json enviado
            $inputJSON = $request->getJSON();
            error_log("DEBUG Usuario.create() - INPUT: " . json_encode($inputJSON));
            //Instancia del modelo
            $usuario = new UsuarioModel();
            //Acción del modelo a ejecutar
            $result = $usuario->create($inputJSON);
            error_log("DEBUG Usuario.create() - RESULT: " . json_encode($result));
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            error_log("DEBUG Usuario.create() - ERROR: " . $e->getMessage());
            handleException($e);
        }
    }

     public function login()
    {
        $response = new Response();
        $request = new Request();
        //Obtener json enviado
        $inputJSON = $request->getJSON();
        $usuario = new UsuarioModel();
        $result = $usuario->login($inputJSON);
        if (isset($result) && !empty($result) && $result != false) {
            $response->toJSON($result);
        } else {
            $response->toJSON($response, "Usuario no valido");
        }
    }

    public function update()
    {
        try {
            $request = new Request();
            $response = new Response();
            //Obtener json enviado
            $inputJSON = $request->getJSON();
            //Instancia del modelo
            $usuario = new UsuarioModel();
            //Acción del modelo a ejecutar
            $result = $usuario->update($inputJSON);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id = null)
    {
        try {
            if (empty($id)) {
                throw new Exception('id_usuario requerido');
            }
            $response = new Response();
            $usuario = new UsuarioModel();
            $result = $usuario->delete((int)$id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
