<?php
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? '';
$userId = $_GET['user_id'] ?? null;
$memories = read_data('memories.json');

if (!$userId || !is_numeric($userId)) {
    send_json(['success' => false, 'error' => 'Missing or invalid user_id.']);
}

if ($action === 'get_memories') {
    $userMemories = $memories[$userId] ?? [];
    send_json(['success' => true, 'memories' => $userMemories]);
}

$request = $_POST;

if ($action === 'save') {
    $title = sanitize_string($request['title'] ?? '');
    $emoji = sanitize_string($request['emoji'] ?? '📸');
    $category = sanitize_string($request['category'] ?? 'Uncategorized');
    $photoUrl = null;

    if (isset($_FILES['photo'])) {
        $photoUrl = save_uploaded_image($_FILES['photo']);
    }

    if (!$title) {
        send_json(['success' => false, 'error' => 'Memory title is required.']);
    }
    $userMemories = $memories[$userId] ?? [];
    $newMemory = [
        'id' => time() . rand(100, 999),
        'title' => $title,
        'emoji' => $emoji,
        'category' => $category,
        'photo_url' => $photoUrl,
        'created_at' => date('Y-m-d'),
    ];
    $userMemories[] = $newMemory;
    $memories[$userId] = $userMemories;
    write_data('memories.json', $memories);
    send_json(['success' => true, 'memory' => $newMemory]);
}

send_json(['success' => false, 'error' => 'Invalid memories action.']);
