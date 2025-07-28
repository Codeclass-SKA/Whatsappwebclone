<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test */
    public function authenticated_user_can_get_their_chats()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$user->id, $otherUser->id]);
        
        Sanctum::actingAs($user);

        // Act
        $response = $this->getJson('/api/chats');

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'name',
                        'last_message',
                        'participants',
                        'created_at',
                        'updated_at'
                    ]
                ]
            ]);
    }

    /** @test */
    public function authenticated_user_can_create_new_private_chat()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        Sanctum::actingAs($user);

        $chatData = [
            'type' => 'private',
            'participant_ids' => [$otherUser->id]
        ];

        // Act
        $response = $this->postJson('/api/chats', $chatData);

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'name',
                    'participants',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'type' => 'private'
        ]);

        $this->assertDatabaseHas('chat_participants', [
            'user_id' => $user->id,
            'chat_id' => $response->json('data.id')
        ]);

        $this->assertDatabaseHas('chat_participants', [
            'user_id' => $otherUser->id,
            'chat_id' => $response->json('data.id')
        ]);
    }

    /** @test */
    public function authenticated_user_can_get_messages_from_chat()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$user->id, $otherUser->id]);
        
        $message1 = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Hello there!'
        ]);
        
        $message2 = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $otherUser->id,
            'content' => 'Hi! How are you?'
        ]);
        
        Sanctum::actingAs($user);

        // Act
        $response = $this->getJson("/api/chats/{$chat->id}/messages");

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'content',
                        'sender_id',
                        'chat_id',
                        'message_type',
                        'user',
                        'created_at',
                        'updated_at'
                    ]
                ]
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    /** @test */
    public function authenticated_user_can_send_message_to_chat()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$user->id, $otherUser->id]);
        
        Sanctum::actingAs($user);

        $messageData = [
            'content' => 'Hello! This is a test message.',
            'type' => 'text'
        ];

        // Act
        $response = $this->postJson("/api/chats/{$chat->id}/messages", $messageData);

        // Assert
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'sender_id',
                    'chat_id',
                    'message_type',
                    'user',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'content' => 'Hello! This is a test message.',
            'sender_id' => $user->id,
            'chat_id' => $chat->id
        ]);
    }

    /** @test */
    public function user_cannot_send_message_to_chat_they_are_not_participant_of()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$otherUser->id]);
        
        Sanctum::actingAs($user);

        $messageData = [
            'content' => 'This should fail'
        ];

        // Act
        $response = $this->postJson("/api/chats/{$chat->id}/messages", $messageData);

        // Assert
        $response->assertStatus(403);
    }

    /** @test */
    public function user_cannot_get_messages_from_chat_they_are_not_participant_of()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$otherUser->id]);
        
        Sanctum::actingAs($user);

        // Act
        $response = $this->getJson("/api/chats/{$chat->id}/messages");

        // Assert
        $response->assertStatus(403);
    }

    /** @test */
    public function message_content_cannot_be_empty()
    {
        // Arrange
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach([$user->id, $otherUser->id]);
        
        Sanctum::actingAs($user);

        $messageData = [
            'content' => ''
        ];

        // Act
        $response = $this->postJson("/api/chats/{$chat->id}/messages", $messageData);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    /** @test */
    public function chat_participants_are_required_for_private_chat()
    {
        // Arrange
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $chatData = [
            'type' => 'private',
            'participant_ids' => []
        ];

        // Act
        $response = $this->postJson('/api/chats', $chatData);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['participant_ids']);
    }
} 