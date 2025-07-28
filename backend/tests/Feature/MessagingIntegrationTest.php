<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use App\Events\MessageSent;
use App\Events\UserJoinedChat;
use App\Events\UserLeftChat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Broadcast;

class MessagingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([
            MessageSent::class,
            UserJoinedChat::class,
            UserLeftChat::class,
        ]);
    }

    public function test_real_time_message_delivery()
    {
        // Create users and chat
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        // Add users to chat
        $chat->participants()->attach([$sender->id, $receiver->id]);

        $this->actingAs($sender);

        // Send message
        $response = $this->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Test message',
            'type' => 'text',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'message_type',
                    'sender_id',
                    'chat_id',
                    'created_at',
                ],
            ]);

        // Assert message was saved
        $message = Message::first();
        $this->assertEquals('Test message', $message->content);
        $this->assertEquals($sender->id, $message->sender_id);

        // Assert event was broadcasted
        Event::assertDispatched(MessageSent::class, function ($event) use ($message) {
            return $event->message->id === $message->id;
        });

        // Verify receiver can access the message
        $this->actingAs($receiver);
        $response = $this->getJson("/api/chats/{$chat->id}/messages");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.content', 'Test message');
    }

    public function test_chat_participant_management()
    {
        // Create users and group chat
        $admin = User::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        $chat = Chat::factory()->create([
            'type' => 'group',
            'created_by' => $admin->id,
        ]);

        // Add admin to chat
        $chat->participants()->attach($admin->id);

        $this->actingAs($admin);

        // Add participants
        $response = $this->postJson("/api/chats/{$chat->id}/participants", [
            'user_ids' => [$user1->id, $user2->id],
        ]);

        $response->assertStatus(200);

        // Assert participants were added
        $this->assertEquals(3, $chat->participants()->count());
        $this->assertTrue($chat->participants->contains($user1));
        $this->assertTrue($chat->participants->contains($user2));

        // Assert events were broadcasted
        Event::assertDispatched(UserJoinedChat::class, 2);

        // Remove a participant
        $response = $this->deleteJson("/api/chats/{$chat->id}/participants/{$user2->id}");
        $response->assertStatus(200);

        // Assert participant was removed
        $this->assertEquals(2, $chat->participants()->count());
        $this->assertFalse($chat->participants()->where('user_id', $user2->id)->exists());

        // Assert event was broadcasted
        Event::assertDispatched(UserLeftChat::class, function ($event) use ($user2, $chat) {
            return $event->leaveData['user_id'] === $user2->id && $event->leaveData['chat_id'] === $chat->id;
        });
    }

    public function test_message_delivery_to_multiple_participants()
    {
        // Create group chat with multiple participants
        $sender = User::factory()->create();
        $receiver1 = User::factory()->create();
        $receiver2 = User::factory()->create();
        
        $chat = Chat::factory()->create([
            'type' => 'group',
            'created_by' => $sender->id,
        ]);

        $chat->participants()->attach([$sender->id, $receiver1->id, $receiver2->id]);

        $this->actingAs($sender);

        // Send message
        $response = $this->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Group message',
            'type' => 'text',
        ]);

        $response->assertStatus(201);

        // Verify each participant can access the message
        foreach ([$receiver1, $receiver2] as $receiver) {
            $this->actingAs($receiver);
            $response = $this->getJson("/api/chats/{$chat->id}/messages");
            $response->assertStatus(200)
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.content', 'Group message');
        }

        // Assert event was broadcasted once
        Event::assertDispatched(MessageSent::class, 1);
    }

    public function test_participant_permissions()
    {
        // Create chat and users
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $nonMember = User::factory()->create();
        
        $chat = Chat::factory()->create([
            'type' => 'group',
            'created_by' => $admin->id,
        ]);

        $chat->participants()->attach([$admin->id, $member->id]);

        // Non-member cannot send messages
        $this->actingAs($nonMember);
        $response = $this->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Unauthorized message',
            'message_type' => 'text',
        ]);
        $response->assertStatus(403);

        // Non-member cannot read messages
        $response = $this->getJson("/api/chats/{$chat->id}/messages");
        $response->assertStatus(403);

        // Member can send and read messages
        $this->actingAs($member);
        $response = $this->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Authorized message',
            'type' => 'text',
        ]);
        $response->assertStatus(201);

        $response = $this->getJson("/api/chats/{$chat->id}/messages");
        $response->assertStatus(200);
    }

    public function test_message_order_and_pagination()
    {
        // Create chat and users
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $chat->participants()->attach($user->id);

        $this->actingAs($user);

        // Create multiple messages
        $messages = [];
        for ($i = 1; $i <= 25; $i++) {
            $messages[] = Message::factory()->create([
                'chat_id' => $chat->id,
                'sender_id' => $user->id,
                'content' => "Message {$i}",
                'created_at' => now()->addMinutes($i),
            ]);
        }

        // Test pagination and order
        $response = $this->getJson("/api/chats/{$chat->id}/messages?page=1");
        $response->assertStatus(200)
            ->assertJsonCount(20, 'data') // Default per page
            ->assertJsonPath('data.0.content', 'Message 25') // Most recent first
            ->assertJsonStructure([
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        // Get second page
        $response = $this->getJson("/api/chats/{$chat->id}/messages?page=2");
        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('data.0.content', 'Message 5');
    }
}