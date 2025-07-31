<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TDDComprehensiveTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected User $otherUser;
    protected Chat $chat;
    protected Message $message;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test users
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password123')
        ]);
        
        $this->otherUser = User::factory()->create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'password' => bcrypt('password123')
        ]);
        
        // Create a chat
        $this->chat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $this->user->id
        ]);
        
        // Add participants to the chat
        ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);
        
        ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->otherUser->id,
            'role' => 'member'
        ]);
        
        // Create a message
        $this->message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello, this is a test message',
            'message_type' => 'text'
        ]);
    }

    /**
     * Test user registration with valid data.
     */
    public function test_user_can_register_with_valid_data()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token'
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com'
        ]);
    }

    /**
     * Test user registration with invalid email.
     */
    public function test_user_cannot_register_with_invalid_email()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test user registration with weak password.
     */
    public function test_user_cannot_register_with_weak_password()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => '123',
            'password_confirmation' => '123'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test user login with valid credentials.
     */
    public function test_user_can_login_with_valid_credentials()
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token'
            ]);
    }

    /**
     * Test user login with invalid credentials.
     */
    public function test_user_cannot_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test user logout.
     */
    public function test_user_can_logout()
    {
        // Login to get token
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);
        
        $token = $loginResponse->json('token');

        // Logout using the token
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);

        // Try to use the token after logout - should be unauthorized
        $profileResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/profile');
            
        $profileResponse->assertStatus(401);
    }

    /**
     * Test getting user profile.
     */
    public function test_user_can_get_profile()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/auth/profile');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email
                ]
            ]);
    }

    /**
     * Test updating user profile.
     */
    public function test_user_can_update_profile()
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/auth/profile', [
                'name' => 'Updated Name',
                'status' => 'New status message'
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Updated Name',
            'status' => 'New status message'
        ]);
    }

    /**
     * Test creating a private chat.
     */
    public function test_user_can_create_private_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/chats', [
                'type' => 'private',
                'participant_ids' => [$this->otherUser->id]
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'created_by',
                    'participants' => [
                        '*' => ['id', 'name', 'email']
                    ]
                ]
            ]);

        $chatId = $response->json('data.id');
        $this->assertDatabaseHas('chats', ['id' => $chatId, 'type' => 'private']);
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chatId,
            'user_id' => $this->user->id
        ]);
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chatId,
            'user_id' => $this->otherUser->id
        ]);
    }

    /**
     * Test creating a group chat.
     */
    public function test_user_can_create_group_chat()
    {
        $thirdUser = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson('/api/chats', [
                'type' => 'group',
                'name' => 'Test Group',
                'participant_ids' => [$this->otherUser->id, $thirdUser->id]
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'name',
                    'created_by',
                    'participants' => [
                        '*' => ['id', 'name', 'email']
                    ]
                ]
            ]);

        $chatId = $response->json('data.id');
        $this->assertDatabaseHas('chats', [
            'id' => $chatId,
            'type' => 'group',
            'name' => 'Test Group'
        ]);
        
        // Check that all users are participants
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chatId,
            'user_id' => $this->user->id
        ]);
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chatId,
            'user_id' => $this->otherUser->id
        ]);
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chatId,
            'user_id' => $thirdUser->id
        ]);
    }

    /**
     * Test getting chat list.
     */
    public function test_user_can_get_chat_list()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/chats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'type',
                        'name',
                        'created_by',
                        'participants'
                    ]
                ]
            ]);
    }

    /**
     * Test getting a specific chat.
     */
    public function test_user_can_get_specific_chat()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'created_by',
                    'participants' => [
                        '*' => ['id', 'name', 'email']
                    ]
                ]
            ]);
    }

    /**
     * Test unauthorized access to a chat.
     */
    public function test_user_cannot_access_unauthorized_chat()
    {
        $unauthorizedUser = User::factory()->create();
        $response = $this->actingAs($unauthorizedUser)
            ->getJson("/api/chats/{$this->chat->id}");

        $response->assertStatus(403);
    }

    /**
     * Test sending a message to a chat.
     */
    public function test_user_can_send_message_to_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Hello, this is a new message',
                'type' => 'text'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'sender_id',
                    'chat_id',
                    'message_type',
                    'created_at'
                ]
            ]);

        $messageId = $response->json('data.id');
        $this->assertDatabaseHas('messages', [
            'id' => $messageId,
            'content' => 'Hello, this is a new message',
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id
        ]);
    }

    /**
     * Test sending an empty message.
     */
    public function test_user_cannot_send_empty_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => '',
                'type' => 'text'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    /**
     * Test getting messages for a chat.
     */
    public function test_user_can_get_chat_messages()
    {
        // Create multiple messages
        Message::factory()->count(5)->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'message_type' => 'text'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total'
                ],
                'links' => [
                    'first',
                    'last',
                    'prev',
                    'next'
                ]
            ]);

        // Should have 6 messages (5 new + 1 from setup)
        $this->assertCount(6, $response->json('data'));
    }

    /**
     * Test deleting own message.
     */
    public function test_user_can_delete_own_message()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/messages/{$this->message->id}", [
                'delete_type' => 'for_everyone'
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('messages', [
            'id' => $this->message->id,
            'deleted_for_all' => true
        ]);
    }

    /**
     * Test deleting someone else's message.
     */
    public function test_user_cannot_delete_others_message()
    {
        $otherMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Message from other user',
            'message_type' => 'text'
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/messages/{$otherMessage->id}", [
                'delete_type' => 'for_everyone'
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test adding a reaction to a message.
     */
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
                    'user',
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

    /**
     * Test removing a reaction from a message.
     */
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

    /**
     * Test archiving a chat.
     */
    public function test_user_can_archive_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_archived' => true
        ]);
    }

    /**
     * Test unarchiving a chat.
     */
    public function test_user_can_unarchive_chat()
    {
        // First archive the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_archived' => false
        ]);
    }

    /**
     * Test muting a chat.
     */
    public function test_user_can_mute_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'duration' => 'forever'
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_muted' => true
        ]);
    }

    /**
     * Test unmuting a chat.
     */
    public function test_user_can_unmute_chat()
    {
        // First mute the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'duration' => 'forever'
            ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/mute");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_muted' => false
        ]);
    }

    /**
     * Test pinning a chat.
     */
    public function test_user_can_pin_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * Test unpinning a chat.
     */
    public function test_user_can_unpin_chat()
    {
        // First pin the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/pin");

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => false
        ]);
    }

    /**
     * Test searching for messages.
     */
    public function test_user_can_search_messages()
    {
        // Create messages with specific content
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'This message contains searchable keyword',
            'message_type' => 'text'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=searchable');

        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
        $this->assertArrayHasKey('messages', $response->json());
        $this->assertGreaterThan(0, count($response->json('data')));
    }

    /**
     * Test error handling for non-existent resources.
     */
    public function test_404_for_nonexistent_resources()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/chats/9999');

        $response->assertStatus(404);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/9999');

        $response->assertStatus(404);
    }

    /**
     * Test validation errors for invalid data.
     */
    public function test_422_for_invalid_data()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                // Missing required fields
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test performance for loading chat list.
     */
    public function test_chat_list_performance()
    {
        // Create multiple chats
        for ($i = 0; $i < 10; $i++) {
            $chat = Chat::factory()->create(['type' => 'private']);
            ChatParticipant::factory()->create([
                'chat_id' => $chat->id,
                'user_id' => $this->user->id
            ]);
        }

        $startTime = microtime(true);
        $response = $this->actingAs($this->user)->getJson('/api/chats');
        $endTime = microtime(true);

        $response->assertStatus(200);
        
        // Ensure response time is reasonable (less than 1 second)
        $this->assertLessThan(1, $endTime - $startTime);
    }

    /**
     * Test performance for loading message list.
     */
    public function test_message_list_performance()
    {
        // Create multiple messages
        Message::factory()->count(50)->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'message_type' => 'text'
        ]);

        $startTime = microtime(true);
        $response = $this->actingAs($this->user)->getJson("/api/chats/{$this->chat->id}/messages");
        $endTime = microtime(true);

        $response->assertStatus(200);
        
        // Ensure response time is reasonable (less than 1 second)
        $this->assertLessThan(1, $endTime - $startTime);
    }
}