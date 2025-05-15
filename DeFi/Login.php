<?php
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    echo json_encode(['success' => true, 'user_id' => $user['id']]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
}
?>
