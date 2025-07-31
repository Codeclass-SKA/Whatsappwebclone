<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatControllerAdditionalTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $chat;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->chat = Chat::factory()->create(['type' => 'group']);
        
        $this->chat->participants()->attach([$this->user->id, $this->otherUser->id]);
    }

    public function test_user_can_get_chat_messages()
    {
        $message1 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First message'
        ]);

        $message2 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'content',
                        'sender_id',
                        'chat_id',
                        'message_type',
                        'created_at',
                        'updated_at',
                        'user' => [
                            'id',
                            'name',
                            'avatar'
                        ]
                    ]
                ],
                'current_page',
                'last_page',
                'per_page',
                'total'
            ]);

        $response->assertJsonCount(2, 'data');
    }

    public function test_user_cannot_get_messages_from_unauthorized_chat()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'group']);
        $unauthorizedChat->participants()->attach($this->otherUser->id);

        Message::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Unauthorized message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$unauthorizedChat->id}/messages");

        $response->assertStatus(403);
    }

    public function test_chat_messages_excludes_deleted_messages()
    {
        $activeMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Active message'
        ]);

        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted message',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/messages");

        $response->assertStatus(200);
        $response->assertJsonFragment(['content' => 'Active message']);
        $response->assertJsonMissing(['content' => 'Deleted message']);
    }

    public function test_chat_messages_excludes_messages_deleted_for_all()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message deleted for all',
            'deleted_for_all' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/messages");

        $response->assertStatus(200);
        $response->assertJsonMissing(['content' => 'Message deleted for all']);
    }

    public function test_chat_messages_are_paginated()
    {
        Message::factory()->count(25)->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Test message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/messages?per_page=10");

        $response->assertStatus(200)
            ->assertJson(['per_page' => 10])
            ->assertJsonCount(10, 'data');
    }

    public function test_chat_messages_requires_authentication()
    {
        $response = $this->getJson("/api/chats/{$this->chat->id}/messages");
        $response->assertStatus(401);
    }

    public function test_chat_messages_for_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/chats/99999/messages');

        $response->assertStatus(404);
    }
}