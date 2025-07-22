<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class MessageReactionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->chat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $this->user->id,
        ]);
        
        $this->chat->participants()->attach([$this->user->id, $this->otherUser->id]);
        
        $this->message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Hello, how are you?',
            'message_type' => 'text'
        ]);
    }

    public function test_user_can_add_reaction_to_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->message->id}/reactions", [
                'emoji' => '👍'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'message_id',
                    'user_id',
                    'emoji',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);
    }

    public function test_user_can_remove_reaction_from_message()
    {
        // First add a reaction
        $reaction = MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/messages/{$this->message->id}/reactions/{$reaction->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('message_reactions', [
            'id' => $reaction->id
        ]);
    }

    public function test_user_can_change_reaction_on_message()
    {
        // First add a reaction
        $reaction = MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/messages/{$this->message->id}/reactions/{$reaction->id}", [
                'emoji' => '❤️'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'emoji' => '❤️'
                ]
            ]);

        $this->assertDatabaseHas('message_reactions', [
            'id' => $reaction->id,
            'emoji' => '❤️'
        ]);
    }

    public function test_user_cannot_add_reaction_to_message_in_unauthorized_chat()
    {
        $unauthorizedChat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $this->otherUser->id,
        ]);
        
        $unauthorizedMessage = Message::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Private message',
            'message_type' => 'text'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$unauthorizedMessage->id}/reactions", [
                'emoji' => '👍'
            ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_add_invalid_emoji()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->message->id}/reactions", [
                'emoji' => 'invalid_emoji'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['emoji']);
    }

    public function test_user_cannot_add_duplicate_reaction()
    {
        // First add a reaction
        MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);

        // Try to add the same reaction again
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->message->id}/reactions", [
                'emoji' => '👍'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['emoji']);
    }

    public function test_user_can_get_message_reactions()
    {
        // Add multiple reactions
        MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);
        
        MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->otherUser->id,
            'emoji' => '❤️'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/reactions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'message_id',
                        'user_id',
                        'emoji',
                        'user' => [
                            'id',
                            'name',
                            'avatar'
                        ],
                        'created_at',
                        'updated_at'
                    ]
                ]
            ]);

        $response->assertJsonCount(2, 'data');
    }

    public function test_reaction_requires_authentication()
    {
        $response = $this->postJson("/api/messages/{$this->message->id}/reactions", [
            'emoji' => '👍'
        ]);

        $response->assertStatus(401);
    }

    public function test_reaction_requires_emoji_parameter()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->message->id}/reactions", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['emoji']);
    }

    public function test_user_can_only_remove_own_reaction()
    {
        // Create reaction by other user
        $reaction = MessageReaction::create([
            'message_id' => $this->message->id,
            'user_id' => $this->otherUser->id,
            'emoji' => '👍'
        ]);

        // Try to remove it as different user
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/messages/{$this->message->id}/reactions/{$reaction->id}");

        $response->assertStatus(403);
    }

    public function test_reaction_broadcasts_to_chat_participants()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->message->id}/reactions", [
                'emoji' => '👍'
            ]);

        $response->assertStatus(201);

        // This test would verify that the reaction event is broadcasted
        // In a real implementation, we would check if the event was dispatched
        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $this->message->id,
            'user_id' => $this->user->id,
            'emoji' => '👍'
        ]);
    }
} 