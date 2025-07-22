<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\MessageReaction;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Message Reactions API\n";
echo "=============================\n\n";

// Get first user and create token
$user = User::first();
if (!$user) {
    echo "No users found in database\n";
    exit(1);
}

$token = $user->createToken('test')->plainTextToken;
echo "User: {$user->name} (ID: {$user->id})\n";
echo "Token: {$token}\n\n";

// Test getting reactions for message ID 1
echo "Testing GET /api/messages/1/reactions\n";
$url = 'http://localhost:8000/api/messages/1/reactions';

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

// Show reactions from database directly
echo "Reactions from database for message ID 1:\n";
$reactions = MessageReaction::where('message_id', 1)->with('user')->get();
foreach ($reactions as $reaction) {
    echo "- ID: {$reaction->id}, User: {$reaction->user->name}, Emoji: {$reaction->emoji}\n";
} 