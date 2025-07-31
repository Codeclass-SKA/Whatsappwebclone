<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatParticipantRemoveTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $chat;
    protected $participant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->participant = User::factory()->create();
        $this->chat = Chat::factory()->create([
            'type' => 'group',
            'created_by' => $this->user->id,
        ]);
        
        $this->chat->participants()->attach([$this->user->id, $this->participant->id]);
    }

    public function test_user_can_remove_single_participant_from_chat()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$this->participant->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Participant removed successfully']);

        $this->assertDatabaseMissing('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->participant->id
        ]);
    }

    public function test_user_cannot_remove_participant_from_unauthorized_chat()
    {
        $unauthorizedUser = User::factory()->create();
        
        $response = $this->actingAs($unauthorizedUser)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$this->participant->id}");

        $response->assertStatus(403);
    }

    public function test_user_cannot_remove_non_participant()
    {
        $nonParticipant = User::factory()->create();
        
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$nonParticipant->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_remove_participant_from_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson('/api/chats/99999/participants/1');

        $response->assertStatus(404);
    }

    public function test_user_cannot_remove_participant_requires_authentication()
    {
        $response = $this->deleteJson("/api/chats/{$this->chat->id}/participants/{$this->participant->id}");
        $response->assertStatus(401);
    }

    public function test_user_cannot_remove_themselves_as_participant()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/participants/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Participant removed successfully']);

        $this->assertDatabaseMissing('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id
        ]);
    }
}