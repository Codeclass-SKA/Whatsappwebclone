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

class FileUploadController extends Controller
{
    /**
     * Upload a file to a chat.
     */
    public function upload(Request $request, Chat $chat): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:5120', // 5MB max
            'type' => 'required|in:image,document,audio'
        ]);

        $user = Auth::user();
        
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