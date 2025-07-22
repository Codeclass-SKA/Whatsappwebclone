<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_message_to_chat()
    {
        // Create test users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create a chat
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user1->id
        ]);

        // Add both users as participants
        $chat->participants()->attach([$user1->id, $user2->id]);

        $response = $this->actingAs($user1)
            ->postJson("/api/chats/{$chat->id}/messages", [
                'content' => 'Hello, this is a test message!'
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'content',
                'sender_id',
                'chat_id',
                'message_type',
                'user' => [
                    'id',
                    'name',
                    'avatar'
                ],
                'created_at',
                'updated_at'
            ]
        ]);

        $response->assertJson([
            'data' => [
                'content' => 'Hello, this is a test message!',
                'sender_id' => $user1->id,
                'chat_id' => $chat->id,
                'message_type' => 'text'
            ]
        ]);

        // Check if message was saved in database
        $this->assertDatabaseHas('messages', [
            'content' => 'Hello, this is a test message!',
            'sender_id' => $user1->id,
            'chat_id' => $chat->id
        ]);
    }

    public function test_user_cannot_send_message_to_unauthorized_chat()
    {
        // Create test users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Create a chat with only user1 and user2
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user1->id
        ]);

        // Add only user1 and user2 as participants
        $chat->participants()->attach([$user1->id, $user2->id]);

        // Try to send message as user3 (not a participant)
        $response = $this->actingAs($user3)
            ->postJson("/api/chats/{$chat->id}/messages", [
                'content' => 'Unauthorized message'
            ]);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Unauthorized']);
    }

    public function test_message_content_cannot_be_empty()
    {
        // Create test users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create a chat
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user1->id
        ]);

        // Add both users as participants
        $chat->participants()->attach([$user1->id, $user2->id]);

        $response = $this->actingAs($user1)
            ->postJson("/api/chats/{$chat->id}/messages", [
                'content' => ''
            ]);

        $response->assertStatus(422);
    }
} 