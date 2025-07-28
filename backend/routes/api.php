<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\ChatParticipantController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Api\MessageReactionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\FileUploadController;
use App\Http\Controllers\TypingController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/profile', [AuthController::class, 'profile'])->middleware('auth:sanctum');
Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');

// User routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/search', [UserController::class, 'search']);
    Route::post('/users/status', [UserController::class, 'updateStatus']);
});

// Chat routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::get('/chats/archived', [App\Http\Controllers\Api\ChatArchiveController::class, 'index']);
    Route::get('/chats/muted', [App\Http\Controllers\Api\ChatMuteController::class, 'index']);
    Route::get('/chats/pinned', [App\Http\Controllers\Api\ChatPinController::class, 'index']);
    Route::get('/chats/{chat}', [ChatController::class, 'show']);
    Route::get('/chats/{chat}/export', [App\Http\Controllers\Api\ChatExportController::class, 'export']);
    Route::post('/chats/{chat}/participants', [ChatParticipantController::class, 'store']);
Route::delete('/chats/{chat}/participants', [ChatParticipantController::class, 'destroy']);
Route::delete('/chats/{chat}/participants/{user}', [ChatParticipantController::class, 'removeParticipant']);
    
    // Chat management routes
    Route::post('/chats/{chat}/archive', [App\Http\Controllers\Api\ChatArchiveController::class, 'store']);
    Route::delete('/chats/{chat}/archive', [App\Http\Controllers\Api\ChatArchiveController::class, 'destroy']);
    
    Route::post('/chats/{chat}/mute', [App\Http\Controllers\Api\ChatMuteController::class, 'store']);
    Route::delete('/chats/{chat}/mute', [App\Http\Controllers\Api\ChatMuteController::class, 'destroy']);
    
    Route::post('/chats/{chat}/pin', [App\Http\Controllers\Api\ChatPinController::class, 'pin']);
    Route::delete('/chats/{chat}/pin', [App\Http\Controllers\Api\ChatPinController::class, 'unpin']);
});

// Message routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chats/{chat}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [MessageController::class, 'store']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
    Route::post('/messages/{message}/forward', [MessageController::class, 'forward']);
    Route::post('/messages/forward', [MessageController::class, 'forwardMultiple']);
    Route::post('/messages/{message}/reply', [MessageController::class, 'reply']);
    Route::get('/messages/{message}/replies', [MessageController::class, 'getReplies']);
    Route::get('/messages/search', [MessageController::class, 'search']);
    
    // Typing indicator routes
    Route::post('/chats/{chat}/typing/start', [TypingController::class, 'start']);
    Route::post('/chats/{chat}/typing/stop', [TypingController::class, 'stop']);
});

// Message reaction routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/messages/{message}/reactions', [MessageReactionController::class, 'store']);
    Route::put('/messages/{message}/reactions/{reaction}', [MessageReactionController::class, 'update']);
    Route::delete('/messages/{message}/reactions/{reaction}', [MessageReactionController::class, 'destroy']);
    Route::get('/messages/{message}/reactions', [MessageReactionController::class, 'index']);
});

// File routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/files/upload', [FileUploadController::class, 'upload']);
    Route::get('/messages/{message}/download', [FileUploadController::class, 'download']);
});

// Testing routes (only available in testing environment)
if (app()->environment('testing')) {
    Route::post('/testing/reset', function () {
        Artisan::call('migrate:fresh');
        return response()->json(['message' => 'Database reset']);
    });

    Route::post('/testing/users', function (Request $request) {
        foreach ($request->all() as $userData) {
            User::factory()->create($userData);
        }
        return response()->json(['message' => 'Test users created']);
    });
}