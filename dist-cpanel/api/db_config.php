<?php
// Configuración de la base de datos para cPanel
$host = 'localhost';
$db   = 'nombre_de_tu_base_de_datos';
$user = 'usuario_de_tu_base_de_datos';
$pass = 'tu_password';
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
    // En producción, no mostrar el error detallado
    die("Error de conexión a la base de datos");
}
?>
