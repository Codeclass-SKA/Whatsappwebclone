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

/**
 * @OA\Schema(
 *     schema="ReactionCreateRequest",
 *     type="object",
 *     required={"emoji"},
 *     @OA\Property(property="emoji", type="string", maxLength=10, example="👍", description="The emoji reaction to add")
 * )
 */

/**
 * @OA\Schema(
 *     schema="ReactionUpdateRequest",
 *     type="object",
 *     required={"emoji"},
 *     @OA\Property(property="emoji", type="string", maxLength=10, example="❤️", description="The new emoji reaction")
 * )
 */

/**
 * @OA\Schema(
 *     schema="ReactionResponse",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="message_id", type="integer", example=123),
 *     @OA\Property(property="user_id", type="integer", example=456),
 *     @OA\Property(property="emoji", type="string", example="👍"),
 *     @OA\Property(property="user", type="object",
 *         @OA\Property(property="id", type="integer", example=456),
 *         @OA\Property(property="name", type="string", example="John Doe"),
 *         @OA\Property(property="avatar", type="string", example="https://example.com/avatar.jpg")
 *     ),
 *     @OA\Property(property="created_at", type="string", format="date-time", example="2024-01-01T12:00:00Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", example="2024-01-01T12:00:00Z")
 * )
 */

class MessageReactionController extends Controller
{
    /**
     * Add a reaction to a message.
     *
     * @OA\Post(
     *     path="/api/messages/{message}/reactions",
     *     summary="Add a reaction to a message",
     *     tags={"Reactions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Message ID"
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/ReactionCreateRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Reaction added successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", ref="#/components/schemas/ReactionResponse")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid emoji or duplicate reaction",
     *         @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse")
     *     )
     * )
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
     *
     * @OA\Get(
     *     path="/api/messages/{message}/reactions",
     *     summary="Get reactions for a message",
     *     tags={"Reactions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Message ID"
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Reactions retrieved successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/ReactionResponse")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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
     *
     * @OA\Put(
     *     path="/api/messages/{message}/reactions/{reaction}",
     *     summary="Update a reaction",
     *     tags={"Reactions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Message ID"
     *     ),
     *     @OA\Parameter(
     *         name="reaction",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Reaction ID"
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/ReactionUpdateRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Reaction updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", ref="#/components/schemas/ReactionResponse")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat or doesn't own the reaction",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid emoji",
     *         @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse")
     *     )
     * )
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
     *
     * @OA\Delete(
     *     path="/api/messages/{message}/reactions/{reaction}",
     *     summary="Remove a reaction",
     *     tags={"Reactions"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Message ID"
     *     ),
     *     @OA\Parameter(
     *         name="reaction",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Reaction ID"
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Reaction removed successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Reaction removed successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat or doesn't own the reaction",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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
