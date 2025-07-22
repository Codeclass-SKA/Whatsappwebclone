<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Events\MessageDeleted;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MessageDeleteController extends Controller
{
    /**
     * Delete a message.
     */
    public function destroy(Request $request, Message $message): JsonResponse
    {
        $request->validate([
            'delete_type' => 'required|in:for_me,for_everyone'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user owns the message
        if (!$message->isFromUser($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $deleteType = $request->input('delete_type');
        $chatId = $message->chat_id;
        $messageId = $message->id;

        if ($deleteType === 'for_me') {
            $message->markAsDeleted();
            $responseMessage = 'Message deleted successfully';
        } else {
            $message->markAsDeletedForAll();
            $responseMessage = 'Message deleted for everyone';
        }

        // Broadcast the message deletion event
        event(new MessageDeleted($messageId, $chatId, $deleteType));

        return response()->json(['message' => $responseMessage]);
    }
} 