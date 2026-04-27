<?php
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
