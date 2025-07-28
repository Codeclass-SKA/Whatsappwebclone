<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private chat channel authorization
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);
    
    if (!$chat) {
        return false;
    }
    
    // Check if user is a participant of this chat
    return $chat->participants()->where('user_id', $user->id)->exists();
});

// Private chat channel authorization (for WebSocketTest)
Broadcast::channel('private-chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);
    
    if (!$chat) {
        return false;
    }
    
    // Check if user is a participant of this chat
    return $chat->participants()->where('user_id', $user->id)->exists();
});

// User presence channel
Broadcast::channel('presence-chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);
    
    if (!$chat || !$chat->participants()->where('user_id', $user->id)->exists()) {
        return false;
    }
    
    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar' => $user->avatar,
        'is_online' => $user->is_online,
    ];
});

// Presence channel for online status (for WebSocketTest)
Broadcast::channel('presence-online-status', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => $user->avatar,
        'status' => $user->status,
        'is_online' => $user->is_online,
        'last_seen' => $user->last_seen
    ];
});
