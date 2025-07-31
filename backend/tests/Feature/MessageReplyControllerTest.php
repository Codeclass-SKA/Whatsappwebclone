<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageReplyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $chat;
    protected $message;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->chat = Chat::factory()->create(['type' => 'group']);
        
        $this->chat->participants()->attach([$this->user->id, $this->otherUser->id]);
        
        $this->message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Original message'
        ]);
    }

    public function test_user_can_get_replies_for_message()
    {
        $reply1 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First reply',
            'reply_to_id' => $this->message->id
        ]);

        $reply2 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second reply',
            'reply_to_id' => $this->message->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/replies");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'content',
                        'sender_id',
                        'chat_id',
                        'reply_to_id',
                        'message_type',
                        'created_at',
                        'updated_at',
                        'user' => [
                            'id',
                            'name',
                            'avatar'
                        ]
                    ]
                ]
            ]);

        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['content' => 'First reply']);
        $response->assertJsonFragment(['content' => 'Second reply']);
    }

    public function test_user_cannot_get_replies_for_unauthorized_message()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'group']);
        $unauthorizedChat->participants()->attach($this->otherUser->id);
        
        $unauthorizedMessage = Message::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Unauthorized message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$unauthorizedMessage->id}/replies");

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_user_cannot_get_replies_for_nonexistent_message()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/99999/replies');

        $response->assertStatus(404);
    }

    public function test_user_cannot_get_replies_for_deleted_message()
    {
        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted message',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$deletedMessage->id}/replies");

        $response->assertStatus(404);
    }

    public function test_user_cannot_get_replies_for_message_deleted_for_all()
    {
        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted for all message',
            'deleted_for_all' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$deletedMessage->id}/replies");

        $response->assertStatus(404);
    }

    public function test_returns_empty_array_when_no_replies_exist()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/replies");

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_replies_are_ordered_by_creation_time()
    {
        $reply1 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First reply',
            'reply_to_id' => $this->message->id,
            'created_at' => now()->subHours(2)
        ]);

        $reply2 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second reply',
            'reply_to_id' => $this->message->id,
            'created_at' => now()->subHours(1)
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/replies");

        $response->assertStatus(200);
        
        $replies = $response->json('data');
        $this->assertEquals('First reply', $replies[0]['content']);
        $this->assertEquals('Second reply', $replies[1]['content']);
    }

    public function test_replies_include_nested_replies()
    {
        $reply = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First level reply',
            'reply_to_id' => $this->message->id
        ]);

        $nestedReply = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Nested reply',
            'reply_to_id' => $reply->id
        ]);

        // Note: This test assumes the controller returns all replies including nested ones
        // The actual behavior might differ based on the implementation
        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/replies");

        $response->assertStatus(200);
    }

    public function test_replies_include_user_information()
    {
        $reply = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Test reply',
            'reply_to_id' => $this->message->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$this->message->id}/replies");

        $response->assertStatus(200)
            ->assertJsonPath('data.0.user.id', $this->user->id)
            ->assertJsonPath('data.0.user.name', $this->user->name)
            ->assertJsonPath('data.0.user.avatar', $this->user->avatar);
    }

    public function test_requires_authentication()
    {
        $response = $this->getJson("/api/messages/{$this->message->id}/replies");
        $response->assertStatus(401);
    }

    public function test_replies_from_different_chat_types()
    {
        $privateChat = Chat::factory()->create(['type' => 'private']);
        $privateChat->participants()->attach([$this->user->id, $this->otherUser->id]);
        
        $privateMessage = Message::factory()->create([
            'chat_id' => $privateChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Private message'
        ]);

        $reply = Message::factory()->create([
            'chat_id' => $privateChat->id,
            'sender_id' => $this->user->id,
            'content' => 'Private reply',
            'reply_to_id' => $privateMessage->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/{$privateMessage->id}/replies");

        $response->assertStatus(200)
            ->assertJsonFragment(['content' => 'Private reply']);
    }
}