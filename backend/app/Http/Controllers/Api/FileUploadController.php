<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Schema(
 *     schema="FileUploadRequest",
 *     type="object",
 *     required={"file", "type", "chat_id"},
 *     @OA\Property(
 *         property="file",
 *         type="string",
 *         format="binary",
 *         description="The file to upload (max 5MB)"
 *     ),
 *     @OA\Property(
 *         property="type",
 *         type="string",
 *         enum={"image", "document", "audio"},
 *         description="Type of file being uploaded"
 *     ),
 *     @OA\Property(
 *         property="chat_id",
 *         type="integer",
 *         description="ID of the chat where the file will be sent"
 *     )
 * )
 */

/**
 * @OA\Schema(
 *     schema="FileUploadRequest",
 *     type="object",
 *     required={"file", "type", "chat_id"},
 *     @OA\Property(property="file", type="string", format="binary", description="The file to upload (max 5MB)"),
 *     @OA\Property(property="type", type="string", enum={"image", "document", "audio"}, description="Type of file being uploaded"),
 *     @OA\Property(property="chat_id", type="integer", description="ID of the chat to upload the file to")
 * )
 *
 * @OA\Schema(
 *     schema="FileUploadResponse",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="content", type="string", example="document.pdf"),
 *     @OA\Property(property="user_id", type="integer", example=123),
 *     @OA\Property(property="chat_id", type="integer", example=456),
 *     @OA\Property(property="message_type", type="string", enum={"image", "document", "audio"}, example="document"),
 *     @OA\Property(property="file_url", type="string", format="uri", example="https://example.com/storage/uploads/documents/document.pdf"),
 *     @OA\Property(property="file_name", type="string", example="document.pdf"),
 *     @OA\Property(property="file_size", type="integer", example=1024000),
 *     @OA\Property(property="user", type="object",
 *         @OA\Property(property="id", type="integer", example=123),
 *         @OA\Property(property="name", type="string", example="John Doe"),
 *         @OA\Property(property="avatar", type="string", example="https://example.com/avatar.jpg")
 *     ),
 *     @OA\Property(property="created_at", type="string", format="date-time", example="2024-01-01T12:00:00Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", example="2024-01-01T12:00:00Z")
 * )
 */

class FileUploadController extends Controller
{
    /**
     * Upload a file to a chat.
     *
     * @OA\Post(
     *     path="/api/files/upload",
     *     summary="Upload a file to a chat",
     *     tags={"Files"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(ref="#/components/schemas/FileUploadRequest")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="File uploaded successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", ref="#/components/schemas/FileUploadResponse")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid file type, size, or format",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:5120', // 5MB max
            'type' => 'required|in:image,document,audio',
            'chat_id' => 'required|exists:chats,id'
        ]);

        $user = Auth::user();
        $chat = Chat::findOrFail($request->chat_id);
        
        // Check if user is participant of this chat
        if (!$chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $request->file('file');
        $type = $request->input('type');
        
        // Validate file type based on type parameter
        $this->validateFileType($file, $type);

        // Store file
        $path = $file->store("uploads/{$type}s", 'public');
        $fileUrl = Storage::disk('public')->url($path);

        // Create message
        $message = $chat->messages()->create([
            'content' => $file->getClientOriginalName(),
            'sender_id' => $user->id,
            'message_type' => $type,
            'file_url' => $fileUrl,
        ]);

        $message->load('user');

        return response()->json([
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'user_id' => $message->sender_id,
                'chat_id' => $message->chat_id,
                'message_type' => $message->message_type,
                'file_url' => $message->file_url,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'avatar' => $message->user->avatar
                ],
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at
            ]
        ], 201);
    }

    /**
     * Download a file from a message.
     *
     * @OA\Get(
     *     path="/api/files/download/{message}",
     *     summary="Download a file from a message",
     *     tags={"Files"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="Message ID containing the file"
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="File downloaded successfully",
     *         @OA\Header(
     *             header="Content-Disposition",
     *             description="Attachment with filename",
     *             @OA\Schema(type="string", example="attachment; filename='document.pdf'")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - User is not a participant of the chat",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="File not found",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function download(Message $message): mixed
    {
        $user = Auth::user();
        
        // Check if user is participant of the chat
        if (!$message->chat->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$message->file_url) {
            return response()->json(['message' => 'File not found'], 404);
        }

        // Extract file path from URL
        $filePath = str_replace('/storage/', '', $message->file_url);
        $fullPath = Storage::disk('public')->path($filePath);

        if (!Storage::disk('public')->exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($fullPath, $message->content);
    }

    /**
     * Validate file type based on type parameter.
     */
    private function validateFileType($file, string $type): void
    {
        $allowedMimes = [
            'image' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'document' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            'audio' => ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
        ];

        if (!isset($allowedMimes[$type])) {
            throw ValidationException::withMessages([
                'type' => 'Invalid file type specified.'
            ]);
        }

        if (!in_array($file->getMimeType(), $allowedMimes[$type])) {
            throw ValidationException::withMessages([
                'file' => "File type not allowed for {$type} uploads."
            ]);
        }
    }
}