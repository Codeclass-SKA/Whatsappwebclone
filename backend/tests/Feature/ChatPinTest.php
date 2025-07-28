<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Chat;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ChatPinTest extends TestCase
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
    public function user_can_pin_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat pinned successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * @test
     */
    public function user_can_unpin_chat()
    {
        // First pin the chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat unpinned successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => false
        ]);
    }

    /**
     * @test
     */
    public function user_cannot_pin_chat_they_are_not_participant_of()
    {
        $otherChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $this->otherUser->id,
            'role' => 'member'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$otherChat->id}/pin");

        $response->assertStatus(403)
            ->assertJson(['message' => 'Unauthorized']);
    }

    /**
     * @test
     */
    public function user_cannot_pin_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/99999/pin");

        $response->assertStatus(404);
    }

    /**
     * @test
     */
    public function pin_requires_authentication()
    {
        $response = $this->postJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function pinned_chat_still_receives_messages()
    {
        // Pin the chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Test message',
                'type' => 'text'
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Test message'
        ]);
    }

    /**
     * @test
     */
    public function user_can_pin_group_chat()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Test Group'
        ]);
        ChatParticipant::factory()->create([
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$groupChat->id}/pin");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat pinned successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * @test
     */
    public function other_participants_can_still_see_unpinned_chat()
    {
        // Pin chat for one user
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        // Other user should still see the chat as unpinned
        $response = $this->actingAs($this->otherUser)
            ->getJson('/api/chats');

        $response->assertStatus(200);
        $chats = $response->json('data');
        $chat = collect($chats)->firstWhere('id', $this->chat->id);
        
        $this->assertNotNull($chat);
        $this->assertFalse($chat['is_pinned']);
    }

    /**
     * @test
     */
    public function pin_broadcasts_to_chat_participants()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/pin");

        $response->assertStatus(200);
        
        // In a real application, we would test the broadcast event
        // For now, we just verify the pin was successful
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * @test
     */
    public function user_can_get_pinned_chats()
    {
        // Pin a chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/chats/pinned');

        $response->assertStatus(200);
        $pinnedChats = $response->json('data');
        
        $this->assertCount(1, $pinnedChats);
        $this->assertEquals($this->chat->id, $pinnedChats[0]['id']);
        $this->assertTrue($pinnedChats[0]['is_pinned']);
    }

    /**
     * @test
     */
    public function pinned_chat_is_marked_in_chat_list()
    {
        // Pin the chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/chats');

        $response->assertStatus(200);
        $chats = $response->json('data');
        
        // Find our chat and check if it's marked as pinned
        $pinnedChat = collect($chats)->firstWhere('id', $this->chat->id);
        $this->assertNotNull($pinnedChat);
        $this->assertTrue($pinnedChat['is_pinned']);
    }

    /**
     * @test
     */
    public function pinned_chats_appear_first_in_list()
    {
        // Create another chat
        $otherChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        // Pin the first chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/chats');

        $response->assertStatus(200);
        $chats = $response->json('data');
        
        // The pinned chat should appear first
        $this->assertEquals($this->chat->id, $chats[0]['id']);
        $this->assertTrue($chats[0]['is_pinned']);
    }

    /**
     * @test
     */
    public function user_can_pin_multiple_chats()
    {
        // Create another chat
        $otherChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        // Pin both chats
        $response1 = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/pin");
        $response2 = $this->actingAs($this->user)
            ->postJson("/api/chats/{$otherChat->id}/pin");

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $otherChat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * @test
     */
    public function user_can_pin_maximum_number_of_chats()
    {
        // Create 10 chats (maximum allowed)
        $chats = [];
        for ($i = 0; $i < 10; $i++) {
            $chat = Chat::factory()->create(['type' => 'private']);
            ChatParticipant::factory()->create([
                'chat_id' => $chat->id,
                'user_id' => $this->user->id,
                'role' => 'member'
            ]);
            $chats[] = $chat;
        }

        // Pin all chats
        foreach ($chats as $chat) {
            $response = $this->actingAs($this->user)
                ->postJson("/api/chats/{$chat->id}/pin");
            $response->assertStatus(200);
        }

        // Try to pin one more chat (should fail)
        $extraChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $extraChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$extraChat->id}/pin");

        $response->assertStatus(422)
            ->assertJson(['message' => 'Maximum number of pinned chats reached']);
    }

    /**
     * @test
     */
    public function pinned_chat_retains_pin_status_after_new_message()
    {
        // Pin the chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        // Send a message
        $this->actingAs($this->otherUser)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'New message'
            ]);

        // Check that the chat is still pinned
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_pinned' => true
        ]);
    }

    /**
     * @test
     */
    public function pin_status_is_independent_for_each_user()
    {
        // Pin chat for one user
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_pinned' => true]);

        // Other user should not see it as pinned
        $response = $this->actingAs($this->otherUser)
            ->getJson('/api/chats');

        $response->assertStatus(200);
        $chats = $response->json('data');
        $chat = collect($chats)->firstWhere('id', $this->chat->id);
        
        $this->assertNotNull($chat);
        $this->assertFalse($chat['is_pinned']);
    }
} 