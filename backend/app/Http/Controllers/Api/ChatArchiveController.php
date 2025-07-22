<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Events\ChatArchived;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ChatArchiveController extends Controller
{
    /**
     * Archive a chat for the authenticated user.
     */
    public function store(Request $request, Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        $participant = ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Archive the chat for this user
        $participant->update(['is_archived' => true]);

        // Broadcast the archive event
        event(new ChatArchived($chat->id, $user->id, true));

        return response()->json(['message' => 'Chat archived successfully']);
    }

    /**
     * Unarchive a chat for the authenticated user.
     */
    public function destroy(Request $request, Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        $participant = ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Unarchive the chat for this user
        $participant->update(['is_archived' => false]);

        // Broadcast the unarchive event
        event(new ChatArchived($chat->id, $user->id, false));

        return response()->json(['message' => 'Chat unarchived successfully']);
    }

    /**
     * Get archived chats for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        
        $archivedChats = $user->chats()
            ->wherePivot('is_archived', true)
            ->with(['participants', 'lastMessage.user'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($chat) use ($user) {
                $otherParticipant = $chat->participants
                    ->where('id', '!=', $user->id)
                    ->first();
                
                return [
                    'id' => $chat->id,
                    'type' => $chat->type,
                    'name' => $chat->type === 'private' 
                        ? ($otherParticipant ? $otherParticipant->name : 'Unknown User')
                        : ($chat->name ?? 'Unnamed Group'),
                    'avatar' => $chat->type === 'private' 
                        ? ($otherParticipant ? $otherParticipant->avatar : null)
                        : $chat->avatar,
                    'last_message' => $chat->lastMessage ? [
                        'content' => $chat->lastMessage->content,
                        'user_name' => $chat->lastMessage->user->name,
                        'created_at' => $chat->lastMessage->created_at
                    ] : null,
                    'participants' => $chat->participants->map(function ($participant) {
                        return [
                            'id' => $participant->id,
                            'name' => $participant->name,
                            'avatar' => $participant->avatar,
                            'is_online' => $participant->is_online,
                            'last_seen' => $participant->last_seen
                        ];
                    }),
                    'created_at' => $chat->created_at,
                    'updated_at' => $chat->updated_at
                ];
            });

        return response()->json([
            'data' => $archivedChats
        ]);
    }
} 