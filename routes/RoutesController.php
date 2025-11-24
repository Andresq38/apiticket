<?php
class RoutesController
{
    private $authMiddleware;
    private $protectedRoutes = [];

    public function __construct() {
        $this->authMiddleware = new AuthMiddleware();
        // Rutas protegidas deshabilitadas - sin autenticación
        // $this->registerRoutes();
    }

    private function registerRoutes() {
        // DESHABILITADO - Sin autenticación
    }

    private function checkAuth() {
        // DESHABILITADO - Sin autenticación
        return true; // Siempre permitir acceso
    }

    private function addProtectedRoute($method, $path, $controllerName, $action, $requiredRole) {
        $this->protectedRoutes[] = [
            'controller' => $controllerName,
            'action' => $action,
            'requiredRole' => $requiredRole,
            'method' => $method,
            'path' => $path
        ];
    }

    private function matchProtectedRoute($method, $path) {
        foreach ($this->protectedRoutes as $r) {
            if ($r['method'] === $method && strpos($path, $r['path']) === 0) {
                return $r;
            }
        }
        return null;
    }
    public function index()
    {
        // Verificar autenticación ANTES de procesar cualquier ruta
        if (!$this->checkAuth()) {
            return; // Si la autenticación falla, die() ya se ejecutó en el middleware
        }
        
        //include "routes/routes.php";
        if (isset($_SERVER['REQUEST_URI']) && !empty($_SERVER['REQUEST_URI'])) {
            // Gestión de archivos estáticos en /uploads (soporta /uploads/* y /apiticket/uploads/*)
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            if (strpos($uri, '/uploads/') === 0 || strpos($uri, '/apiticket/uploads/') === 0) {
                // Normalizar ruta relativa a la carpeta uploads del proyecto
                $prefix = strpos($uri, '/apiticket/uploads/') === 0 ? '/apiticket/uploads/' : '/uploads/';
                $relative = substr($uri, strlen($prefix));
                // Evitar traversal
                $relative = str_replace(['..', '\\', '%2e%2e'], '', $relative);
                $baseDir = realpath(__DIR__ . '/../uploads');
                $filePath = $baseDir ? $baseDir . DIRECTORY_SEPARATOR . $relative : null;

                if ($filePath && file_exists($filePath)) {
                    $mime = function_exists('mime_content_type') ? mime_content_type($filePath) : 'application/octet-stream';
                    header('Access-Control-Allow-Origin: *');
                    header('Content-Type: ' . $mime);
                    header('Cache-Control: public, max-age=31536000, immutable');
                    readfile($filePath);
                    exit;
                } else {
                    http_response_code(404);
                    echo 'Archivo no encontrado.';
                    exit;
                }
            }
             //FIN Gestion de imagenes
             //Solicitud preflight
             if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
                // Terminar la solicitud de preflight
                http_response_code(200);
                exit();
            }
            $routesArray = explode("/", $_SERVER['REQUEST_URI']);
            // Eliminar elementos vacíos del array
            $routesArray = array_filter($routesArray);

            if (count($routesArray) < 2) {
                $json = array(
                    'status' => 404,
                    'result' => 'Controlador no especificado'
                );
                echo json_encode($json, http_response_code($json["status"]));
                return;
            }

            if (isset($_SERVER['REQUEST_METHOD'])) {
                $controller = $routesArray[2] ?? null;
                $action = $routesArray[3] ?? null;
                $param1 = $routesArray[4] ?? null;
                $param2 = $routesArray[5] ?? null;
                if ($controller) {
                    try {
                        // Resolver clase de controlador de forma tolerante a mayúsculas/minúsculas
                        $candidates = [
                            $controller,                          // tal cual viene en la URL
                            ucfirst(strtolower($controller)),      // Primera mayúscula (Auth, Ticket, etc.)
                            strtolower($controller),               // todo minúsculas
                        ];
                        
                        // Mapeo especial para controladores con nombres largos
                        $controllerMap = [
                            'notificationstream' => 'NotificationStreamController',
                            'NotificationStream' => 'NotificationStreamController'
                        ];
                        
                        $controllerClass = null;
                        
                        // Primero verificar mapeo especial
                        if (isset($controllerMap[$controller])) {
                            $mapped = $controllerMap[$controller];
                            if (class_exists($mapped)) {
                                $controllerClass = $mapped;
                            }
                        }
                        
                        // Si no encontró en mapeo, buscar en candidatos
                        if (!$controllerClass) {
                            foreach ($candidates as $cand) {
                                if (class_exists($cand)) { $controllerClass = $cand; break; }
                            }
                        }
                        if ($controllerClass) {
                            $response = new $controllerClass();
                            switch ($_SERVER['REQUEST_METHOD']) {
                                case 'GET':
                                    if ($param1 && $param2) {
                                        $response->$action($param1, $param2);
                                    } elseif ($param1 && !isset($action)) {
                                        $response->get($param1);
                                    } elseif ($param1 && isset($action)) {
                                        $response->$action($param1);
                                    } elseif (!isset($action)) {
                                        $response->index();
                                    } elseif ($action) {
                                        if (method_exists($controllerClass, $action)) {
                                            $response->$action();
                                        } elseif (count($routesArray) == 3) {
                                            $response->get($action);
                                        } else {
                                            $json = array(
                                                'status' => 404,
                                                'result' => 'Acción no encontrada'
                                            );
                                            echo json_encode($json, http_response_code($json["status"]));
                                        }
                                    } else {
                                        // Llamar a la acción index si no hay acción ni parámetro
                                        $response->index();
                                    }
                                    break;

                                case 'POST':
                                    if ($action) {
                                        if (method_exists($controllerClass, $action)) {
                                            // Pasar parámetros si existen en la URL
                                            if ($param1 && $param2) {
                                                $response->$action($param1, $param2);
                                            } elseif ($param1) {
                                                $response->$action($param1);
                                            } else {
                                                $response->$action();
                                            }
                                        } else {
                                            $json = array(
                                                'status' => 404,
                                                'result' => 'Acción no encontrada'
                                            );
                                            echo json_encode($json, http_response_code($json["status"]));
                                        }
                                    } else {
                                        $response->create();
                                    }
                                    break;

                                case 'PUT':
                                case 'PATCH':
                                    if ($param1) {
                                        $response->update($param1);
                                    } elseif ($action) {
                                        if (method_exists($controllerClass, $action)) {
                                            $response->$action();
                                        } else {
                                            $json = array(
                                                'status' => 404,
                                                'result' => 'Acción no encontrada'
                                            );
                                            echo json_encode($json, http_response_code($json["status"]));
                                        }
                                    } else {
                                        $response->update();
                                    }
                                    break;

                                case 'DELETE':
                                        // DELETE routing flexible: allow /controller/{id} or /controller/delete/{id}
                                        if ($param1) {
                                            // Pattern /controller/action/{id} e.g. /categoria_ticket/delete/5
                                            if ($action && $action !== $param1 && method_exists($controllerClass, $action)) {
                                                // If action exists and param1 is present, call action with param1
                                                $response->$action($param1);
                                            } else {
                                                // Fallback: treat param1 as id for delete
                                                if (method_exists($controllerClass, 'delete')) {
                                                    $response->delete($param1);
                                                } else {
                                                    $json = array(
                                                        'status' => 404,
                                                        'result' => 'Método delete no disponible en este controlador'
                                                    );
                                                    echo json_encode($json, http_response_code($json["status"]));
                                                }
                                            }
                                        } elseif ($action) {
                                            // Pattern /controller/{id} with DELETE (action is numeric id)
                                            if (ctype_digit($action) && method_exists($controllerClass, 'delete')) {
                                                $response->delete($action);
                                            } elseif (method_exists($controllerClass, $action)) {
                                                $response->$action();
                                            } else {
                                                $json = array(
                                                    'status' => 404,
                                                    'result' => 'Acción no encontrada'
                                                );
                                                echo json_encode($json, http_response_code($json["status"]));
                                            }
                                        } else {
                                            // Pattern /controller with DELETE (no id)
                                            if (method_exists($controllerClass, 'delete')) {
                                                $response->delete();
                                            } else {
                                                $json = array(
                                                    'status' => 404,
                                                    'result' => 'ID requerido para eliminar'
                                                );
                                                echo json_encode($json, http_response_code($json["status"]));
                                            }
                                        }
                                    break;

                                default:
                                    $json = array(
                                        'status' => 405,
                                        'result' => 'Método HTTP no permitido'
                                    );
                                    echo json_encode($json, http_response_code($json["status"]));
                                    break;
                            }
                        } else {
                            $json = array(
                                'status' => 404,
                                'result' => 'Controlador no encontrado'
                            );
                            echo json_encode($json, http_response_code($json["status"]));
                        }
                    } catch (\Throwable $th) {
                        $json = array(
                            'status' => 404,
                            'result' => $th->getMessage()
                        );
                        echo json_encode($json, http_response_code($json["status"]));
                    }
                } else {
                    $json = array(
                        'status' => 404,
                        'result' => 'Controlador o acción no especificados'
                    );
                    echo json_encode($json, http_response_code($json["status"]));
                }
            }
        }
    }
}
