<?php
// Configuración de base de datos - Superhéroes App
// Colocar este archivo fuera de public_html si es posible, o proteger con .htaccess

// Detectar si es desarrollo local o producción
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

if ($isLocal) {
    // Configuración local (XAMPP, MAMP, etc.)
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'superheroes');
} else {
    // Configuración producción (cPanel)
    // Reemplazar con tus credenciales de cPanel MySQL
    define('DB_HOST', 'localhost');
    define('DB_USER', 'vibecoding_superheroes');
    define('DB_PASS', 'Yov61331!');
    define('DB_NAME', 'vibecoding_superheroes');
}

// Crear conexión
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]));
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Headers CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
