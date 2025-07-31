<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Schema(
 *     schema="Chat",
 *     type="object",
 *     required={"id", "type", "created_by"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="type", type="string", enum={"private", "group"}, example="private"),
 *     @OA\Property(property="name", type="string", nullable=true, example="Team Discussion"),
 *     @OA\Property(property="created_by", type="integer", example=1),
 *     @OA\Property(property="avatar", type="string", nullable=true, example="https://example.com/chat-avatar.jpg"),
 *     @OA\Property(property="is_muted", type="boolean", example=false),
 *     @OA\Property(property="muted_until", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="is_pinned", type="boolean", example=false),
 *     @OA\Property(property="last_message", type="object", nullable=true),
 *     @OA\Property(property="participants", type="array", items=@OA\Items(ref="#/components/schemas/User")),
 *     @OA\Property(property="created_at", type="string", format="date-time", example="2024-01-01T00:00:00Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", example="2024-01-01T00:00:00Z")
 * )
 *
 *     @OA\Schema(
 *         schema="ChatCreateRequest",
 *         type="object",
 *         required={"type", "participant_ids"},
 *         @OA\Property(property="type", type="string", enum={"private", "group"}, example="private"),
 *         @OA\Property(property="participant_ids", type="array", items=@OA\Items(type="integer"), example={2, 3}),
 *         @OA\Property(property="name", type="string", nullable=true, example="Team Discussion")
 *     )
 *
 *     @OA\Schema(
 *         schema="MessageCreateRequest",
 *         type="object",
 *         required={"content", "type"},
 *         @OA\Property(property="content", type="string", example="Hello, how are you?"),
 *         @OA\Property(property="type", type="string", enum={"text", "image", "file", "audio"}, example="text"),
 *         @OA\Property(property="file_url", type="string", format="url", nullable=true, example="https://example.com/file.jpg"),
 *         @OA\Property(property="reply_to_id", type="integer", nullable=true, example=null)
 *     )
 *
 * @OA\Schema(
 *     schema="Message",
 *     type="object",
 *     required={"id", "content", "sender_id", "chat_id", "message_type"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="content", type="string", example="Hello, how are you?"),
 *     @OA\Property(property="sender_id", type="integer", example=1),
 *     @OA\Property(property="chat_id", type="integer", example=1),
 *     @OA\Property(property="message_type", type="string", enum={"text", "image", "file", "video", "audio"}, example="text"),
 *     @OA\Property(property="reply_to_id", type="integer", nullable=true, example=null),
 *     @OA\Property(property="forwarded_from", type="integer", nullable=true, example=null),
 *     @OA\Property(property="user", ref="#/components/schemas/User"),
 *     @OA\Property(property="reactions", type="array", items=@OA\Items(type="object")),
 *     @OA\Property(property="created_at", type="string", format="date-time", example="2024-01-01T00:00:00Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", example="2024-01-01T00:00:00Z")
 * )
 */

class ChatController extends Controller
{
    /**
     * @OA\Get(
     *     path="/chats",
     *     summary="Get all chats for the authenticated user",
     *     tags={"Chats"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Chats retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", items=@OA\Items(ref="#/components/schemas/Chat"))
     *         )
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        
        $chats = $user->chats()
            ->wherePivot('is_archived', false)
            ->with(['participants', 'lastMessage.user'])
            ->orderByRaw('chat_participants.is_pinned DESC, updated_at DESC')
            ->get()
            ->map(function ($chat) use ($user) {
                $otherParticipant = $chat->participants
                    ->where('id', '!=', $user->id)
                    ->first();
                
                // Get participant data directly from pivot table
                $participantData = \App\Models\ChatParticipant::where('chat_id', $chat->id)
                    ->where('user_id', $user->id)
                    ->first();
                
                return [
                    'id' => $chat->id,
                    'type' => $chat->type,
                    'name' => $chat->type === 'private' 
                        ? ($otherParticipant ? $otherParticipant->name : 'Unknown User')
                        : ($chat->name ?? 'Unnamed Group'),
                    'created_by' => $chat->created_by,
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

        return response()->json([
            'data' => $chats
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chats",
     *     summary="Create a new chat",
     *     tags={"Chats"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/ChatCreateRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Chat created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Chat")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:private,group',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
            'name' => 'nullable|string|max:255'
        ]);

        $user = Auth::user();
        $participantIds = array_unique(array_merge($request->participant_ids, [$user->id]));

        // For private chats, check if chat already exists
        if ($request->type === 'private' && count($participantIds) === 2) {
            $existingChat = Chat::where('type', 'private')
                ->whereHas('participants', function ($query) use ($participantIds) {
                    $query->whereIn('user_id', $participantIds);
                }, '=', count($participantIds))
                ->first();

            if ($existingChat) {
                return response()->json(['data' => $this->formatChat($existingChat, $user)], 201);
            }
        }

        $chat = Chat::create([
            'type' => $request->type,
            'name' => $request->name,
            'created_by' => $user->id
        ]);

        $chat->participants()->attach($participantIds);

        return response()->json(['data' => $this->formatChat($chat, $user)], 201);
    }

    /**
     * @OA\Get(
     *     path="/chats/{chat}",
     *     summary="Get a specific chat",
     *     tags={"Chats"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="chat",
     *         in="path",
     *         required=true,
     *         description="Chat ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Chat retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Chat")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Chat not found",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function show(Chat $chat): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        $participant = $chat->participants()->where('user_id', $user->id)->first();
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => $this->formatChat($chat, $user)]);
    }

    /**
     * @OA\Get(
     *     path="/chats/{chat}/messages",
     *     summary="Get messages for a specific chat",
     *     tags={"Chats"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="chat",
     *         in="path",
     *         required=true,
     *         description="Chat ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number for pagination",
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Number of items per page",
     *         @OA\Schema(type="integer", default=20)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Messages retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", items=@OA\Items(ref="#/components/schemas/Message")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="per_page", type="integer", example=20),
     *             @OA\Property(property="total", type="integer", example=100),
     *             @OA\Property(property="last_page", type="integer", example=5)
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Chat not found",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function messages(Chat $chat, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = $chat->messages()
            ->where(function ($query) use ($user) {
                $query->where('deleted_for_all', false)
                      ->where(function ($subQuery) use ($user) {
                          $subQuery->where('is_deleted', false)
                                   ->orWhere('sender_id', $user->id);
                      });
            })
            ->with(['user', 'replyTo.user', 'forwardedFrom.user', 'reactions.user'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                $responseData = [
                    'id' => $message->id,
                    'content' => $message->content,
                    'sender_id' => $message->sender_id,
                    'chat_id' => $message->chat_id,
                    'message_type' => $message->message_type,
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'avatar' => $message->user->avatar
                    ],
                    'reactions' => $message->reactions->map(function ($reaction) {
                        return [
                            'id' => $reaction->id,
                            'emoji' => $reaction->emoji,
                            'user_id' => $reaction->user_id,
                            'user' => [
                                'id' => $reaction->user->id,
                                'name' => $reaction->user->name,
                            ]
                        ];
                    }),
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at
                ];

                if ($message->reply_to_id) {
                    $responseData['reply_to_id'] = $message->reply_to_id;
                    $responseData['reply_to'] = [
                        'id' => $message->replyTo->id,
                        'content' => $message->replyTo->content,
                        'sender_id' => $message->replyTo->sender_id,
                        'message_type' => $message->replyTo->message_type,
                        'user' => [
                            'id' => $message->replyTo->user->id,
                            'name' => $message->replyTo->user->name,
                            'avatar' => $message->replyTo->user->avatar
                        ]
                    ];
                }

                if ($message->forwarded_from) {
                    $responseData['forwarded_from'] = $message->forwarded_from;
                    $responseData['original_sender'] = [
                        'id' => $message->forwardedFrom->user->id,
                        'name' => $message->forwardedFrom->user->name
                    ];
                }

                if ($message->file_url) {
                    $responseData['file_url'] = $message->file_url;
                }

                return $responseData;
            });

        return response()->json([
            'data' => $messages
        ]);
    }

    /**
     * Send a message to a chat.
     */
    public function sendMessage(Request $request, Chat $chat): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'reply_to_id' => 'nullable|exists:messages,id',
            'message_type' => 'nullable|in:text,image,file,voice,document,audio'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate reply_to_id if provided
        if ($request->has('reply_to_id')) {
            $replyToMessage = Message::find($request->reply_to_id);
            
            // Check if the message exists and belongs to the same chat
            if (!$replyToMessage || $replyToMessage->chat_id !== $chat->id) {
                return response()->json(['message' => 'Invalid reply message'], 422);
            }
            
            // Check if the message is not deleted
            if ($replyToMessage->is_deleted || $replyToMessage->deleted_for_all) {
                throw ValidationException::withMessages([
                    'reply_to_id' => 'Cannot reply to deleted message.'
                ]);
            }
        }

        $messageData = [
            'content' => $request->content,
            'sender_id' => $user->id,
            'message_type' => $request->message_type ?? 'text'
        ];

        if ($request->has('reply_to_id')) {
            $messageData['reply_to_id'] = $request->reply_to_id;
        }

        if ($request->has('file_url')) {
            $messageData['file_url'] = $request->file_url;
        }

        $message = $chat->messages()->create($messageData);

        // Update chat's last message info
        $chat->update([
            'last_message_content' => $message->content,
            'last_message_sender_id' => $message->sender_id,
            'updated_at' => now()
        ]);

        $message->load(['user', 'replyTo.user', 'reactions.user']);

        // Broadcast the message to other participants
        broadcast(new MessageSent($message))->toOthers();

        $responseData = [
            'id' => $message->id,
            'content' => $message->content,
            'sender_id' => $message->sender_id,
            'chat_id' => $message->chat_id,
            'message_type' => $message->message_type,
            'user' => [
                'id' => $message->user->id,
                'name' => $message->user->name,
                'avatar' => $message->user->avatar
            ],
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at
        ];

        if ($message->reply_to_id) {
            $responseData['reply_to_id'] = $message->reply_to_id;
            $responseData['reply_to'] = [
                'id' => $message->replyTo->id,
                'content' => $message->replyTo->content,
                'sender_id' => $message->replyTo->sender_id,
                'message_type' => $message->replyTo->message_type,
                'user' => [
                    'id' => $message->replyTo->user->id,
                    'name' => $message->replyTo->user->name,
                    'avatar' => $message->replyTo->user->avatar
                ]
            ];
            $responseData['reply_to_message'] = [
                'id' => $message->replyTo->id,
                'content' => $message->replyTo->content,
                'user' => [
                    'id' => $message->replyTo->user->id,
                    'name' => $message->replyTo->user->name,
                ]
            ];
        }

        if ($message->file_url) {
            $responseData['file_url'] = $message->file_url;
        }

        return response()->json(['data' => $responseData], 201);
    }

    /**
     * Format chat data for response.
     */
    private function formatChat(Chat $chat, User $user): array
    {
        $otherParticipant = $chat->participants
            ->where('id', '!=', $user->id)
            ->first();

        // Get participant data directly from pivot table
        $participantData = \App\Models\ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();

        return [
            'id' => $chat->id,
            'type' => $chat->type,
            'name' => $chat->type === 'private' 
                ? $otherParticipant->name 
                : $chat->name,
            'created_by' => $chat->created_by,
            'is_muted' => $participantData ? $participantData->is_muted : false,
            'muted_until' => $participantData ? $participantData->muted_until : null,
            'is_pinned' => $participantData ? $participantData->is_pinned : false,
            'participants' => $chat->participants->map(function ($participant) {
                return [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'email' => $participant->email,
                    'avatar' => $participant->avatar,
                    'is_online' => $participant->is_online,
                    'last_seen' => $participant->last_seen
                ];
            }),
            'created_at' => $chat->created_at,
            'updated_at' => $chat->updated_at
        ];
    }
}