<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageSearchTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $otherUser;
    protected $chat;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        
        $this->chat = Chat::factory()->create(['type' => 'private']);
        
        // Add both users as participants
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
    }

    /**
     * @test
     */
    public function user_can_search_messages_in_their_chats()
    {
        // Create messages with specific content
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello world, this is a test message'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Another message with different content'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=test');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
        $this->assertStringContainsString('test', $results[0]['content']);
    }

    /**
     * @test
     */
    public function search_is_case_insensitive()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello WORLD, this is a TEST message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=world');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
        $this->assertStringContainsString('WORLD', $results[0]['content']);
    }

    /**
     * @test
     */
    public function search_returns_messages_from_all_user_chats()
    {
        // Create another chat
        $otherChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        // Create messages in both chats
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with keyword in first chat'
        ]);
        
        Message::factory()->create([
            'chat_id' => $otherChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Message with keyword in second chat'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(2, $results);
    }

    /**
     * @test
     */
    public function search_does_not_return_messages_from_unauthorized_chats()
    {
        // Create a chat where user is not participant
        $unauthorizedChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'user_id' => $this->otherUser->id,
            'role' => 'member'
        ]);

        Message::factory()->create([
            'chat_id' => $unauthorizedChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Message with keyword in unauthorized chat'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(0, $results);
    }

    /**
     * @test
     */
    public function search_returns_empty_results_for_no_matches()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'This message has no matching keyword'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=nonexistent');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(0, $results);
    }

    /**
     * @test
     */
    public function search_requires_authentication()
    {
        $response = $this->getJson('/api/messages/search?q=test');
        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function search_requires_query_parameter()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search');

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function search_query_cannot_be_empty()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=');

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function search_query_has_minimum_length()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=ab');

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function search_returns_paginated_results()
    {
        // Create 25 messages with keyword
        for ($i = 0; $i < 25; $i++) {
            Message::factory()->create([
                'chat_id' => $this->chat->id,
                'sender_id' => $this->user->id,
                'content' => "Message {$i} with keyword"
            ]);
        }

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword&per_page=10');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(10, $results);
        $this->assertArrayHasKey('current_page', $response->json());
        $this->assertArrayHasKey('last_page', $response->json());
        $this->assertArrayHasKey('total', $response->json());
    }

    /**
     * @test
     */
    public function search_results_include_message_metadata()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with keyword'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
        $result = $results[0];
        
        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('content', $result);
        $this->assertArrayHasKey('sender_id', $result);
        $this->assertArrayHasKey('chat_id', $result);
        $this->assertArrayHasKey('created_at', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('chat', $result);
    }

    /**
     * @test
     */
    public function search_results_are_ordered_by_relevance()
    {
        // Create messages with different relevance
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with keyword'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with keyword keyword keyword'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(2, $results);
        // Messages with more keyword occurrences should appear first
        $this->assertStringContainsString('keyword keyword keyword', $results[0]['content']);
    }

    /**
     * @test
     */
    public function search_works_with_partial_words()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with testing keyword'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=test');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
        $this->assertStringContainsString('testing', $results[0]['content']);
    }

    /**
     * @test
     */
    public function search_does_not_return_deleted_messages()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with keyword',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=keyword');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(0, $results);
    }

    /**
     * @test
     */
    public function search_works_with_special_characters()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with @#$%^&*() special characters'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=' . urlencode('@#$%^&*()'));

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
    }

    /**
     * @test
     */
    public function search_works_with_numbers()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with 12345 numbers'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/messages/search?q=12345');

        $response->assertStatus(200);
        $results = $response->json('data');
        
        $this->assertCount(1, $results);
    }
}
