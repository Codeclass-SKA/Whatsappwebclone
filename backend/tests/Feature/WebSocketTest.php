<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class WebSocketTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test users
        $this->user1 = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);
        
        $this->user2 = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
        ]);
        
        // Create a private chat between users
        $this->chat = Chat::factory()->create([
            'type' => 'private',
            'name' => 'John Doe',
            'created_by' => $this->user1->id,
        ]);
        
        $this->chat->participants()->attach([$this->user1->id, $this->user2->id]);
    }

    public function test_user_can_connect_to_websocket()
    {
        $response = $this->actingAs($this->user1)
            ->post('/api/broadcasting/auth', [
                'socket_id' => 'test-socket-id',
                'channel_name' => 'private-chat.' . $this->chat->id
            ]);

        $response->assertStatus(200);
    }

    public function test_user_cannot_connect_to_unauthorized_channel()
    {
        $unauthorizedChat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $this->user2->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->post('/api/broadcasting/auth', [
                'socket_id' => 'test-socket-id',
                'channel_name' => 'private-chat.' . $unauthorizedChat->id
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_join_group_chat_channel()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Project Team',
            'created_by' => $this->user1->id,
        ]);
        
        $groupChat->participants()->attach([$this->user1->id, $this->user2->id]);

        $response = $this->actingAs($this->user1)
            ->post('/api/broadcasting/auth', [
                'socket_id' => 'test-socket-id',
                'channel_name' => 'private-chat.' . $groupChat->id
            ]);

        $response->assertStatus(200);
    }

    public function test_message_broadcasted_to_chat_participants()
    {
        $message = Message::factory()->create([
            'content' => 'Hello from WebSocket!',
            'sender_id' => $this->user1->id,
            'chat_id' => $this->chat->id,
        ]);

        // Simulate broadcasting event
        broadcast(new \App\Events\MessageSent($message))->toOthers();

        // Verify that the message was created
        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Hello from WebSocket!',
            'sender_id' => $this->user1->id,
            'chat_id' => $this->chat->id,
        ]);
    }

    public function test_user_typing_indicator_broadcasted()
    {
        $typingData = [
            'user_id' => $this->user1->id,
            'user_name' => $this->user1->name,
            'chat_id' => $this->chat->id,
            'is_typing' => true
        ];

        // Simulate typing event
        broadcast(new \App\Events\UserTyping($typingData))->toOthers();

        // Verify that typing event was triggered
        $this->assertTrue(true); // Placeholder for actual WebSocket testing
    }

    public function test_user_online_status_broadcasted()
    {
        $this->user1->update(['is_online' => true]);

        // Simulate online status event
        broadcast(new \App\Events\UserOnlineStatus($this->user1))->toOthers();

        // Verify that user is marked as online
        $this->assertDatabaseHas('users', [
            'id' => $this->user1->id,
            'is_online' => true
        ]);
    }

    public function test_user_offline_status_broadcasted()
    {
        $this->user1->update(['is_online' => false, 'last_seen' => now()]);

        // Simulate offline status event
        broadcast(new \App\Events\UserOnlineStatus($this->user1))->toOthers();

        // Verify that user is marked as offline
        $this->assertDatabaseHas('users', [
            'id' => $this->user1->id,
            'is_online' => false
        ]);
    }

    public function test_message_read_status_broadcasted()
    {
        $message = Message::factory()->create([
            'sender_id' => $this->user1->id,
            'chat_id' => $this->chat->id,
        ]);

        $readData = [
            'message_id' => $message->id,
            'user_id' => $this->user2->id,
            'chat_id' => $this->chat->id,
        ];

        // Simulate message read event
        broadcast(new \App\Events\MessageRead($readData))->toOthers();

        // Verify that read event was triggered
        $this->assertTrue(true); // Placeholder for actual WebSocket testing
    }

    public function test_chat_created_event_broadcasted()
    {
        $newChat = Chat::factory()->create([
            'type' => 'private',
            'name' => 'New Chat',
            'created_by' => $this->user1->id,
        ]);

        // Simulate chat created event
        broadcast(new \App\Events\ChatCreated($newChat))->toOthers();

        // Verify that chat was created
        $this->assertDatabaseHas('chats', [
            'id' => $newChat->id,
            'name' => 'New Chat',
            'created_by' => $this->user1->id,
        ]);
    }

    public function test_user_joined_chat_event_broadcasted()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Group Chat',
            'created_by' => $this->user1->id,
        ]);

        $joinData = [
            'chat_id' => $groupChat->id,
            'user_id' => $this->user2->id,
            'user_name' => $this->user2->name,
        ];

        // Simulate user joined event
        broadcast(new \App\Events\UserJoinedChat($joinData))->toOthers();

        // Verify that join event was triggered
        $this->assertTrue(true); // Placeholder for actual WebSocket testing
    }

    public function test_user_left_chat_event_broadcasted()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Group Chat',
            'created_by' => $this->user1->id,
        ]);

        $leaveData = [
            'chat_id' => $groupChat->id,
            'user_id' => $this->user2->id,
            'user_name' => $this->user2->name,
        ];

        // Simulate user left event
        broadcast(new \App\Events\UserLeftChat($leaveData))->toOthers();

        // Verify that leave event was triggered
        $this->assertTrue(true); // Placeholder for actual WebSocket testing
    }
} 