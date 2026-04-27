<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM courses ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id']) || !isset($data['name'])) {
                throw new Exception("Datos incompletos");
            }

            $stmt = $pdo->prepare("REPLACE INTO courses (id, name, level) VALUES (?, ?, ?)");
            $stmt->execute([$data['id'], $data['name'], $data['level'] ?? 'Básico']);
            
            echo json_encode(["success" => true, "message" => "Curso guardado"]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception("ID no proporcionado");

            $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
