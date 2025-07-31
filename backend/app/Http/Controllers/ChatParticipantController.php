<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Events\ChatParticipantsUpdated;
use App\Events\UserJoinedChat;
use App\Events\UserLeftChat;

/**
 * @OA\Schema(
 *     schema="AddParticipantsRequest",
 *     type="object",
 *     required={"user_ids"},
 *     @OA\Property(
 *         property="user_ids",
 *         type="array",
 *         @OA\Items(type="integer"),
 *         example={2, 3, 4},
 *         description="Array of user IDs to add to the chat"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="RemoveParticipantsRequest",
 *     type="object",
 *     required={"user_ids"},
 *     @OA\Property(
 *         property="user_ids",
 *         type="array",
 *         @OA\Items(type="integer"),
 *         example={2, 3},
 *         description="Array of user IDs to remove from the chat"
 *     )
 * )
 */

class ChatParticipantController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/chats/{chat}/participants",
     *     summary="Add participants to a chat",
     *     tags={"Chat Participants"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="chat",
     *         in="path",
     *         required=true,
     *         description="Chat ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/AddParticipantsRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Participants added successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Participants added successfully"),
     *             @OA\Property(
     *                 property="participants",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/User")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid user IDs",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function store(Request $request, Chat $chat): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Check if user is authorized to add participants
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get users that aren't already participants
        $newUserIds = collect($request->user_ids)->filter(function ($userId) use ($chat) {
            return !$chat->participants()->where('user_id', $userId)->exists();
        });

        // Add new participants
        $newParticipants = $newUserIds->map(function ($userId) use ($chat) {
            $participant = \App\Models\ChatParticipant::create([
                'chat_id' => $chat->id,
                'user_id' => $userId
            ]);
            
            // Get user info for event
            $user = \App\Models\User::find($userId);
            
            // Dispatch UserJoinedChat event
            event(new UserJoinedChat([
                'chat_id' => $chat->id,
                'user_id' => $userId,
                'user_name' => $user->name
            ]));
            
            return $participant;
        });

        // Load participants
        $participants = $chat->participants()->get();

        // Broadcast event to all participants
        broadcast(new ChatParticipantsUpdated($chat->id, $participants->toArray()))->toOthers();

        return response()->json([
            'message' => 'Participants added successfully',
            'participants' => $participants
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/chats/{chat}/participants",
     *     summary="Remove multiple participants from a chat",
     *     tags={"Chat Participants"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="chat",
     *         in="path",
     *         required=true,
     *         description="Chat ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/RemoveParticipantsRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Participants removed successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Participants removed successfully"),
     *             @OA\Property(
     *                 property="participants",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/User")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid user IDs",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function destroy(Request $request, Chat $chat): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Check if user is authorized to remove participants
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get user info before removing
        $removedUsers = \App\Models\User::whereIn('id', $request->user_ids)->get();
        
        // Remove participants
        $chat->participants()->whereIn('user_id', $request->user_ids)->delete();

        // Dispatch UserLeftChat event for each removed user
        foreach ($removedUsers as $user) {
            event(new UserLeftChat([
                'chat_id' => $chat->id,
                'user_id' => $user->id,
                'user_name' => $user->name
            ]));
        }

        // Load remaining participants
        $participants = $chat->participants()->get();

        // Broadcast event to all participants
        broadcast(new ChatParticipantsUpdated($chat->id, $participants->toArray()))->toOthers();

        return response()->json([
            'message' => 'Participants removed successfully',
            'participants' => $participants
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/chats/{chat}/participants/{user}",
     *     summary="Remove a single participant from a chat",
     *     tags={"Chat Participants"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="chat",
     *         in="path",
     *         required=true,
     *         description="Chat ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         description="User ID of participant to remove",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Participant removed successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Participant removed successfully"),
     *             @OA\Property(
     *                 property="participants",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/User")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User is not a participant of this chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function removeParticipant(Request $request, Chat $chat, User $user): JsonResponse
    {
        // Check if user is authorized to remove participants
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if the user to be removed is a participant
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User is not a participant of this chat'], 404);
        }

        // Remove the participant
        $chat->participants()->where('user_id', $user->id)->delete();

        // Dispatch UserLeftChat event
        event(new UserLeftChat([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'user_name' => $user->name
        ]));

        // Load remaining participants
        $participants = $chat->participants()->get();

        // Broadcast event to all participants
        broadcast(new ChatParticipantsUpdated($chat->id, $participants->toArray()))->toOthers();

        return response()->json([
            'message' => 'Participant removed successfully',
            'participants' => $participants
        ]);
    }
}