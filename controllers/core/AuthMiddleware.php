<?php


class AuthMiddleware
{
    private $secret;

    public function __construct()
    {
        $this->secret = Config::get('SECRET_KEY');
    }

    private function getAuthHeader()
    {
        $headers = [];
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
        }
        // Fallbacks
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['Authorization'])) {
            $headers['Authorization'] = $_SERVER['Authorization'];
        }
        return $headers['Authorization'] ?? '';
    }

    public function handle(array $requiredRoles = [])
    {
        $authHeader = $this->getAuthHeader();
        if (!$authHeader || !preg_match('/^Bearer\s+(.*)$/i', $authHeader, $matches)) {
            while (ob_get_level()) ob_end_clean();
            http_response_code(401);
            die(json_encode(['error' => 'Unauthorized: missing or invalid token']));
        }
        $jwt = $matches[1];
        try {
            $decoded = \Firebase\JWT\JWT::decode($jwt, new \Firebase\JWT\Key($this->secret, 'HS256'));
            $user = [
                'id_usuario' => $decoded->id_usuario ?? null,
                'nombre' => $decoded->nombre ?? null,
                'correo' => $decoded->correo ?? null,
                'id_rol' => $decoded->id_rol ?? null,
                'rol' => $decoded->rol ?? null,
            ];
            $_SERVER['auth_user'] = $user;
        } catch (\Exception $e) {
            while (ob_get_level()) ob_end_clean();
            http_response_code(401);
            die(json_encode(['error' => 'Unauthorized: invalid token', 'details' => $e->getMessage()]));
        }

        if (!empty($requiredRoles)) {
            $userRole = $_SERVER['auth_user']['id_rol'] ?? null;
            $allowed = $requiredRoles;
            if (!$userRole || !in_array($userRole, $allowed)) {
                while (ob_get_level()) ob_end_clean();
                http_response_code(403);
                die(json_encode(['error' => 'Forbidden: insufficient role']));
            }
        }
        return true;
    }
}
