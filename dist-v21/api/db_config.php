<?php
// Cazador de Errores Fatales para depuración
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            "error_critico" => "PHP Fatal Error",
            "mensaje" => $error['message'],
            "archivo" => $error['file'],
            "linea" => $error['line']
        ]);
    }
});

// Configuración de la base de datos para cPanel
$host = 'localhost';
$db   = 'vibecoding_superheroes';
$user = 'vibecoding_superheroes';
$pass = 'eRO6cJO242fbFq';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_MODE_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    header('Content-Type: application/json');
    die(json_encode([
        "error" => "Error de conexión a la base de datos",
        "details" => $e->getMessage()
    ]));
}
?>
