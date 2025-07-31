<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageSearchControllerTest extends TestCase
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

    public function test_user_can_search_messages_in_participated_chats()
    {
        $message1 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Hello world message'
        ]);

        $message2 = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Another hello message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=hello');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'messages',
                'current_page',
                'last_page',
                'per_page',
                'total',
                'from',
                'to'
            ]);

        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['content' => 'Hello world message']);
        $response->assertJsonFragment(['content' => 'Another hello message']);
    }

    public function test_user_can_search_messages_in_specific_chat()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Specific chat message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/search?q=specific&chat_id={$this->chat->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['content' => 'Specific chat message']);
    }

    public function test_user_cannot_search_messages_in_unauthorized_chat()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'group']);
        $unauthorizedChat->participants()->attach($this->otherUser->id);

        Message::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Unauthorized message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/messages/search?q=unauthorized&chat_id={$unauthorizedChat->id}");

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_search_excludes_deleted_messages()
    {
        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted message',
            'is_deleted' => true
        ]);

        $activeMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Active message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=message');

        $response->assertStatus(200);
        $response->assertJsonMissing(['content' => 'Deleted message']);
        $response->assertJsonFragment(['content' => 'Active message']);
    }

    public function test_search_excludes_messages_for_all_deleted()
    {
        $deletedForAllMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted for all message',
            'deleted_for_all' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=deleted');

        $response->assertStatus(200);
        $response->assertJsonMissing(['content' => 'Deleted for all message']);
    }

    public function test_search_requires_query_parameter()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_search_requires_minimum_query_length()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=a');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_search_with_custom_per_page()
    {
        Message::factory()->count(5)->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Test message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=test&per_page=2');

        $response->assertStatus(200)
            ->assertJson(['per_page' => 2]);
    }

    public function test_search_returns_empty_for_no_matches()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=nonexistent');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_excludes_messages_from_non_participated_chats()
    {
        $otherChat = Chat::factory()->create(['type' => 'group']);
        $otherChat->participants()->attach($this->otherUser->id);

        Message::factory()->create([
            'chat_id' => $otherChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Other chat message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=other');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_requires_authentication()
    {
        $response = $this->getJson('/api/messages/search?q=test');
        $response->assertStatus(401);
    }

    public function test_search_validates_per_page_parameter()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=test&per_page=invalid');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_search_validates_chat_id_parameter()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=test&chat_id=99999');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['chat_id']);
    }
}