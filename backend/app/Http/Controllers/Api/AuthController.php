<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'Hey there! I am using WhatsApp Clone',
            'is_online' => true,
            'last_seen' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->only(['id', 'name', 'email', 'status', 'bio', 'is_online', 'created_at']),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        $user->update([
            'is_online' => true,
            'last_seen' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $user->only(['id', 'name', 'email', 'status', 'bio', 'is_online', 'last_seen']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online' => false,
            'last_seen' => now(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|max:255',
            'bio' => 'sometimes|string|max:1000',
        ]);

        $user = $request->user();
        $user->update($request->only(['name', 'status', 'bio']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    public function getUsers()
    {
        $users = User::where('id', '!=', auth()->id())
            ->select(['id', 'name', 'email', 'avatar', 'status', 'is_online', 'last_seen'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users
        ]);
    }

    public function searchUsers(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:1'
        ]);

        $query = $request->get('q');
        
        $users = User::where('id', '!=', auth()->id())
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->select(['id', 'name', 'email', 'avatar', 'status', 'is_online', 'last_seen'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users
        ]);
    }
}
