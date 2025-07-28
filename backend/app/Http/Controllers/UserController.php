<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Get list of users.
     */
    public function index(): JsonResponse
    {
        $users = User::where('id', '!=', auth()->id())
            ->select(['id', 'name', 'email', 'avatar', 'status', 'last_seen', 'is_online'])
            ->get();

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * Search users.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $users = User::where('id', '!=', auth()->id())
            ->where(function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->q}%")
                    ->orWhere('email', 'like', "%{$request->q}%");
            })
            ->select(['id', 'name', 'email', 'avatar', 'status', 'last_seen', 'is_online'])
            ->get();

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * Update user status.
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|max:255',
            'is_online' => 'required|boolean'
        ]);

        $user = auth()->user();
        $user->update([
            'status' => $request->status,
            'is_online' => $request->is_online,
            'last_seen' => now()
        ]);

        broadcast(new UserOnlineStatus($user, $request->is_online))->toOthers();

        return response()->json([
            'message' => 'Status updated successfully',
            'user' => $user
        ]);
    }
}