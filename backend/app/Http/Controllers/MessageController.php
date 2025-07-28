<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    /**
     * Get messages for a chat.
     */
    public function index(Request $request, Chat $chat): JsonResponse
    {
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = $chat->messages()
            ->where(function ($query) {
                $query->where('deleted_for_all', false)
                      ->where(function ($q) {
                          $q->where('is_deleted', false)
                            ->orWhereNull('is_deleted');
                      });
            })
            ->with(['user', 'reactions.user', 'replies.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'from' => $messages->firstItem(),
                'to' => $messages->lastItem(),
            ],
            'links' => [
                'first' => $messages->url(1),
                'last' => $messages->url($messages->lastPage()),
                'prev' => $messages->previousPageUrl(),
                'next' => $messages->nextPageUrl(),
            ]
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(Request $request, Chat $chat): JsonResponse
    {
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string',
            'type' => 'required|in:text,image,file,audio',
            'file_url' => 'nullable|url',
            'reply_to_id' => 'nullable|exists:messages,id'
        ]);

        $message = $chat->messages()->create([
            'content' => $request->content,
            'message_type' => $request->type,
            'sender_id' => auth()->id(),
            'file_url' => $request->file_url,
            'reply_to_id' => $request->reply_to_id
        ]);

        $message->load(['user', 'reactions.user', 'replies.user']);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['data' => $message], 201);
    }

    /**
     * Delete a message.
     */
    public function destroy(Request $request, Message $message): JsonResponse
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'delete_type' => 'required|in:for_me,for_everyone'
        ]);

        if ($request->delete_type === 'for_everyone') {
            $message->update(['deleted_for_all' => true]);
        } else {
            $message->update(['is_deleted' => true]);
        }

        if ($request->delete_type === 'for_everyone') {
            return response()->json(['message' => 'Message deleted for everyone'], 200);
        } else {
            return response()->json(['message' => 'Message deleted successfully'], 200);
        }
    }

    /**
     * Forward a message.
     */
    public function forward(Request $request, Message $message): JsonResponse
    {
        $request->validate([
            'target_chat_id' => 'required|exists:chats,id'
        ]);

        // Check if message is deleted
        if ($message->is_deleted || $message->deleted_for_all) {
            return response()->json(['message' => 'Cannot forward deleted message'], 422);
        }

        $targetChat = Chat::findOrFail($request->target_chat_id);

        if (!$targetChat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $forwardedMessage = $targetChat->messages()->create([
            'content' => $message->content,
            'message_type' => $message->message_type,
            'sender_id' => auth()->id(),
            'file_url' => $message->file_url,
            'forwarded_from' => $message->id
        ]);

        $forwardedMessage->load(['user', 'originalMessage.user']);

        broadcast(new MessageSent($forwardedMessage))->toOthers();

        // Add original sender info to response
        $response = $forwardedMessage->toArray();
        $response['original_sender'] = [
            'id' => $message->user->id,
            'name' => $message->user->name
        ];

        return response()->json($response, 201);
    }

    /**
     * Forward multiple messages.
     */
    public function forwardMultiple(Request $request): JsonResponse
    {
        $request->validate([
            'message_ids' => 'required|array|min:1',
            'message_ids.*' => 'exists:messages,id',
            'target_chat_id' => 'required|exists:chats,id'
        ]);

        $targetChat = Chat::findOrFail($request->target_chat_id);

        if (!$targetChat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $forwardedMessages = [];
        $messages = Message::whereIn('id', $request->message_ids)->get();

        foreach ($messages as $message) {
            // Check if message is deleted
            if ($message->is_deleted || $message->deleted_for_all) {
                continue;
            }

            // Check if user has access to the original message
            if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
                continue;
            }

            $forwardedMessage = $targetChat->messages()->create([
                'content' => $message->content,
                'message_type' => $message->message_type,
                'sender_id' => auth()->id(),
                'file_url' => $message->file_url,
                'forwarded_from' => $message->id
            ]);

            $forwardedMessage->load(['user', 'originalMessage.user']);
            $forwardedMessages[] = $forwardedMessage;

            broadcast(new MessageSent($forwardedMessage))->toOthers();
        }

        return response()->json($forwardedMessages, 201);
    }

    /**
     * Reply to a message.
     */
    public function reply(Request $request, Message $message): JsonResponse
    {
        $request->validate([
            'content' => 'required|string',
            'type' => 'required|in:text,image,file,audio',
            'file_url' => 'nullable|url'
        ]);

        if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if message is deleted
        if ($message->is_deleted || $message->deleted_for_all) {
            return response()->json(['message' => 'Cannot reply to deleted message'], 422);
        }

        $reply = $message->chat->messages()->create([
            'content' => $request->content,
            'message_type' => $request->type,
            'sender_id' => auth()->id(),
            'file_url' => $request->file_url,
            'reply_to_id' => $message->id
        ]);

        $reply->load(['user', 'replyTo.user']);

        broadcast(new MessageSent($reply))->toOthers();

        return response()->json(['data' => $reply], 201);
    }

    /**
     * Search messages.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $messages = Message::whereHas('chat.participants', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->where('content', 'like', "%{$request->q}%")
        ->where('deleted_for_all', false)
        ->where(function ($query) {
            $query->where('is_deleted', false)
                  ->orWhereNull('is_deleted');
        })
        ->with(['user', 'chat'])
        ->orderByRaw("LENGTH(content) - LENGTH(REPLACE(LOWER(content), LOWER('{$request->q}'), '')) DESC")
        ->orderBy('created_at', 'desc')
        ->paginate(10);

        return response()->json($messages);
    }

    public function getReplies(Request $request, Message $message): JsonResponse
    {
        if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $replies = $message->replies()->with(['user'])->paginate(10);

        return response()->json($replies);
    }
}