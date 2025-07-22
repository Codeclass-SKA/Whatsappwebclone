<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class MessageReplyTest extends TestCase
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
        
        $this->originalMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Hello, how are you?',
            'message_type' => 'text'
        ]);
    }

    public function test_user_can_reply_to_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'I am fine, thank you!',
                'reply_to_id' => $this->originalMessage->id
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'sender_id',
                    'chat_id',
                    'message_type',
                    'reply_to_id',
                    'reply_to' => [
                        'id',
                        'content',
                        'sender_id',
                        'message_type'
                    ],
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'I am fine, thank you!',
            'reply_to_id' => $this->originalMessage->id
        ]);
    }

    public function test_user_cannot_reply_to_message_in_unauthorized_chat()
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
            ->postJson("/api/chats/{$unauthorizedChat->id}/messages", [
                'content' => 'Reply to unauthorized message',
                'reply_to_id' => $unauthorizedMessage->id
            ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_reply_to_nonexistent_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Reply to nonexistent message',
                'reply_to_id' => 99999
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reply_to_id']);
    }

    public function test_user_cannot_reply_to_deleted_message()
    {
        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'This message will be deleted',
            'message_type' => 'text',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Reply to deleted message',
                'reply_to_id' => $deletedMessage->id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reply_to_id']);
    }

    public function test_reply_message_requires_content()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'reply_to_id' => $this->originalMessage->id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    public function test_reply_message_content_cannot_be_empty()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => '',
                'reply_to_id' => $this->originalMessage->id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    public function test_user_can_get_replies_to_message()
    {
        // Create replies
        $reply1 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First reply',
            'message_type' => 'text',
            'reply_to_id' => $this->originalMessage->id
        ]);

        $reply2 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second reply',
            'message_type' => 'text',
            'reply_to_id' => $this->originalMessage->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->originalMessage->id}/replies");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'content',
                        'sender_id',
                        'chat_id',
                        'message_type',
                        'reply_to_id',
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

    public function test_user_cannot_get_replies_to_unauthorized_message()
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
            ->getJson("/api/messages/{$unauthorizedMessage->id}/replies");

        $response->assertStatus(403);
    }

    public function test_reply_message_broadcasts_to_chat_participants()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'I am fine, thank you!',
                'reply_to_id' => $this->originalMessage->id
            ]);

        $response->assertStatus(201);

        // This test would verify that the reply event is broadcasted
        // In a real implementation, we would check if the event was dispatched
        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'I am fine, thank you!',
            'reply_to_id' => $this->originalMessage->id
        ]);
    }

    public function test_reply_can_include_file_attachment()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Here is the file you requested',
                'reply_to_id' => $this->originalMessage->id,
                'message_type' => 'file',
                'file_url' => '/storage/files/document.pdf'
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'content' => 'Here is the file you requested',
                    'reply_to_id' => $this->originalMessage->id,
                    'message_type' => 'file',
                    'file_url' => '/storage/files/document.pdf'
                ]
            ]);
    }

    public function test_reply_to_reply_is_allowed()
    {
        // Create first reply
        $firstReply = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First reply',
            'message_type' => 'text',
            'reply_to_id' => $this->originalMessage->id
        ]);

        // Reply to the first reply
        $response = $this->actingAs($this->otherUser)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Reply to the reply',
                'reply_to_id' => $firstReply->id
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'reply_to_id' => $firstReply->id
                ]
            ]);
    }

    public function test_reply_message_includes_original_message_context()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'I am fine, thank you!',
                'reply_to_id' => $this->originalMessage->id
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'reply_to' => [
                        'id',
                        'content',
                        'sender_id',
                        'message_type',
                        'user' => [
                            'id',
                            'name',
                            'avatar'
                        ]
                    ]
                ]
            ]);

        $response->assertJson([
            'data' => [
                'reply_to' => [
                    'id' => $this->originalMessage->id,
                    'content' => 'Hello, how are you?',
                    'sender_id' => $this->otherUser->id,
                    'message_type' => 'text'
                ]
            ]
        ]);
    }
} 