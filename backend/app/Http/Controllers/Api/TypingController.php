<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Events\UserTyping;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TypingController extends Controller
{
    /**
     * Send typing indicator
     */
    public function startTyping(Request $request, Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $typingData = [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'chat_id' => $chat->id,
            'is_typing' => true
        ];

        // Broadcast typing event
        broadcast(new UserTyping($typingData))->toOthers();

        return response()->json([
            'message' => 'Typing indicator sent'
        ]);
    }

    /**
     * Stop typing indicator
     */
    public function stopTyping(Request $request, Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $typingData = [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'chat_id' => $chat->id,
            'is_typing' => false
        ];

        // Broadcast stop typing event
        broadcast(new UserTyping($typingData))->toOthers();

        return response()->json([
            'message' => 'Typing indicator stopped'
        ]);
    }
} 