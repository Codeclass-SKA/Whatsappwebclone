<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Events\ChatParticipantsUpdated;
use App\Events\UserJoinedChat;
use App\Events\UserLeftChat;

class ChatParticipantController extends Controller
{
    /**
     * Add participants to a chat.
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
     * Remove participants from a chat.
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
     * Remove a single participant from a chat.
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