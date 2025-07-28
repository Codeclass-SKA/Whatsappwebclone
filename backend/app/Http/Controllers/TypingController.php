<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Events\UserTyping;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TypingController extends Controller
{
    /**
     * Start typing indicator.
     */
    public function start(Request $request, Chat $chat): JsonResponse
    {
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        broadcast(new UserTyping(auth()->user(), $chat->id, true))->toOthers();

        return response()->json(['message' => 'Typing indicator sent']);
    }

    /**
     * Stop typing indicator.
     */
    public function stop(Request $request, Chat $chat): JsonResponse
    {
        if (!$chat->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        broadcast(new UserTyping(auth()->user(), $chat->id, false))->toOthers();

        return response()->json(['message' => 'Typing indicator stopped']);
    }
}