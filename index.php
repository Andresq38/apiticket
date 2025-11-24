<?php
// Iniciar buffer de salida para poder limpiarlo si hay errores de autenticación
ob_start();

// Composer autoloader
require_once 'vendor/autoload.php';
/*Encabezada de las solicitudes*/
/*CORS - Permitir todos los orígenes en desarrollo*/
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header('Content-Type: application/json');

// Configurar parámetros de cookie y arrancar sesión
// Evitar incluir el puerto en el dominio de la cookie (los navegadores lo rechazan)
$host = $_SERVER['HTTP_HOST'] ?? '';
$domain = preg_replace('/:.*/', '', $host);
session_set_cookie_params([
	'lifetime' => 0,
	'path' => '/',
	'domain' => $domain,
	'secure' => false, // poner true en producción con HTTPS
	'httponly' => true,
	'samesite' => 'Lax'
]);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

/*--- Requerimientos Clases o librerías*/
require_once "controllers/core/Config.php";
require_once "controllers/core/HandleException.php";
require_once "controllers/core/Logger.php";
require_once "controllers/core/MySqlConnect.php";
require_once "controllers/core/Request.php";
require_once "controllers/core/Response.php";
require_once "controllers/core/AuthMiddleware.php";

/***--- Agregar todos los modelos*/
require_once "models/AsignacionModel.php";
require_once "models/AsignacionRegistroModel.php";
require_once "models/Categoria_etiquetaModel.php";
require_once "models/Categoria_ticketModel.php";
require_once "models/EspecialidadModel.php";
require_once "models/EstadoModel.php";
require_once "models/EtiquetaModel.php";
require_once "models/Historial_EstadoModel.php";
require_once "models/ImagenModel.php";
require_once "models/NotificacionModel.php";
require_once "models/RolModel.php";
require_once "models/SlaModel.php";
require_once "models/TecnicoModel.php";
require_once "models/TicketModel.php";
require_once "models/UsuarioModel.php";


/***--- Agregar todos los controladores*/
require_once "controllers/AsignacionController.php";
require_once "controllers/Categoria_etiquetaController.php";
require_once "controllers/Categoria_ticketController.php";
require_once "controllers/EspecialidadController.php";
require_once "controllers/EstadoController.php";
require_once "controllers/EtiquetaController.php";
require_once "controllers/Historial_EstadoController.php";
require_once "controllers/ImagenController.php";
require_once "controllers/NotificacionController.php";
require_once "controllers/RolController.php";
require_once "controllers/SlaController.php";
require_once "controllers/TecnicoController.php";
require_once "controllers/TicketController.php";
require_once "controllers/UsuarioController.php";
require_once "controllers/AuthController.php";



//Enrutador
require_once "routes/RoutesController.php";
$index = new RoutesController();
$index->index();

// Enviar el buffer de salida
ob_end_flush();





