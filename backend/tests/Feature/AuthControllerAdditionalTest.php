<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthControllerAdditionalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_get_users_list()
    {
        $user = User::factory()->create();
        $otherUsers = User::factory()->count(3)->create();

        $response = $this->actingAs($user)
            ->getJson('/api/auth/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'status',
                    'last_seen',
                    'is_online'
                ]
            ]);
    }

    public function test_user_can_search_users()
    {
        $user = User::factory()->create();
        $user1 = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $user2 = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $response = $this->actingAs($user)
            ->getJson('/api/auth/users/search?q=John');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'status',
                    'last_seen',
                    'is_online'
                ]
            ]);

        $response->assertJsonFragment(['name' => 'John Doe']);
        $response->assertJsonMissing(['name' => 'Jane Smith']);
    }

    public function test_search_users_requires_authentication()
    {
        $response = $this->getJson('/api/auth/users/search?q=test');
        $response->assertStatus(401);
    }

    public function test_get_users_list_requires_authentication()
    {
        $response = $this->getJson('/api/auth/users');
        $response->assertStatus(401);
    }

    public function test_search_users_with_empty_query()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->getJson('/api/auth/users/search?q=');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'status',
                    'last_seen',
                    'is_online'
                ]
            ]);
    }
}