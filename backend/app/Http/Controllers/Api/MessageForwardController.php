<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MessageForwardController extends Controller
{
    /**
     * Forward a single message to another chat.
     */
    public function forward(Request $request, Message $message): JsonResponse
    {
        $request->validate([
            'target_chat_id' => 'required|exists:chats,id'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of the source chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user is participant of the target chat
        $targetChat = Chat::findOrFail($request->target_chat_id);
        if (!$targetChat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if message is deleted
        if ($message->is_deleted || $message->deleted_for_all) {
            throw ValidationException::withMessages([
                'message' => 'Cannot forward deleted message.'
            ]);
        }

        // Create forwarded message
        $forwardedMessage = $targetChat->messages()->create([
            'content' => $message->content,
            'sender_id' => $user->id,
            'message_type' => $message->message_type,
            'file_url' => $message->file_url,
            'forwarded_from' => $message->id,
        ]);

        $forwardedMessage->load(['user', 'forwardedFrom.user']);

        // Broadcast the forwarded message
        broadcast(new MessageSent($forwardedMessage))->toOthers();

        $responseData = [
            'id' => $forwardedMessage->id,
            'content' => $forwardedMessage->content,
            'sender_id' => $forwardedMessage->sender_id,
            'chat_id' => $forwardedMessage->chat_id,
            'message_type' => $forwardedMessage->message_type,
            'file_url' => $forwardedMessage->file_url,
            'forwarded_from' => $forwardedMessage->forwarded_from,
            'original_sender' => [
                'id' => $message->user->id,
                'name' => $message->user->name
            ],
            'user' => [
                'id' => $forwardedMessage->user->id,
                'name' => $forwardedMessage->user->name,
                'avatar' => $forwardedMessage->user->avatar
            ],
            'created_at' => $forwardedMessage->created_at,
            'updated_at' => $forwardedMessage->updated_at
        ];

        return response()->json($responseData, 201);
    }

    /**
     * Forward multiple messages to another chat.
     */
    public function forwardMultiple(Request $request): JsonResponse
    {
        $request->validate([
            'message_ids' => 'required|array|min:1',
            'message_ids.*' => 'exists:messages,id',
            'target_chat_id' => 'required|exists:chats,id'
        ]);

        $user = Auth::user();
        $targetChat = Chat::findOrFail($request->target_chat_id);

        // Check if user is participant of the target chat
        if (!$targetChat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = Message::whereIn('id', $request->message_ids)->get();
        $forwardedMessages = [];

        foreach ($messages as $message) {
            // Check if user is participant of the source chat
            if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
                continue;
            }

            // Check if message is deleted
            if ($message->is_deleted || $message->deleted_for_all) {
                continue;
            }

            // Create forwarded message
            $forwardedMessage = $targetChat->messages()->create([
                'content' => $message->content,
                'sender_id' => $user->id,
                'message_type' => $message->message_type,
                'file_url' => $message->file_url,
                'forwarded_from' => $message->id,
            ]);

            $forwardedMessage->load(['user', 'forwardedFrom.user']);

            // Broadcast the forwarded message
            broadcast(new MessageSent($forwardedMessage))->toOthers();

            $forwardedMessages[] = [
                'id' => $forwardedMessage->id,
                'content' => $forwardedMessage->content,
                'sender_id' => $forwardedMessage->sender_id,
                'chat_id' => $forwardedMessage->chat_id,
                'message_type' => $forwardedMessage->message_type,
                'file_url' => $forwardedMessage->file_url,
                'forwarded_from' => $forwardedMessage->forwarded_from,
                'original_sender' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name
                ],
                'user' => [
                    'id' => $forwardedMessage->user->id,
                    'name' => $forwardedMessage->user->name,
                    'avatar' => $forwardedMessage->user->avatar
                ],
                'created_at' => $forwardedMessage->created_at,
                'updated_at' => $forwardedMessage->updated_at
            ];
        }

        return response()->json([
            'data' => $forwardedMessages,
            'count' => count($forwardedMessages)
        ], 201);
    }
} 