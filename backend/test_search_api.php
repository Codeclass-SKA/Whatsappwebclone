<?php

require_once 'vendor/autoload.php';

use App\Models\User;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Message Search API\n";
echo "=========================\n\n";

// Get first user and create token
$user = User::first();
if (!$user) {
    echo "No users found in database\n";
    exit(1);
}

$token = $user->createToken('test')->plainTextToken;
echo "User: {$user->name} (ID: {$user->id})\n";
echo "Token: {$token}\n\n";

// Test search messages
echo "Testing GET /api/messages/search?q=hello\n";
$url = 'http://localhost:8000/api/messages/search?q=hello';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n\n";

// Test search with chat_id filter
echo "Testing GET /api/messages/search?q=hello&chat_id=1\n";
$url = 'http://localhost:8000/api/messages/search?q=hello&chat_id=1';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n\n"; 