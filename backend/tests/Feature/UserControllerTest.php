<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_get_users_list()
    {
        $otherUsers = User::factory()->count(3)->create();
        
        $response = $this->actingAs($this->user)
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                        'is_online'
                    ]
                ]
            ]);

        // Should not include current user
        $response->assertJsonMissing(['id' => $this->user->id]);
        
        // Should include other users
        foreach ($otherUsers as $user) {
            $response->assertJsonFragment(['id' => $user->id]);
        }
    }

    public function test_user_can_search_users_by_name()
    {
        $user1 = User::factory()->create(['name' => 'John Doe']);
        $user2 = User::factory()->create(['name' => 'Jane Smith']);
        
        $response = $this->actingAs($this->user)
            ->getJson('/api/users/search?q=John');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                        'is_online'
                    ]
                ]
            ]);

        $response->assertJsonFragment(['name' => 'John Doe']);
        $response->assertJsonMissing(['name' => 'Jane Smith']);
    }

    public function test_user_can_search_users_by_email()
    {
        $user1 = User::factory()->create(['email' => 'john@example.com']);
        $user2 = User::factory()->create(['email' => 'jane@example.com']);
        
        $response = $this->actingAs($this->user)
            ->getJson('/api/users/search?q=john@example');

        $response->assertStatus(200)
            ->assertJsonFragment(['email' => 'john@example.com']);
        $response->assertJsonMissing(['email' => 'jane@example.com']);
    }

    public function test_search_requires_minimum_length()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/users/search?q=a');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_user_can_update_status()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 'Available for chat',
                'is_online' => true
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Status updated successfully'
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'status' => 'Available for chat',
            'is_online' => true
        ]);
    }

    public function test_update_status_requires_status_field()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'is_online' => true
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_status_requires_is_online_field()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 'Available'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_online']);
    }

    public function test_update_status_requires_authentication()
    {
        $response = $this->postJson('/api/users/status', [
            'status' => 'Available',
            'is_online' => true
        ]);

        $response->assertStatus(401);
    }

    public function test_users_list_requires_authentication()
    {
        $response = $this->getJson('/api/users');
        $response->assertStatus(401);
    }

    public function test_search_users_requires_authentication()
    {
        $response = $this->getJson('/api/users/search?q=test');
        $response->assertStatus(401);
    }
}