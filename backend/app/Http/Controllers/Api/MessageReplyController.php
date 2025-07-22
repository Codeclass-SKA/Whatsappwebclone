<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MessageReplyController extends Controller
{
    /**
     * Get replies to a message.
     */
    public function index(Message $message): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $replies = $message->replies()->with('user')->get()->map(function ($reply) {
            return [
                'id' => $reply->id,
                'content' => $reply->content,
                'sender_id' => $reply->sender_id,
                'chat_id' => $reply->chat_id,
                'message_type' => $reply->message_type,
                'reply_to_id' => $reply->reply_to_id,
                'user' => [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'avatar' => $reply->user->avatar
                ],
                'created_at' => $reply->created_at,
                'updated_at' => $reply->updated_at
            ];
        });

        return response()->json([
            'data' => $replies
        ]);
    }
}
