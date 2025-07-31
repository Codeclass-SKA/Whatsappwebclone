<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Broadcast;

/**
 * @OA\Schema(
 *     schema="UserStatusUpdateRequest",
 *     type="object",
 *     required={"status", "is_online"},
 *     @OA\Property(property="status", type="string", maxLength=255, example="Available", description="User status message"),
 *     @OA\Property(property="is_online", type="boolean", example=true, description="User online status")
 * )
 *
 * @OA\Schema(
 *     schema="UserSearchRequest",
 *     type="object",
 *     required={"q"},
 *     @OA\Property(property="q", type="string", minLength=2, example="john", description="Search query for name or email")
 * )
 */

class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/users",
     *     summary="Get list of all users (excluding current user)",
     *     tags={"Users"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Users retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="John Doe"),
     *                     @OA\Property(property="email", type="string", example="john@example.com"),
     *                     @OA\Property(property="avatar", type="string", nullable=true, example="https://example.com/avatar.jpg"),
     *                     @OA\Property(property="status", type="string", example="Available"),
     *                     @OA\Property(property="last_seen", type="string", format="date-time", example="2024-01-01T12:00:00Z"),
     *                     @OA\Property(property="is_online", type="boolean", example=true)
     *                 )
     *             )
     *         )
     *     )
     * )
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
     * @OA\Get(
     *     path="/api/users/search",
     *     summary="Search users by name or email",
     *     tags={"Users"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         required=true,
     *         description="Search query (minimum 2 characters)",
     *         @OA\Schema(type="string", minLength=2, example="john")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Users found successfully",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="John Doe"),
     *                     @OA\Property(property="email", type="string", example="john@example.com"),
     *                     @OA\Property(property="avatar", type="string", nullable=true, example="https://example.com/avatar.jpg"),
     *                     @OA\Property(property="status", type="string", example="Available"),
     *                     @OA\Property(property="last_seen", type="string", format="date-time", example="2024-01-01T12:00:00Z"),
     *                     @OA\Property(property="is_online", type="boolean", example=true)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Search query too short",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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
     * @OA\Post(
     *     path="/api/users/status",
     *     summary="Update user online status and status message",
     *     tags={"Users"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/UserStatusUpdateRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status updated successfully",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="message", type="string", example="Status updated successfully"),
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="John Doe"),
     *                 @OA\Property(property="status", type="string", example="Available"),
     *                 @OA\Property(property="is_online", type="boolean", example=true),
     *                 @OA\Property(property="last_seen", type="string", format="date-time", example="2024-01-01T12:00:00Z")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error - Invalid status format",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
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

        // Broadcast user online status change
        broadcast(new \App\Events\UserOnlineStatus($user, $request->is_online))->toOthers();

        return response()->json([
            'message' => 'Status updated successfully',
            'user' => $user
        ]);
    }
}