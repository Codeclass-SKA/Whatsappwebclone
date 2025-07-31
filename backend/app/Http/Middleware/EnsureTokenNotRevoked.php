<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class EnsureTokenNotRevoked
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $bearerToken = $request->bearerToken();
        
        if ($bearerToken) {
            // Check if token exists in database
            $token = null;
            
            if (strpos($bearerToken, '|') !== false) {
                [$id, $tokenValue] = explode('|', $bearerToken, 2);
                $token = PersonalAccessToken::find($id);
            } else {
                $hashedToken = hash('sha256', $bearerToken);
                $token = PersonalAccessToken::where('token', $hashedToken)->first();
            }
            
            // If token doesn't exist, it's been revoked
            if (!$token) {
                return response()->json(['message' => 'Token has been revoked'], 401);
            }
        }
        
        return $next($request);
    }
}