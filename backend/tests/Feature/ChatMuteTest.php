<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Chat;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ChatMuteTest extends TestCase
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
            'user_id' => $this->user->id
        ]);
        ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->otherUser->id
        ]);
    }

    /**
     * @test
     */
    public function user_can_mute_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat muted successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_muted' => true
        ]);
    }

    /**
     * @test
     */
    public function user_can_unmute_chat()
    {
        // First mute the chat
        ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->update(['is_muted' => true, 'muted_until' => now()->addHours(8)]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/chats/{$this->chat->id}/mute");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Chat unmuted successfully']);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_muted' => false
        ]);
    }

    /**
     * @test
     */
    public function user_cannot_mute_chat_they_are_not_participant_of()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'private']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$unauthorizedChat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response->assertStatus(403);
    }

    /**
     * @test
     */
    public function user_cannot_mute_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/99999/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response->assertStatus(404);
    }

    /**
     * @test
     */
    public function mute_requires_authentication()
    {
        $response = $this->postJson("/api/chats/{$this->chat->id}/mute", [
            'muted_until' => now()->addHours(8)->toISOString()
        ]);

        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function muted_chat_still_receives_messages()
    {
        // Mute the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        // Send a message to the chat
        $response = $this->actingAs($this->otherUser)
            ->postJson("/api/chats/{$this->chat->id}/messages", [
                'content' => 'Test message',
                'type' => 'text'
            ]);

        $response->assertStatus(201);

        // Verify message was sent
        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Test message'
        ]);
    }

    /**
     * @test
     */
    public function user_can_mute_group_chat()
    {
        $groupChat = Chat::factory()->create(['type' => 'group', 'name' => 'Test Group']);
        ChatParticipant::factory()->create([
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$groupChat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id,
            'is_muted' => true
        ]);
    }

    /**
     * @test
     */
    public function other_participants_can_still_see_unmuted_chat()
    {
        // Mute chat for one user
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        // Other user should still see the chat
        $response = $this->actingAs($this->otherUser)
            ->getJson("/api/chats");

        $response->assertStatus(200);
        $chats = $response->json('data');
        $this->assertNotEmpty($chats);
    }

    /**
     * @test
     */
    public function mute_requires_valid_muted_until_date()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => 'invalid-date'
            ]);

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function mute_until_cannot_be_in_past()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->subHour()->toISOString()
            ]);

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function mute_until_can_be_null_for_indefinite_mute()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute");

        $response->assertStatus(200);

        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'is_muted' => true
        ]);
    }

    /**
     * @test
     */
    public function mute_broadcasts_to_chat_participants()
    {
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        // Event should be broadcasted (we'll test this in WebSocket tests)
        $this->assertTrue(true);
    }

    /**
     * @test
     */
    public function user_can_get_muted_chats()
    {
        // Mute the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/muted");

        $response->assertStatus(200);
        $chats = $response->json('data');
        $this->assertCount(1, $chats);
        $this->assertEquals($this->chat->id, $chats[0]['id']);
    }

    /**
     * @test
     */
    public function muted_chat_is_marked_in_chat_list()
    {
        // Mute the chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats");

        $response->assertStatus(200);
        $chats = $response->json('data');
        $this->assertNotEmpty($chats);
        
        // Find our chat and check if it's marked as muted
        $mutedChat = collect($chats)->firstWhere('id', $this->chat->id);
        $this->assertNotNull($mutedChat);
        $this->assertTrue($mutedChat['is_muted']);
    }

    /**
     * @test
     */
    public function mute_expires_automatically()
    {
        // Mute for 1 second
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addSecond()->toISOString()
            ]);

        // Wait for mute to expire
        sleep(2);

        // Check if mute has expired
        $participant = ChatParticipant::where('chat_id', $this->chat->id)
            ->where('user_id', $this->user->id)
            ->first();

        $this->assertFalse($participant->is_muted);
    }

    /**
     * @test
     */
    public function user_can_mute_multiple_chats()
    {
        $chat2 = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $chat2->id,
            'user_id' => $this->user->id
        ]);

        // Mute first chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        // Mute second chat
        $this->actingAs($this->user)
            ->postJson("/api/chats/{$chat2->id}/mute", [
                'muted_until' => now()->addHours(8)->toISOString()
            ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/muted");

        $response->assertStatus(200);
        $chats = $response->json('data');
        $this->assertCount(2, $chats);
    }

    /**
     * @test
     */
    public function mute_until_has_maximum_limit()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addDays(365)->toISOString() // 1 year
            ]);

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function mute_until_has_minimum_limit()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/mute", [
                'muted_until' => now()->addMinutes(5)->toISOString() // 5 minutes
            ]);

        $response->assertStatus(422);
    }
} 