<?php
header("Content-Type: application/json");
require_once 'db_config.php';

// Seguridad básica: Solo permitir si es llamado por el servidor o con una clave
// if ($_SERVER['REMOTE_ADDR'] !== $_SERVER['SERVER_ADDR']) die('Acceso denegado');

try {
    // 1. Obtener configuración
    $stmtConfig = $pdo->query("SELECT * FROM system_config WHERE id = 1");
    $config = $stmtConfig->fetch();
    
    if (!$config) {
        // Crear configuración por defecto si no existe
        $pdo->query("INSERT INTO system_config (id, cron_amount, cron_hour, cron_bonus) VALUES (1, 3, 5, 3)");
        $config = ["cron_amount" => 3, "cron_hour" => 5, "cron_bonus" => 3, "last_cron_run" => null];
    }

    $today = new Date();
    $currentHour = intval(date('H'));
    $isSunday = (date('N') == 7);
    
    // Verificar si ya se ejecutó hoy
    if ($config['last_cron_run']) {
        $lastRun = date('Y-m-d', strtotime($config['last_cron_run']));
        if ($lastRun === date('Y-m-d') && !isset($_GET['manual'])) {
            echo json_encode(["skip" => true, "reason" => "Ya se ejecutó hoy"]);
            exit;
        }
    }

    // Cantidad a asignar
    $amount = intval($config['cron_amount']);
    $reason = 'Asignación diaria automática (⚡)';

    if ($isSunday) {
        $amount += intval($config['cron_bonus']);
        $reason = 'Asignación semanal (⚡) + Diaria';
    }

    $pdo->beginTransaction();

    // 2. Obtener todos los héroes
    $heroes = $pdo->query("SELECT id FROM heroes")->fetchAll();

    foreach ($heroes as $hero) {
        // Actualizar puntos y racha
        $stmtHero = $pdo->prepare("UPDATE heroes SET points = points + ?, streak = streak + 1 WHERE id = ?");
        $stmtHero->execute([$amount, $hero['id']]);

        // Registrar historial
        $stmtHist = $pdo->prepare("INSERT INTO points_history (hero_id, points, reason, date) VALUES (?, ?, ?, NOW())");
        $stmtHist->execute([$hero['id'], $amount, $reason]);
    }

    // 3. Actualizar fecha de última ejecución
    $pdo->query("UPDATE system_config SET last_cron_run = NOW() WHERE id = 1");

    $pdo->commit();

    echo json_encode([
        "success" => true, 
        "message" => "Proceso completado. $amount rayos asignados a " . count($heroes) . " héroes."
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
