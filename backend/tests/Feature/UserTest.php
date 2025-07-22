<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_users_list()
    {
        // Create test users
        $user1 = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com'
        ]);
        
        $user2 = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com'
        ]);

        $response = $this->actingAs($user1)
            ->getJson('/api/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'status',
                    'is_online',
                    'last_seen'
                ]
            ]
        ]);

        // Should not include the authenticated user
        $response->assertJsonMissing([
            'data' => [
                ['id' => $user1->id]
            ]
        ]);

        // Should include other users
        $response->assertJsonFragment([
            'id' => $user2->id,
            'name' => 'Jane Smith',
            'email' => 'jane@example.com'
        ]);
    }

    public function test_user_can_search_users()
    {
        // Create test users
        $user1 = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com'
        ]);
        
        $user2 = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com'
        ]);

        $user3 = User::factory()->create([
            'name' => 'Bob Johnson',
            'email' => 'bob@example.com'
        ]);

        $response = $this->actingAs($user1)
            ->getJson('/api/users/search?q=Jane');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'status',
                    'is_online',
                    'last_seen'
                ]
            ]
        ]);

        // Should include Jane Smith
        $response->assertJsonFragment([
            'id' => $user2->id,
            'name' => 'Jane Smith',
            'email' => 'jane@example.com'
        ]);

        // Should not include other users
        $response->assertJsonMissing([
            'data' => [
                ['id' => $user3->id]
            ]
        ]);
    }
} 