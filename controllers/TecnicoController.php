<?php
class tecnico
{
    public function index()
    {
        try {
            $response = new Response();
            //Obtener el listado del Modelo
            $tecnico = new TecnicoModel();
            $result = $tecnico->all();
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function withTickets()
    {
        try {
            $response = new Response();
            $tecnico = new TecnicoModel();
            $result = $tecnico->withTickets();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
    public function get($param)
    {
        try {
            $response = new Response();
            $tecnico = new TecnicoModel();
            $result = $tecnico->get($param);
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
            //Instancia del modelo
            $tecnico = new TecnicoModel();
            //Acción del modelo a ejecutar
            $result = $tecnico->create($inputJSON);
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
            $tecnico = new TecnicoModel();
            //Acción del modelo a ejecutar
            $result = $tecnico->update($inputJSON);
            //Dar respuesta
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    //POST toggle disponibilidad
    public function toggleDisponibilidad($id_tecnico)
    {
        try {
            $response = new Response();
            $tecnico = new TecnicoModel();
            $result = $tecnico->toggleDisponibilidad($id_tecnico);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /** DELETE eliminar técnico si no tiene tickets asociados (FK restrict) */
    public function delete($id = null)
    {
        try {
            if (empty($id)) {
                throw new Exception('id_tecnico requerido');
            }
            $response = new Response();
            $tecnico = new TecnicoModel();
            $result = $tecnico->delete((int)$id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /* Obtener especialidades de un técnico por id_usuario */
    public function obtenerEspecialidades($idUsuario)
    {
        try {
            $tecnico = new TecnicoModel();
            $especialidades = $tecnico->getEspecialidades($idUsuario);
            
            $response = new Response();
            $response->toJSON([
                'success' => true,
                'especialidades' => $especialidades
            ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}

