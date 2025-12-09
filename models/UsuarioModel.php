<?php
use Firebase\JWT\JWT;
class UsuarioModel
{
    public $enlace;
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }
    /*Listar */
    public function all(){
        try {
            //Consulta sql
			$vSql = "SELECT * FROM usuario;";
			
            //Ejecutar la consulta
			$vResultado = $this->enlace->ExecuteSQL ($vSql);
				
			// Retornar el objeto
			return $vResultado;
		} catch (Exception $e) {
            handleException($e);
        }
    }
    /*Obtener */
public function get($id)
    {
        try {
            //Consulta sql
            $vSql = "SELECT * FROM usuario WHERE id_usuario = ?";
            
            //Ejecutar la consulta
            $vResultado = $this->enlace->executePrepared($vSql, 's', [ (string)$id ]);
            
            // Verificar si hay resultados antes de retornar
            if (!empty($vResultado)) {
                return $vResultado[0];
            }
            return null; // o lanzar una excepción, depende de cómo manejes la app
            
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /** Buscar por email */
    public function findByEmail($email)
    {
        try {
            // La tabla usuario actual solo tiene 'password' (SHA-256), no password_hash
            // Devolvemos password como legacy_password para compatibilidad con AuthController
            $sql = "SELECT u.id_usuario, u.nombre, u.correo, u.id_rol, r.descripcion AS rol, 
                           u.password AS legacy_password
                    FROM usuario u
                    LEFT JOIN rol r ON r.id_rol = u.id_rol
                    WHERE u.correo = ?
                    LIMIT 1";
            $res = $this->enlace->executePrepared($sql, 's', [ (string)$email ], 'asoc');
            if (!empty($res)) {
                return (object)$res[0];
            }
            return null;
        } catch (Exception $e) {
            handleException($e);
        }
    }
    
    public function login($objeto){
        try{
            // Validar campos requeridos
            if (empty($objeto->email) || !isset($objeto->email)) {
                throw new Exception("El correo electrónico es requerido");
            }
            
            if (empty($objeto->password) || !isset($objeto->password)) {
                throw new Exception("La contraseña es requerida");
            }

            // Buscar usuario por correo
            $sql = "SELECT * FROM usuario WHERE correo = ?";
            $vResultado = $this->enlace->executePrepared($sql, 's', [(string)$objeto->email]);
            
            if(!empty($vResultado) && is_object($vResultado[0])){
                $usuario = $vResultado[0];
                
                // Verificar contraseña con SHA-256 (formato actual en BD)
                $passwordHash = hash('sha256', $objeto->password);
                
                if($passwordHash === $usuario->password){
                    // Datos para el token JWT
                    $data = [
                        'id_usuario' => $usuario->id_usuario,
                        'nombre' => $usuario->nombre,
                        'correo' => $usuario->correo,
                        'id_rol' => $usuario->id_rol,
                        'iat' => time(),  // Hora de emisión
                        'exp' => time() + 3600 // Expiración en 1 hora
                    ];

                    // Generar el token JWT
                    $jwt_token = JWT::encode($data, Config::get('SECRET_KEY'), 'HS256');

                    // Enviar el token como respuesta
                    return $jwt_token;
                } else {
                    throw new Exception("Contraseña incorrecta");
                }
            } else {
                throw new Exception("Usuario no encontrado");
            }

        } catch(Exception $e){
            handleException($e);
            return false;
        }
    }

    /** Actualiza último inicio de sesión */
    public function actualizarUltimoLogin($idUsuario)
    {
        try {
            // La tabla usuario actual no tiene la columna ultimo_login
            // Comentamos temporalmente hasta que se agregue la columna
            // $sql = "UPDATE usuario SET ultimo_login = NOW() WHERE id_usuario = ?";
            // return $this->enlace->executePrepared_DML($sql, 'i', [ (int)$idUsuario ]);
            return true;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            if (empty($objeto->id_usuario) || empty($objeto->nombre) || empty($objeto->correo) || empty($objeto->password)) {
                throw new Exception("Campos requeridos: id_usuario, nombre, correo, password");
            }
            if (strlen($objeto->nombre) < 3 || strlen($objeto->nombre) > 150) {
                throw new Exception("El nombre debe tener entre 3 y 150 caracteres");
            }
            if (!filter_var($objeto->correo, FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Formato de correo inválido");
            }
            $sqlCheckEmail = "SELECT COUNT(*) as count FROM usuario WHERE correo = ?";
            $resultEmail = $this->enlace->executePrepared($sqlCheckEmail, 's', [$objeto->correo]);
            if ($resultEmail[0]->count > 0) {
                throw new Exception("El correo ya está registrado");
            }
            $sqlCheckId = "SELECT COUNT(*) as count FROM usuario WHERE id_usuario = ?";
            $resultId = $this->enlace->executePrepared($sqlCheckId, 's', [$objeto->id_usuario]);
            if ($resultId[0]->count > 0) {
                throw new Exception("El ID de usuario ya está registrado");
            }
            if (strlen($objeto->password) < 6) {
                throw new Exception("La contraseña debe tener al menos 6 caracteres");
            }
            $hashedPassword = hash('sha256', $objeto->password);
            $idRol = isset($objeto->id_rol) ? (int)$objeto->id_rol : 1;
            $sqlIns = "INSERT INTO usuario (id_usuario, nombre, correo, password, id_rol) VALUES (?, ?, ?, ?, ?)";
            $this->enlace->executePrepared($sqlIns, 'ssssi', [
                $objeto->id_usuario,
                $objeto->nombre,
                $objeto->correo,
                $hashedPassword,
                $idRol
            ]);
            return $this->get($objeto->id_usuario);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($objeto)
    {
        try {
            if (empty($objeto->id_usuario)) {
                throw new Exception("id_usuario es requerido");
            }
            if (isset($objeto->nombre) && (strlen($objeto->nombre) < 3 || strlen($objeto->nombre) > 150)) {
                throw new Exception("El nombre debe tener entre 3 y 150 caracteres");
            }
            if (isset($objeto->correo) && !filter_var($objeto->correo, FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Formato de correo inválido");
            }
            if (isset($objeto->correo)) {
                $sqlCheckEmail = "SELECT COUNT(*) as count FROM usuario WHERE correo = ? AND id_usuario != ?";
                $resultEmail = $this->enlace->executePrepared($sqlCheckEmail, 'ss', [$objeto->correo, $objeto->id_usuario]);
                if ($resultEmail[0]->count > 0) {
                    throw new Exception("El correo ya está registrado por otro usuario");
                }
            }
            $updatePassword = false;
            $hashedPassword = null;
            if (isset($objeto->password) && !empty($objeto->password)) {
                if (strlen($objeto->password) < 6) {
                    throw new Exception("La contraseña debe tener al menos 6 caracteres");
                }
                $hashedPassword = hash('sha256', $objeto->password);
                $updatePassword = true;
            }
            $updates = [];
            $types = '';
            $params = [];
            if (isset($objeto->nombre)) {
                $updates[] = "nombre = ?";
                $types .= 's';
                $params[] = $objeto->nombre;
            }
            if (isset($objeto->correo)) {
                $updates[] = "correo = ?";
                $types .= 's';
                $params[] = $objeto->correo;
            }
            if ($updatePassword) {
                $updates[] = "password = ?";
                $types .= 's';
                $params[] = $hashedPassword;
            }
            if (isset($objeto->id_rol)) {
                $updates[] = "id_rol = ?";
                $types .= 'i';
                $params[] = (int)$objeto->id_rol;
            }
            if (!empty($updates)) {
                $types .= 's';
                $params[] = $objeto->id_usuario;
                $sqlUpd = "UPDATE usuario SET " . implode(', ', $updates) . " WHERE id_usuario = ?";
                $this->enlace->executePrepared($sqlUpd, $types, $params);
            }
            return $this->get($objeto->id_usuario);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id_usuario)
    {
        try {
            if (empty($id_usuario)) {
                throw new Exception('id_usuario requerido');
            }
            $sqlTecnico = "SELECT id_tecnico FROM tecnico WHERE id_usuario = ?";
            $resTecnico = $this->enlace->executePrepared($sqlTecnico, 's', [(string)$id_usuario]);
            if (!empty($resTecnico)) {
                $idTecnico = $resTecnico[0]->id_tecnico;
                $sqlCount = "SELECT COUNT(*) AS total FROM ticket WHERE id_tecnico = ?";
                $resCount = $this->enlace->executePrepared($sqlCount, 'i', [(int)$idTecnico]);
                $total = (int)($resCount[0]->total ?? 0);
                if ($total > 0) {
                    throw new Exception('No se puede eliminar: técnico con tickets asociados');
                }
                $this->enlace->executePrepared_DML('DELETE FROM tecnico_especialidad WHERE id_tecnico = ?', 'i', [(int)$idTecnico]);
                $this->enlace->executePrepared_DML('DELETE FROM tecnico WHERE id_tecnico = ?', 'i', [(int)$idTecnico]);
            }
            $this->enlace->executePrepared_DML('DELETE FROM usuario WHERE id_usuario = ?', 's', [(string)$id_usuario]);
            return (object)[ 'deleted' => true, 'id_usuario' => $id_usuario, 'message' => 'Usuario eliminado correctamente' ];
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
