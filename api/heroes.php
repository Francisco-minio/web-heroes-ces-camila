<?php
/**
 * API RESTful para gestión de Héroes
 * Endpoints:
 *   GET    /heroes           - Listar todos los héroes
 *   GET    /heroes/:id       - Obtener un héroe específico
 *   POST   /heroes           - Crear nuevo héroe
 *   PUT    /heroes/:id       - Actualizar héroe
 *   DELETE /heroes/:id       - Eliminar héroe
 *   POST   /heroes/:id/points - Asignar puntos a héroe
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Encontrar el índice de 'api' en la URI
$apiIndex = array_search('api', $uri);
if ($apiIndex === false) {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint no válido']);
    exit;
}

// Obtener recurso e ID
$resource = $uri[$apiIndex + 1] ?? null;
$id = isset($uri[$apiIndex + 2]) ? intval($uri[$apiIndex + 2]) : null;
$action = $uri[$apiIndex + 3] ?? null;

if ($resource !== 'heroes') {
    http_response_code(404);
    echo json_encode(['error' => 'Recurso no encontrado']);
    exit;
}

$conn = getDBConnection();

switch ($method) {
    case 'GET':
        if ($id) {
            // Obtener un héroe específico
            $stmt = $conn->prepare("SELECT * FROM heroes WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $hero = $result->fetch_assoc();
            
            if ($hero) {
                // Parsear campos JSON
                $hero['emojis'] = json_decode($hero['emojis'] ?? '[]', true);
                $hero['medals'] = json_decode($hero['medals'] ?? '[]', true);
                $hero['missions'] = json_decode($hero['missions'] ?? '[]', true);
                echo json_encode($hero);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Héroe no encontrado']);
            }
        } else {
            // Listar todos los héroes
            $result = $conn->query("SELECT * FROM heroes ORDER BY points DESC, heroName ASC");
            $heroes = [];
            while ($row = $result->fetch_assoc()) {
                $row['emojis'] = json_decode($row['emojis'] ?? '[]', true);
                $row['medals'] = json_decode($row['medals'] ?? '[]', true);
                $row['missions'] = json_decode($row['missions'] ?? '[]', true);
                $heroes[] = $row;
            }
            echo json_encode($heroes);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if ($id && $action === 'points') {
            // Asignar puntos
            $points = intval($data['points'] ?? 0);
            $reason = $conn->real_escape_string($data['reason'] ?? '');
            $date = date('Y-m-d');
            
            // Actualizar puntos del héroe
            $stmt = $conn->prepare("UPDATE heroes SET points = points + ? WHERE id = ?");
            $stmt->bind_param("ii", $points, $id);
            $stmt->execute();
            
            // Registrar en historial
            $stmt2 = $conn->prepare("INSERT INTO points_history (hero_id, points, reason, date) VALUES (?, ?, ?, ?)");
            $stmt2->bind_param("iiss", $id, $points, $reason, $date);
            $stmt2->execute();
            
            echo json_encode(['success' => true, 'points_added' => $points]);
        } else {
            // Crear nuevo héroe
            $required = ['realName', 'heroName', 'course', 'username', 'password'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Campo requerido: $field"]);
                    exit;
                }
            }
            
            // Verificar username único
            $check = $conn->prepare("SELECT id FROM heroes WHERE username = ?");
            $check->bind_param("s", $data['username']);
            $check->execute();
            if ($check->get_result()->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'El nombre de usuario ya existe']);
                exit;
            }
            
            $stmt = $conn->prepare("INSERT INTO heroes (realName, heroName, course, specialPower, username, password, avatar, points, streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $avatar = $data['avatar'] ?? '🦸';
            $points = intval($data['points'] ?? 0);
            $streak = intval($data['streak'] ?? 0);
            
            $stmt->bind_param("sssssssii", 
                $data['realName'],
                $data['heroName'],
                $data['course'],
                $data['specialPower'],
                $data['username'],
                $data['password'],
                $avatar,
                $points,
                $streak
            );
            
            if ($stmt->execute()) {
                $newId = $conn->insert_id;
                http_response_code(201);
                echo json_encode(['id' => $newId, 'message' => 'Héroe creado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear héroe: ' . $conn->error]);
            }
        }
        break;
        
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Construir query dinámicamente
        $fields = [];
        $types = "";
        $values = [];
        
        $allowedFields = ['realName', 'heroName', 'course', 'specialPower', 'username', 'password', 'avatar', 'points', 'streak', 'emojis', 'medals'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $types .= is_int($data[$field]) ? "i" : "s";
                $values[] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No hay campos para actualizar']);
            exit;
        }
        
        $types .= "i";
        $values[] = $id;
        
        $sql = "UPDATE heroes SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Héroe actualizado']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al actualizar: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM heroes WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Héroe eliminado']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar: ' . $conn->error]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}

$conn->close();
?>
