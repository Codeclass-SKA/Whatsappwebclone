<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Events\ChatPinned;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatPinController extends Controller
{
    /**
     * Pin a chat for the authenticated user
     */
    public function pin(Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        $participant = ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();
            
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Check if user has already pinned maximum number of chats (10)
        $pinnedCount = ChatParticipant::where('user_id', $user->id)
            ->where('is_pinned', true)
            ->count();
            
        if ($pinnedCount >= 10) {
            return response()->json(['message' => 'Maximum number of pinned chats reached'], 422);
        }
        
        // Pin the chat
        $participant->update(['is_pinned' => true]);
        
        // Broadcast event
        broadcast(new ChatPinned($chat, $user))->toOthers();
        
        return response()->json(['message' => 'Chat pinned successfully']);
    }
    
    /**
     * Unpin a chat for the authenticated user
     */
    public function unpin(Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        $participant = ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();
            
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Unpin the chat
        $participant->update(['is_pinned' => false]);
        
        // Broadcast event
        broadcast(new ChatPinned($chat, $user, false))->toOthers();
        
        return response()->json(['message' => 'Chat unpinned successfully']);
    }
    
    /**
     * Get pinned chats for the authenticated user
     */
    public function index(): JsonResponse
    {
        return $this->getPinnedChats();
    }
    
    /**
     * Get pinned chats for the authenticated user
     */
    public function getPinnedChats(): JsonResponse
    {
        $user = Auth::user();
        
        $pinnedChats = Chat::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('is_pinned', true);
        })
        ->with(['participants', 'lastMessage.user'])
        ->orderBy('updated_at', 'desc')
        ->get()
        ->map(function ($chat) use ($user) {
            $otherParticipant = $chat->participants
                ->where('id', '!=', $user->id)
                ->first();
            
            // Get participant data directly from pivot table
            $participantData = ChatParticipant::where('chat_id', $chat->id)
                ->where('user_id', $user->id)
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
                'is_muted' => $participantData ? $participantData->is_muted : false,
                'muted_until' => $participantData ? $participantData->muted_until : null,
                'is_pinned' => $participantData ? $participantData->is_pinned : false,
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
        
        return response()->json(['data' => $pinnedChats]);
    }
}
