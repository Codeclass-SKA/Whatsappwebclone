<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Events\MessageReactionAdded;
use App\Events\MessageReactionRemoved;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MessageReactionController extends Controller
{
    /**
     * Add a reaction to a message.
     */
    public function store(Request $request, Message $message): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string|max:10'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate emoji
        if (!MessageReaction::isValidEmoji($request->emoji)) {
            throw ValidationException::withMessages([
                'emoji' => 'Invalid emoji provided.'
            ]);
        }

        // Check for duplicate reaction
        $existingReaction = MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => $request->emoji
        ])->first();

        if ($existingReaction) {
            throw ValidationException::withMessages([
                'emoji' => 'You have already reacted with this emoji.'
            ]);
        }

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => $request->emoji
        ]);

        $reaction->load('user');

        // Broadcast the reaction event
        event(new MessageReactionAdded($reaction));

        return response()->json([
            'data' => [
                'id' => $reaction->id,
                'message_id' => $reaction->message_id,
                'user_id' => $reaction->user_id,
                'emoji' => $reaction->emoji,
                'user' => [
                    'id' => $reaction->user->id,
                    'name' => $reaction->user->name,
                    'avatar' => $reaction->user->avatar
                ],
                'created_at' => $reaction->created_at,
                'updated_at' => $reaction->updated_at
            ]
        ], 201);
    }

    /**
     * Get reactions for a message.
     */
    public function index(Message $message): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reactions = $message->reactions()->with('user')->get()->map(function ($reaction) {
            return [
                'id' => $reaction->id,
                'message_id' => $reaction->message_id,
                'user_id' => $reaction->user_id,
                'emoji' => $reaction->emoji,
                'user' => [
                    'id' => $reaction->user->id,
                    'name' => $reaction->user->name,
                    'avatar' => $reaction->user->avatar
                ],
                'created_at' => $reaction->created_at,
                'updated_at' => $reaction->updated_at
            ];
        });

        return response()->json([
            'data' => $reactions
        ]);
    }

    /**
     * Update a reaction.
     */
    public function update(Request $request, Message $message, MessageReaction $reaction): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string|max:10'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user owns the reaction
        if (!$reaction->isFromUser($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate emoji
        if (!MessageReaction::isValidEmoji($request->emoji)) {
            throw ValidationException::withMessages([
                'emoji' => 'Invalid emoji provided.'
            ]);
        }

        $reaction->update(['emoji' => $request->emoji]);
        $reaction->load('user');

        // Broadcast the updated reaction event
        event(new MessageReactionAdded($reaction));

        return response()->json([
            'data' => [
                'id' => $reaction->id,
                'message_id' => $reaction->message_id,
                'user_id' => $reaction->user_id,
                'emoji' => $reaction->emoji,
                'user' => [
                    'id' => $reaction->user->id,
                    'name' => $reaction->user->name,
                    'avatar' => $reaction->user->avatar
                ],
                'created_at' => $reaction->created_at,
                'updated_at' => $reaction->updated_at
            ]
        ]);
    }

    /**
     * Remove a reaction.
     */
    public function destroy(Message $message, MessageReaction $reaction): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user owns the reaction
        if (!$reaction->isFromUser($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Store reaction data before deletion for broadcasting
        $reactionData = [
            'id' => $reaction->id,
            'message_id' => $reaction->message_id,
            'user_id' => $reaction->user_id,
            'emoji' => $reaction->emoji
        ];

        $chatId = $message->chat_id;

        $reaction->delete();

        // Broadcast the reaction removal event
        event(new MessageReactionRemoved($reactionData['id'], $reactionData['message_id'], $reactionData['user_id'], $chatId));

        return response()->json(['message' => 'Reaction removed successfully']);
    }
}
