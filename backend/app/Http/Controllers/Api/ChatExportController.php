<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ChatExportController extends Controller
{
    /**
     * Export chat history
     */
    public function export(Request $request, Chat $chat): JsonResponse|Response
    {
        // Validate request
        $request->validate([
            'format' => 'required|in:json,csv,txt',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'per_page' => 'nullable|integer|min:1|max:1000'
        ]);

        $user = Auth::user();
        
        // Check if user is participant of the chat
        $participant = ChatParticipant::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->first();
            
        if (!$participant) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $format = $request->input('format');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $perPage = $request->input('per_page', 100);

        // Get messages query
        $messagesQuery = Message::where('chat_id', $chat->id)
            ->where('is_deleted', false)
            ->where('deleted_for_all', false)
            ->with(['user', 'replyTo.user'])
            ->orderBy('created_at', 'asc');

        // Apply date filters
        if ($startDate) {
            $messagesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $messagesQuery->whereDate('created_at', '<=', $endDate);
        }

        // Get messages
        $messages = $messagesQuery->paginate($perPage);

        // Format messages
        $formattedMessages = $messages->getCollection()->map(function ($message) {
            return [
                'id' => $message->id,
                'content' => $message->content,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->user->name,
                'message_type' => $message->message_type,
                'file_url' => $message->file_url,
                'reply_to_id' => $message->reply_to_id,
                'reply_to_content' => $message->replyTo ? $message->replyTo->content : null,
                'created_at' => $message->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $message->updated_at->format('Y-m-d H:i:s')
            ];
        });

        // Chat info
        $chatInfo = [
            'id' => $chat->id,
            'type' => $chat->type,
            'name' => $chat->name,
            'created_at' => $chat->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $chat->updated_at->format('Y-m-d H:i:s')
        ];

        // Return based on format
        switch ($format) {
            case 'json':
                return response()->json([
                    'chat_info' => $chatInfo,
                    'messages' => $formattedMessages,
                    'pagination' => [
                        'current_page' => $messages->currentPage(),
                        'last_page' => $messages->lastPage(),
                        'per_page' => $messages->perPage(),
                        'total' => $messages->total(),
                        'from' => $messages->firstItem(),
                        'to' => $messages->lastItem()
                    ]
                ]);

            case 'csv':
                return $this->generateCsv($chatInfo, $formattedMessages);

            case 'txt':
                return $this->generateTxt($chatInfo, $formattedMessages);

            default:
                return response()->json(['message' => 'Invalid format'], 422);
        }
    }

    /**
     * Generate CSV export
     */
    private function generateCsv(array $chatInfo, $messages): Response
    {
        $filename = "chat_export.csv";
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $content = '';
        
        // Chat info header
        $content .= "Chat Information\n";
        $content .= "ID,Type,Name,Created At\n";
        $content .= "{$chatInfo['id']},{$chatInfo['type']}," . ($chatInfo['name'] ?? 'N/A') . ",{$chatInfo['created_at']}\n";
        $content .= "\n"; // Empty line
        
        // Messages header
        $content .= "Messages\n";
        $content .= "Date,Time,Sender,Message,Type,Reply To\n";
        
        foreach ($messages as $message) {
            $date = date('Y-m-d', strtotime($message['created_at']));
            $time = date('H:i:s', strtotime($message['created_at']));
            $replyTo = $message['reply_to_content'] ?? 'N/A';
            
            // Escape commas in content
            $escapedContent = str_replace(',', '\\,', $message['content']);
            $escapedReplyTo = str_replace(',', '\\,', $replyTo);
            
            $content .= "{$date},{$time},{$message['sender_name']},{$escapedContent},{$message['message_type']},{$escapedReplyTo}\n";
        }

        return response($content, 200, $headers);
    }

    /**
     * Generate TXT export
     */
    private function generateTxt(array $chatInfo, $messages): Response
    {
        $filename = "chat_export.txt";
        
        $headers = [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $content = "Chat Export\n";
        $content .= "===========\n\n";
        
        // Chat info
        $content .= "Chat Information:\n";
        $content .= "ID: {$chatInfo['id']}\n";
        $content .= "Type: {$chatInfo['type']}\n";
        $content .= "Name: " . ($chatInfo['name'] ?? 'N/A') . "\n";
        $content .= "Created: {$chatInfo['created_at']}\n\n";
        
        // Messages
        $content .= "Messages:\n";
        $content .= "=========\n\n";
        
        foreach ($messages as $message) {
            $date = date('Y-m-d H:i:s', strtotime($message['created_at']));
            $content .= "[{$date}] {$message['sender_name']}: {$message['content']}\n";
            
            if ($message['reply_to_content']) {
                $content .= "  (Reply to: {$message['reply_to_content']})\n";
            }
            
            if ($message['message_type'] === 'file' && $message['file_url']) {
                $content .= "  (File: {$message['file_url']})\n";
            }
            
            $content .= "\n";
        }

        return response($content, 200, $headers);
    }
}
