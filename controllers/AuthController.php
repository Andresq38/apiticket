<?php


class Auth
{
    private $secret;

    public function __construct()
    {
        $this->secret = Config::get('SECRET_KEY');
    }

    public function login()
    {
        try {
            // Leer JSON directamente sin usar Request (evitar conflicto de clase)
            $content = trim(file_get_contents("php://input"));
            $body = json_decode($content);
            $response = new Response();

            // Validar campos requeridos
            if (!$body) {
                return $response->status(400)->toJSON(['error' => 'Datos de autenticación requeridos']);
            }
            
            if (empty($body->email) || !isset($body->email)) {
                return $response->status(400)->toJSON(['error' => 'El correo electrónico es requerido']);
            }
            
            if (empty($body->password) || !isset($body->password)) {
                return $response->status(400)->toJSON(['error' => 'La contraseña es requerida']);
            }

            $usuarioModel = new UsuarioModel();

            // Normalizar email: sin espacios y en minúsculas
            $email = strtolower(trim((string)$body->email));
            $password = (string)($body->password ?? '');

            $user = $usuarioModel->findByEmail($email);
            if (!$user) {
                return $response->status(401)->toJSON(['error' => 'Credenciales inválidas']);
            }
            if (isset($user->activo) && (int)$user->activo === 0) {
                return $response->status(403)->toJSON(['error' => 'Usuario deshabilitado']);
            }

            $hash = $user->password_hash ?? '';
            $legacy = $user->legacy_password ?? '';
            $ok = false;
            if ($hash) {
                $ok = password_verify($password, $hash);
            }
            if (!$ok && $legacy) {
                // Compatibilidad con SHA2(…,256) de MySQL almacenado como hex
                $sha = hash('sha256', $password);
                $ok = (strcasecmp($sha, $legacy) === 0);

                // Fallback extra: permitir contraseña en texto plano (por si algún usuario se creó sin hash)
                if (!$ok) {
                    $ok = hash_equals((string)$legacy, $password);
                }
            }
            if (!$ok) {
                return $response->status(401)->toJSON(['error' => 'Credenciales inválidas']);
            }

            // Actualizar último login (ignorar errores)
            try { $usuarioModel->actualizarUltimoLogin($user->id_usuario); } catch (\Throwable $e) {}

            // Si es técnico, obtener id_tecnico
            $idTecnico = null;
            if (strtolower($user->rol ?? '') === 'tecnico') {
                try {
                    $tecnicoModel = new TecnicoModel();
                    $sqlTecnico = "SELECT id_tecnico FROM tecnico WHERE id_usuario = ?";
                    $enlace = new MySqlConnect();
                    $resTecnico = $enlace->executePrepared($sqlTecnico, 's', [(string)$user->id_usuario]);
                    if (!empty($resTecnico)) {
                        $idTecnico = $resTecnico[0]->id_tecnico ?? null;
                    }
                } catch (\Throwable $e) {
                    error_log("Error al obtener id_tecnico: " . $e->getMessage());
                }
            }

            // Iniciar sesión server-side
            if (session_status() !== PHP_SESSION_ACTIVE) session_start();
            session_regenerate_id(true);
            $_SESSION['auth_user'] = [
                'id' => $user->id_usuario,
                'email' => $user->correo ?? null,
                'rol' => $user->rol ?? null,
                'name' => $user->nombre ?? null,
                'id_tecnico' => $idTecnico,
            ];

            // Generar notificación de inicio de sesión
            try {
                $notifModel = new NotificacionModel();
                $notifModel->notificarInicioSesion($user->id_usuario);
            } catch (\Throwable $e) {
                // No fallar el login si falla la notificación
                error_log("Error al crear notificación de login: " . $e->getMessage());
            }

            return $response->toJSON([
                'success' => true,
                'user' => $_SESSION['auth_user'],
                'token' => '' // Mantener compatibilidad con frontend
            ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function logout()
    {
        try {
            $response = new Response();
            if (session_status() !== PHP_SESSION_ACTIVE) session_start();
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params['path'], preg_replace('/:.*/','', $params['domain']), $params['secure'], $params['httponly']);
            }
            session_destroy();
            return $response->toJSON(['success' => true]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function me()
    {
        try {
            $response = new Response();
            if (session_status() !== PHP_SESSION_ACTIVE) session_start();
            $user = $_SESSION['auth_user'] ?? null;
            if (!$user) {
                return $response->status(401)->toJSON(['error' => 'Unauthorized']);
            }
            return $response->toJSON([ 'user' => $user ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function status()
    {
        try {
            $response = new Response();
            return $response->toJSON([
                'status' => 'ok',
                'message' => 'Backend funcionando correctamente',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0'
            ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
