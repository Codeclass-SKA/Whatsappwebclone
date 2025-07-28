<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use App\Models\MessageReaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;

class TDDComprehensiveTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * TDD: User Authentication Tests
     */
    public function test_user_can_register_successfully()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                        'created_at',
                        'updated_at'
                    ],
                    'token',
                    'message'
                ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }

    public function test_user_cannot_register_with_invalid_email()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    public function test_user_cannot_register_with_weak_password()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
    }

    public function test_user_can_login_successfully()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                    ],
                    'token',
                    'message'
                ]);
    }

    public function test_user_cannot_login_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ];

        $response = $this->postJson('/api/auth/login', $loginData);

        $response->assertStatus(401)
                ->assertJson(['message' => 'Invalid credentials']);
    }

    public function test_user_can_logout_successfully()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(200)
                ->assertJson(['message' => 'Logged out successfully']);
    }

    public function test_user_can_get_profile()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/auth/profile');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                    ]
                ]);
    }

    public function test_user_can_update_profile()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $updateData = [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ];

        $response = $this->putJson('/api/auth/profile', $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'status',
                        'last_seen',
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    }

    /**
     * TDD: Chat Management Tests
     */
    public function test_user_can_create_private_chat()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        Sanctum::actingAs($user1);

        $chatData = [
            'type' => 'private',
            'participant_ids' => [$user2->id],
        ];

        $response = $this->postJson('/api/chats', $chatData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'chat' => [
                        'id',
                        'name',
                        'type',
                        'created_by',
                        'created_at',
                        'updated_at',
                        'participants'
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('chats', [
            'type' => 'private',
            'created_by' => $user1->id,
        ]);
    }

    public function test_user_can_create_group_chat()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();
        Sanctum::actingAs($user1);

        $chatData = [
            'name' => 'Test Group',
            'type' => 'group',
            'participant_ids' => [$user2->id, $user3->id],
        ];

        $response = $this->postJson('/api/chats', $chatData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'chat' => [
                        'id',
                        'name',
                        'type',
                        'created_by',
                        'created_at',
                        'updated_at',
                        'participants'
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('chats', [
            'name' => 'Test Group',
            'type' => 'group',
            'created_by' => $user1->id,
        ]);
    }

    public function test_user_can_get_chats_list()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);

        $response = $this->getJson('/api/chats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'chats' => [
                        '*' => [
                            'id',
                            'name',
                            'type',
                            'last_message',
                            'unread_count',
                            'participants',
                            'created_at',
                            'updated_at',
                        ]
                    ]
                ]);
    }

    public function test_user_can_get_specific_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'chat' => [
                        'id',
                        'name',
                        'type',
                        'created_by',
                        'participants',
                        'messages',
                        'created_at',
                        'updated_at',
                    ]
                ]);
    }

    public function test_user_cannot_access_unauthorized_chat()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user2->id]);
        Sanctum::actingAs($user1);

        $response = $this->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(403);
    }

    /**
     * TDD: Message Management Tests
     */
    public function test_user_can_send_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $messageData = [
            'content' => 'Hello, this is a test message',
        ];

        $response = $this->postJson("/api/chats/{$chat->id}/messages", $messageData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message' => [
                        'id',
                        'content',
                        'sender_id',
                        'chat_id',
                        'created_at',
                        'updated_at',
                        'sender'
                    ],
                    'message_text'
                ]);

        $this->assertDatabaseHas('messages', [
            'content' => 'Hello, this is a test message',
            'sender_id' => $user->id,
            'chat_id' => $chat->id,
        ]);
    }

    public function test_user_cannot_send_empty_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        Sanctum::actingAs($user);

        $messageData = [
            'content' => '',
        ];

        $response = $this->postJson("/api/chats/{$chat->id}/messages", $messageData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['content']);
    }

    public function test_user_can_get_chat_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
        Message::factory()->count(5)->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/chats/{$chat->id}/messages");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'messages' => [
                        '*' => [
                            'id',
                            'content',
                            'sender_id',
                            'chat_id',
                            'created_at',
                            'updated_at',
                            'sender',
                            'reactions'
                        ]
                    ],
                    'pagination'
                ]);
    }

    public function test_user_can_delete_own_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/messages/{$message->id}");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Message deleted successfully']);

        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    }

    public function test_user_cannot_delete_others_message()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user1->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user2->id,
        ]);
        Sanctum::actingAs($user1);

        $response = $this->deleteJson("/api/messages/{$message->id}");

        $response->assertStatus(403);
    }

    /**
     * TDD: Message Reactions Tests
     */
    public function test_user_can_add_reaction_to_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $reactionData = [
            'emoji' => '👍',
        ];

        $response = $this->postJson("/api/messages/{$message->id}/reactions", $reactionData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'reaction' => [
                        'id',
                        'emoji',
                        'user_id',
                        'message_id',
                        'created_at',
                        'updated_at',
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('message_reactions', [
            'emoji' => '👍',
            'user_id' => $user->id,
            'message_id' => $message->id,
        ]);
    }

    public function test_user_can_remove_reaction_from_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);
        $reaction = MessageReaction::factory()->create([
            'emoji' => '👍',
            'user_id' => $user->id,
            'message_id' => $message->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/messages/{$message->id}/reactions/{$reaction->id}");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Reaction removed successfully']);

        $this->assertDatabaseMissing('message_reactions', ['id' => $reaction->id]);
    }

    /**
     * TDD: Chat Management Features Tests
     */
    public function test_user_can_archive_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/chats/{$chat->id}/archive");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Chat archived successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_archived' => true,
        ]);
    }

    public function test_user_can_mute_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/chats/{$chat->id}/mute");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Chat muted successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_muted' => true,
        ]);
    }

    public function test_user_can_pin_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/chats/{$chat->id}/pin");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Chat pinned successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_pinned' => true,
        ]);
    }

    /**
     * TDD: Message Search Tests
     */
    public function test_user_can_search_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Hello world test message',
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/messages/search?q=test");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'messages' => [
                        '*' => [
                            'id',
                            'content',
                            'sender_id',
                            'chat_id',
                            'created_at',
                            'sender'
                        ]
                    ]
                ]);
    }

    /**
     * TDD: Error Handling Tests
     */
    public function test_returns_404_for_nonexistent_chat()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/chats/99999');

        $response->assertStatus(404);
    }

    public function test_returns_404_for_nonexistent_message()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/messages/99999');

        $response->assertStatus(404);
    }

    public function test_returns_422_for_invalid_data()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/chats', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['type']);
    }

    /**
     * TDD: Performance Tests
     */
    public function test_chat_list_loads_within_acceptable_time()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Create multiple chats
        for ($i = 0; $i < 10; $i++) {
            $chat = Chat::factory()->create(['created_by' => $user->id]);
            ChatParticipant::factory()->create([
                'chat_id' => $chat->id,
                'user_id' => $user->id,
            ]);
        }

        $startTime = microtime(true);
        $response = $this->getJson('/api/chats');
        $endTime = microtime(true);

        $response->assertStatus(200);
        
        $executionTime = $endTime - $startTime;
        $this->assertLessThan(1.0, $executionTime, 'Chat list should load within 1 second');
    }

    public function test_message_list_loads_within_acceptable_time()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);
        ChatParticipant::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);

        // Create multiple messages
        Message::factory()->count(50)->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $startTime = microtime(true);
        $response = $this->getJson("/api/chats/{$chat->id}/messages");
        $endTime = microtime(true);

        $response->assertStatus(200);
        
        $executionTime = $endTime - $startTime;
        $this->assertLessThan(1.0, $executionTime, 'Message list should load within 1 second');
    }
} 