<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * @OA\Schema(
 *     schema="MessageDeleteRequest",
 *     type="object",
 *     required={"delete_type"},
 *     @OA\Property(property="delete_type", type="string", enum={"for_me", "for_everyone"}, example="for_everyone")
 * )
 *
 * @OA\Schema(
 *     schema="MessageForwardRequest",
 *     type="object",
 *     required={"target_chat_id"},
 *     @OA\Property(property="target_chat_id", type="integer", example=2)
 * )
 *
 * @OA\Schema(
 *     schema="MessageForwardMultipleRequest",
 *     type="object",
 *     required={"message_ids", "target_chat_id"},
 *     @OA\Property(property="message_ids", type="array", items=@OA\Items(type="integer"), example={1, 2, 3}),
 *     @OA\Property(property="target_chat_id", type="integer", example=2)
 * )
 */

class MessageController extends Controller
{
    /**
     * Get messages for a chat (legacy endpoint - use ChatController instead)
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
            ->paginate($request->get('per_page', 20));

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
     * Store a new message (legacy endpoint - use ChatController instead)
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
     * @OA\Delete(
     *     path="/messages/{message}",
     *     summary="Delete a message",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         description="Message ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/MessageDeleteRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Message deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Message deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - Only message sender can delete",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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
     * @OA\Post(
     *     path="/messages/{message}/forward",
     *     summary="Forward a message to another chat",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         description="Message ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/MessageForwardRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Message forwarded successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Message"),
     *             @OA\Property(property="original_sender", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="John Doe")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant in the target chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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
     * @OA\Post(
     *     path="/messages/forward-multiple",
     *     summary="Forward multiple messages to another chat",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/MessageForwardMultipleRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Messages forwarded successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", items=@OA\Items(ref="#/components/schemas/Message")),
     *             @OA\Property(property="message", type="string", example="Messages forwarded successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant in the target chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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

        return response()->json([
            'data' => $messages->items(),
            'messages' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'total' => $messages->total()
            ]
        ]);
    }

    /**
     * @OA\Get(
     *     path="/messages/{message}/replies",
     *     summary="Get replies for a message",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         description="Message ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number for pagination",
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Replies retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", items=@OA\Items(ref="#/components/schemas/Message"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Message not found or deleted",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function getReplies(Request $request, Message $message): JsonResponse
    {
        // Check if message is deleted
        if ($message->is_deleted || $message->deleted_for_all) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $replies = $message->replies()
            ->with(['user'])
            ->where('is_deleted', false)
            ->where('deleted_for_all', false)
            ->orderBy('created_at', 'asc')
            ->paginate(10);

        return response()->json($replies);
    }

    /**
     * Show a specific message.
     */
    public function show(Message $message): JsonResponse
    {
        // Check if user is a participant in the chat
        if (!$message->chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if message is deleted for this user
        if ($message->is_deleted || $message->deleted_for_all) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $message->load(['user', 'chat']);

        return response()->json(['data' => $message]);
    }
}