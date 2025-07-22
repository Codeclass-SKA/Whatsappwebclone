<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatParticipant;
use App\Events\ChatMuted;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ChatMuteController extends Controller
{
    /**
     * Mute a chat for the authenticated user.
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

        // Validate muted_until parameter
        $request->validate([
            'muted_until' => 'nullable|date|after:now'
        ]);

        $mutedUntil = null;
        if ($request->has('muted_until')) {
            $mutedUntil = Carbon::parse($request->muted_until);
            
            // Boundary testing: Check minimum and maximum limits
            $minMuteTime = now()->addMinutes(15); // Minimum 15 minutes
            $maxMuteTime = now()->addDays(30); // Maximum 30 days
            
            if ($mutedUntil->lt($minMuteTime)) {
                return response()->json([
                    'message' => 'Mute duration must be at least 15 minutes'
                ], 422);
            }
            
            if ($mutedUntil->gt($maxMuteTime)) {
                return response()->json([
                    'message' => 'Mute duration cannot exceed 30 days'
                ], 422);
            }
        }

        // Mute the chat for this user
        $participant->update([
            'is_muted' => true,
            'muted_until' => $mutedUntil
        ]);

        // Broadcast the mute event
        event(new ChatMuted($chat->id, $user->id, true, $mutedUntil));

        return response()->json(['message' => 'Chat muted successfully']);
    }

    /**
     * Unmute a chat for the authenticated user.
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

        // Unmute the chat for this user
        $participant->update([
            'is_muted' => false,
            'muted_until' => null
        ]);

        // Broadcast the unmute event
        event(new ChatMuted($chat->id, $user->id, false, null));

        return response()->json(['message' => 'Chat unmuted successfully']);
    }

    /**
     * Get muted chats for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        
        $mutedChats = $user->chats()
            ->wherePivot('is_muted', true)
            ->with(['participants', 'lastMessage.user'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($chat) use ($user) {
                $otherParticipant = $chat->participants
                    ->where('id', '!=', $user->id)
                    ->first();
                
                $participant = $chat->participants
                    ->where('id', $user->id)
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
                    'is_muted' => true,
                    'muted_until' => $participant ? $participant->pivot->muted_until : null,
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
            'data' => $mutedChats
        ]);
    }
}
