<?php
// push_token.php — CONTOH endpoint simpan token FCM per user (perlu disesuaikan ke skema DB kamu).
// Pasang di folder yang sama dengan chat.php, lalu sesuaikan URL di snippet.html ('/push_token').
// Tabel contoh:_push_tokens(user_id INT, token VARCHAR(255), platform VARCHAR(20), updated_at DATETIME, UNIQUE(token)).
require __DIR__ . '/session_config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error' => 'Belum masuk.']); exit; }
$token = trim((string)($_POST['token'] ?? ''));
$platform = trim((string)($_POST['platform'] ?? 'android'));
if ($token === '' || strlen($token) > 255) { http_response_code(400); echo json_encode(['error' => 'token tidak valid']); exit; }

$cfg = json_decode((string)@file_get_contents(__DIR__ . '/config.json'), true);
try {
  $pdo = new PDO("mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4", $cfg['db_user'], $cfg['db_pass']);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->exec("CREATE TABLE IF NOT EXISTS _push_tokens (user_id INT NOT NULL, token VARCHAR(255) NOT NULL UNIQUE, platform VARCHAR(20) DEFAULT 'android', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY (user_id))");
  $st = $pdo->prepare("INSERT INTO _push_tokens (user_id, token, platform) VALUES (?,?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), platform=VALUES(platform)");
  $st->execute([(int)$_SESSION['user_id'], $token, $platform]);
  echo json_encode(['ok' => true]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['error' => 'Database bermasalah.']); }
