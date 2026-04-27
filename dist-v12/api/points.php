<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$method = $_SERVER['REQUEST_METHOD'];
$hero_id = isset($_GET['hero_id']) ? intval($_GET['hero_id']) : null;

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$hero_id || !isset($data['points'])) {
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Actualizar puntos del héroe
        $stmt = $pdo->prepare("UPDATE heroes SET points = points + ? WHERE id = ?");
        $stmt->execute([$data['points'], $hero_id]);

        // 2. Registrar en historial
        $stmtHist = $pdo->prepare("INSERT INTO points_history (hero_id, points, reason, date) VALUES (?, ?, ?, NOW())");
        $stmtHist->execute([
            $hero_id, 
            $data['points'], 
            $data['reason'] ?? 'Ajuste manual'
        ]);

        $pdo->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
