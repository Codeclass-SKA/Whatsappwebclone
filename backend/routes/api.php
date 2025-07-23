<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\FileUploadController;
use App\Http\Controllers\Api\MessageReactionController;
use App\Http\Controllers\Api\MessageReplyController;
use App\Http\Controllers\Api\MessageForwardController;
use App\Http\Controllers\Api\MessageDeleteController;
use App\Http\Controllers\Api\MessageSearchController;
use App\Http\Controllers\Api\ChatArchiveController;
use App\Http\Controllers\Api\ChatMuteController;
use App\Http\Controllers\Api\ChatPinController;
use App\Http\Controllers\Api\ChatExportController;
use App\Http\Controllers\Api\TypingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Authentication routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Broadcasting authentication
Route::middleware('auth:sanctum')->post('/broadcasting/auth', function (Request $request) {
    $channelName = $request->input('channel_name');
    $socketId = $request->input('socket_id');
    
    // Extract chat ID from channel name (e.g., "private-chat.1" -> 1)
    if (preg_match('/private-chat\.(\d+)/', $channelName, $matches)) {
        $chatId = $matches[1];
        $chat = \App\Models\Chat::find($chatId);
        
        if (!$chat) {
            return response('', 403);
        }
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $request->user()->id)->exists()) {
            return response('', 403);
        }
        
        // Return success response
        return response('', 200);
    }
    
    return response('', 403);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    
    // User routes
    Route::get('/users', [AuthController::class, 'getUsers']);
    Route::get('/users/search', [AuthController::class, 'searchUsers']);
    
    // Chat routes
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::get('/chats/{chat}/messages', [ChatController::class, 'messages']);
    Route::post('/chats/{chat}/messages', [ChatController::class, 'sendMessage']);
    
    // Chat archive routes
    Route::get('/chats/archived', [ChatArchiveController::class, 'index']);
    Route::post('/chats/{chat}/archive', [ChatArchiveController::class, 'store']);
    Route::delete('/chats/{chat}/archive', [ChatArchiveController::class, 'destroy']);
    
    // Chat mute routes
    Route::get('/chats/muted', [ChatMuteController::class, 'index']);
    Route::post('/chats/{chat}/mute', [ChatMuteController::class, 'store']);
    Route::delete('/chats/{chat}/mute', [ChatMuteController::class, 'destroy']);
    
    // Chat pin routes
    Route::get('/chats/pinned', [ChatPinController::class, 'getPinnedChats']);
    Route::post('/chats/{chat}/pin', [ChatPinController::class, 'pin']);
    Route::delete('/chats/{chat}/pin', [ChatPinController::class, 'unpin']);
    
    // Chat export routes
    Route::get('/chats/{chat}/export', [ChatExportController::class, 'export']);
    
    // Message search routes
    Route::get('/messages/search', [MessageSearchController::class, 'search']);
    
    // File upload routes
    Route::post('/chats/{chat}/upload', [FileUploadController::class, 'upload']);
    Route::get('/messages/{message}/download', [FileUploadController::class, 'download']);
    
    // Message reaction routes
    Route::get('/messages/{message}/reactions', [MessageReactionController::class, 'index']);
    Route::post('/messages/{message}/reactions', [MessageReactionController::class, 'store']);
    Route::put('/messages/{message}/reactions/{reaction}', [MessageReactionController::class, 'update']);
    Route::delete('/messages/{message}/reactions/{reaction}', [MessageReactionController::class, 'destroy']);
    
    // Message reply routes
    Route::get('/messages/{message}/replies', [MessageReplyController::class, 'index']);
    
    // Message forward routes
    Route::post('/messages/{message}/forward', [MessageForwardController::class, 'forward']);
    Route::post('/messages/forward-multiple', [MessageForwardController::class, 'forwardMultiple']);
    
    // Message delete routes
    Route::delete('/messages/{message}', [MessageDeleteController::class, 'destroy']);
    
    // Typing indicator routes
    Route::post('/chats/{chat}/typing/start', [TypingController::class, 'startTyping']);
    Route::post('/chats/{chat}/typing/stop', [TypingController::class, 'stopTyping']);
}); 