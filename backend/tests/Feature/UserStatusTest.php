<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserStatusTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_update_status_and_online_status()
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

    public function test_user_can_update_status_to_offline()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 'Away',
                'is_online' => false
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Status updated successfully'
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'status' => 'Away',
            'is_online' => false
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
                'status' => 'Test status'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_online']);
    }

    public function test_update_status_requires_boolean_is_online()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 'Test status',
                'is_online' => 'invalid'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_online']);
    }

    public function test_update_status_requires_string_status()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 123,
                'is_online' => true
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_status_requires_authentication()
    {
        $response = $this->postJson('/api/users/status', [
            'status' => 'Test status',
            'is_online' => true
        ]);

        $response->assertStatus(401);
    }

    public function test_update_status_updates_last_seen_timestamp()
    {
        // Set a specific old timestamp to ensure it changes
        $this->user->update(['last_seen' => now()->subMinutes(5)]);
        $originalLastSeen = $this->user->last_seen;

        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => 'Online',
                'is_online' => true
            ]);

        $response->assertStatus(200);
        
        $this->user->refresh();
        $this->assertNotEquals($originalLastSeen, $this->user->last_seen);
        $this->assertEqualsWithDelta(now()->timestamp, $this->user->last_seen->timestamp, 2);
    }

    public function test_update_status_with_empty_status()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => '',
                'is_online' => true
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_status_with_long_status()
    {
        $longStatus = str_repeat('a', 256);
        
        $response = $this->actingAs($this->user)
            ->postJson('/api/users/status', [
                'status' => $longStatus,
                'is_online' => true
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }
}