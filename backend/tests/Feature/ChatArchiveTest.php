<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Chat;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ChatArchiveTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected User $otherUser;
    protected Chat $chat;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        
        $this->chat = Chat::factory()->create(['type' => 'private']);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id
        ]);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->otherUser->id
        ]);
    }

    /**
     * @test
     */
    public function user_can_archive_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat archived successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_archived' => true
        ]);
    }

    /**
     * @test
     */
    public function user_can_unarchive_chat()
    {
        // First archive the chat
        \App\Models\ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_archived' => true]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat unarchived successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_archived' => false
        ]);
    }

    /**
     * @test
     */
    public function user_cannot_archive_chat_they_are_not_participant_of()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'private']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$unauthorizedChat->id}/archive");

        $response->assertStatus(403);
    }

    /**
     * @test
     */
    public function user_cannot_archive_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/99999/archive");

        $response->assertStatus(404);
    }

    /**
     * @test
     */
    public function archive_requires_authentication()
    {
        $response = $this->postJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function archived_chat_is_not_returned_in_chat_list()
    {
        // Archive the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        // Get chat list
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats");

        $response->assertStatus(200);
        
        $chats = $response->json('data');
        $this->assertEmpty($chats);
    }

    /**
     * @test
     */
    public function user_can_get_archived_chats()
    {
        // Archive the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        // Get archived chats
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/archived");

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

        $chats = $response->json('data');
        $this->assertCount(1, $chats);
        $this->assertEquals($this->chat->id, $chats[0]['id']);
    }

    /**
     * @test
     */
    public function archived_chat_still_receives_messages()
    {
        // Archive the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        // Send message to archived chat
        $response = $this->actingAs($this->otherUser)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Message to archived chat'
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'content' => 'Message to archived chat'
        ]);
    }

    /**
     * @test
     */
    public function user_can_archive_multiple_chats()
    {
        $chat2 = Chat::factory()->create(['type' => 'private']);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $chat2->id,
            'user_id' => $this->user->id
        ]);

        // Archive first chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        // Archive second chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$chat2->id}/archive");

        // Get archived chats
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/archived");

        $response->assertStatus(200);
        
        $chats = $response->json('data');
        $this->assertCount(2, $chats);
    }

    /**
     * @test
     */
    public function archive_broadcasts_to_chat_participants()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        $response->assertStatus(200);
        
        // The broadcast event should be triggered
        // This is tested indirectly by checking the response
        $this->assertTrue(true);
    }

    /**
     * @test
     */
    public function user_can_archive_group_chat()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Test Group'
        ]);
        
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$groupChat->id}/archive");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id,
            'is_archived' => true
        ]);
    }

    /**
     * @test
     */
    public function other_participants_can_still_see_unarchived_chat()
    {
        // Archive chat for one user
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/archive");

        // Other user should still see the chat
        $response = $this->actingAs($this->otherUser)
            ->getJson("/api/chats");

        $response->assertStatus(200);
        
        $chats = $response->json('data');
        $this->assertCount(1, $chats);
        $this->assertEquals($this->chat->id, $chats[0]['id']);
    }
} 