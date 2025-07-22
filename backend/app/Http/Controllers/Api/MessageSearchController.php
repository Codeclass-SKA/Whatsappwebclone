<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ChatParticipant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MessageSearchController extends Controller
{
    /**
     * Search messages in user's chats
     */
    public function search(Request $request): JsonResponse
    {
        // Validate request
        $request->validate([
            'q' => 'required|string|min:2',
            'chat_id' => 'nullable|integer|exists:chats,id',
            'per_page' => 'nullable|integer|min:1|max:100'
        ]);

        $user = Auth::user();
        $query = $request->input('q');
        $chatId = $request->input('chat_id');
        $perPage = $request->input('per_page', 15);

        // Get chat IDs where user is participant
        $chatIds = ChatParticipant::where('user_id', $user->id)
            ->pluck('chat_id');

        // If specific chat_id is provided, verify user is participant
        if ($chatId && !$chatIds->contains($chatId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Build query
        $messagesQuery = Message::whereIn('chat_id', $chatId ? [$chatId] : $chatIds)
            ->where('is_deleted', false)
            ->where('deleted_for_all', false)
            ->where(function ($q) use ($query) {
                $q->where('content', 'LIKE', "%{$query}%");
            })
            ->with(['user', 'chat'])
            ->orderByRaw("
                (LENGTH(content) - LENGTH(REPLACE(LOWER(content), LOWER(?), ''))) / LENGTH(?) DESC
            ", [$query, $query])
            ->orderBy('created_at', 'desc');

        $messages = $messagesQuery->paginate($perPage);

        // Format results
        $formattedMessages = $messages->getCollection()->map(function ($message) {
            return [
                'id' => $message->id,
                'content' => $message->content,
                'sender_id' => $message->sender_id,
                'chat_id' => $message->chat_id,
                'message_type' => $message->message_type,
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at,
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'avatar' => $message->user->avatar
                ],
                'chat' => [
                    'id' => $message->chat->id,
                    'type' => $message->chat->type,
                    'name' => $message->chat->name
                ]
            ];
        });

        return response()->json([
            'data' => $formattedMessages,
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'per_page' => $messages->perPage(),
            'total' => $messages->total(),
            'from' => $messages->firstItem(),
            'to' => $messages->lastItem()
        ]);
    }
}
