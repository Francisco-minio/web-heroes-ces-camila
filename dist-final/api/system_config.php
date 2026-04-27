<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM system_config WHERE id = 1");
        $config = $stmt->fetch();
        if (!$config) {
            $pdo->query("INSERT INTO system_config (id) VALUES (1)");
            $config = $pdo->query("SELECT * FROM system_config WHERE id = 1")->fetch();
        }
        echo json_encode($config);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE system_config SET cron_amount = ?, cron_hour = ?, cron_bonus = ? WHERE id = 1");
        $stmt->execute([
            intval($data['cronAmount']), 
            intval($data['cronHour']), 
            intval($data['cronBonus'] ?? 0)
        ]);
        
        $config = $pdo->query("SELECT * FROM system_config WHERE id = 1")->fetch();
        echo json_encode($config);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
