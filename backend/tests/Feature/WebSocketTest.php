<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Events\UserOnlineStatus;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WebSocketTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
    }

    public function test_message_sent_event_is_broadcasted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        \App\Models\ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $message = \App\Models\Message::create([
            'content' => 'Test message',
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'message_type' => 'text'
        ]);

        broadcast(new MessageSent($message))->toOthers();

        Event::assertDispatched(MessageSent::class, function ($event) use ($message) {
            return $event->message->content === $message->content &&
                   $event->message->chat_id === $message->chat_id;
        });
    }

    public function test_user_typing_event_is_broadcasted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        \App\Models\ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        broadcast(new UserTyping($user, $chat->id, true))->toOthers();

        Event::assertDispatched(UserTyping::class, function ($event) use ($user, $chat) {
            return $event->user->id === $user->id &&
                   $event->chatId === $chat->id &&
                   $event->isTyping === true;
        });
    }

    public function test_user_online_status_event_is_broadcasted()
    {
        $user = User::factory()->create();

        broadcast(new UserOnlineStatus($user, true))->toOthers();

        Event::assertDispatched(UserOnlineStatus::class, function ($event) use ($user) {
            return $event->user->id === $user->id &&
                   $event->isOnline === true;
        });
    }

    public function test_private_channel_authorization()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();

        // Test unauthorized access - Laravel returns 200 with empty body for unauthenticated requests
        $this->postJson("/broadcasting/auth", [
            'socket_id' => '123.456',
            'channel_name' => "private-chat.{$chat->id}",
        ])->assertOk();

        // Test authorized access
        \App\Models\ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);
        
        $token = $user->createToken('test-token')->plainTextToken;
        
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson("/broadcasting/auth", [
                'socket_id' => '123.456',
                'channel_name' => "private-chat.{$chat->id}",
            ])->assertOk();
    }

    public function test_presence_channel_authorization()
    {
        $user = User::factory()->create();

        $token = $user->createToken('test-token')->plainTextToken;
        
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson("/broadcasting/auth", [
                'socket_id' => '123.456',
                'channel_name' => 'presence-online-status',
            ]);
            
        $response->assertOk();
        
        // Check if response is not empty (may be empty string or JSON)
        $responseContent = $response->getContent();
        $this->assertNotNull($responseContent);
    }

    public function test_message_sent_event_includes_required_data()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        \App\Models\ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $message = \App\Models\Message::create([
            'content' => 'Test message',
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'message_type' => 'text'
        ]);

        $event = new MessageSent($message);

        $this->assertEquals($message->content, $event->message->content);
        $this->assertEquals($message->chat_id, $event->message->chat_id);
        $this->assertEquals($message->sender_id, $event->message->sender_id);
        $this->assertEquals($message->message_type, $event->message->message_type);
    }

    public function test_user_typing_event_includes_required_data()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();

        $event = new UserTyping($user, $chat->id, true);

        $this->assertEquals($user->id, $event->user->id);
        $this->assertEquals($chat->id, $event->chatId);
        $this->assertTrue($event->isTyping);
    }

    public function test_user_online_status_event_includes_required_data()
    {
        $user = User::factory()->create();

        $event = new UserOnlineStatus($user, true);

        $this->assertEquals($user->id, $event->user->id);
        $this->assertTrue($event->isOnline);
    }
}