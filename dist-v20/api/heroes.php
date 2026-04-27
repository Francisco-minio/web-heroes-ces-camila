<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Obtener un héroe específico con su historial
                $stmt = $pdo->prepare("SELECT * FROM heroes WHERE id = ?");
                $stmt->execute([$id]);
                $today = date('Y-m-d H:i:s');
                $currentHour = intval(date('H'));
                $hero = $stmt->fetch();
                
                if ($hero) {
                    $stmtHist = $pdo->prepare("SELECT * FROM points_history WHERE hero_id = ? ORDER BY date DESC");
                    $stmtHist->execute([$id]);
                    $hero['pointsHistory'] = $stmtHist->fetchAll();
                    echo json_encode($hero);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Héroe no encontrado"]);
                }
            } else {
                // Obtener todos los héroes con su historial (agrupado)
                $stmt = $pdo->query("SELECT * FROM heroes ORDER BY points DESC");
                $heroes = $stmt->fetchAll();
                
                foreach ($heroes as &$hero) {
                    $stmtHist = $pdo->prepare("SELECT * FROM points_history WHERE hero_id = ? ORDER BY date DESC");
                    $stmtHist->execute([$hero['id']]);
                    $hero['pointsHistory'] = $stmtHist->fetchAll();
                }
                echo json_encode($heroes);
            }
            break;

        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            if (!$data) {
                $data = $_POST;
            }

            // Lógica de Guardar/Actualizar
            if (isset($data['id']) && $data['id'] > 0) {
                // Update
                $sql = "UPDATE heroes SET heroName = ?, realName = ?, username = ?, password = ?, course = ?, superPower = ?, avatar = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $data['heroName'], 
                    $data['realName'], 
                    $data['username'] ?? '',
                    $data['password'] ?? '',
                    $data['course'] ?? '', 
                    $data['superPower'] ?? '', 
                    $data['avatar'] ?? '🦸', 
                    $data['id']
                ]);
                echo json_encode(["success" => true, "id" => $data['id']]);
            } else {
                // Create
                $sql = "INSERT INTO heroes (heroName, realName, username, password, course, superPower, avatar, points, streak) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $data['heroName'], 
                    $data['realName'], 
                    $data['username'] ?? '',
                    $data['password'] ?? '',
                    $data['course'] ?? '', 
                    $data['superPower'] ?? '', 
                    $data['avatar'] ?? '🦸'
                ]);
                echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            }
            break;

        case 'DELETE':
            if ($id) {
                $pdo->prepare("DELETE FROM points_history WHERE hero_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM heroes WHERE id = ?")->execute([$id]);
                echo json_encode(["success" => true]);
            }
            break;

        default:
            http_response_code(405);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
