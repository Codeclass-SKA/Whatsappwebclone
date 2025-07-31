<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class ChatParticipantControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $chat;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->chat = Chat::factory()->create([
            'type' => 'group',
            'created_by' => $this->user->id,
        ]);
        
        $this->chat->participants()->attach([$this->user->id, $this->otherUser->id]);
    }

    public function test_user_can_add_participants_to_chat()
    {
        $newUser = User::factory()->create();
        
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => [$newUser->id]
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Participants added successfully'
            ]);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $newUser->id
        ]);
    }

    public function test_user_cannot_add_participants_to_unauthorized_chat()
    {
        $unauthorizedUser = User::factory()->create();
        $newUser = User::factory()->create();
        
        $response = $this->actingAs($unauthorizedUser)
            ->postJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => [$newUser->id]
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_remove_participants_from_chat()
    {
        $participantToRemove = User::factory()->create();
        $this->chat->participants()->attach($participantToRemove->id);
        
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => [$participantToRemove->id]
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Participants removed successfully'
            ]);

        $this->assertDatabaseMissing('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $participantToRemove->id
        ]);
    }

    public function test_user_cannot_remove_participants_from_unauthorized_chat()
    {
        $unauthorizedUser = User::factory()->create();
        $participantToRemove = User::factory()->create();
        $this->chat->participants()->attach($participantToRemove->id);
        
        $response = $this->actingAs($unauthorizedUser)
            ->deleteJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => [$participantToRemove->id]
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_remove_single_participant()
    {
        $participantToRemove = User::factory()->create();
        $this->chat->participants()->attach($participantToRemove->id);
        
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$participantToRemove->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Participant removed successfully'
            ]);

        $this->assertDatabaseMissing('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $participantToRemove->id
        ]);
    }

    public function test_user_cannot_remove_non_participant()
    {
        $nonParticipant = User::factory()->create();
        
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$nonParticipant->id}");

        $response->assertStatus(404);
    }

    public function test_add_participants_requires_user_ids_validation()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => 'not-an-array'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_ids']);
    }

    public function test_add_participants_requires_existing_users_validation()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => [99999]
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_ids.0']);
    }

    public function test_remove_participants_requires_user_ids_validation()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants", [
                'user_ids' => 'not-an-array'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_ids']);
    }
}