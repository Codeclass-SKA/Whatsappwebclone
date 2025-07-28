<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageReadTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_message_read_status()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $this->assertInstanceOf(MessageRead::class, $messageRead);
        $this->assertEquals($message->id, $messageRead->message_id);
        $this->assertEquals($user->id, $messageRead->user_id);
        $this->assertNotNull($messageRead->read_at);
    }

    /** @test */
    public function it_has_message_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $this->assertInstanceOf(Message::class, $messageRead->message);
        $this->assertEquals($message->id, $messageRead->message->id);
    }

    /** @test */
    public function it_has_user_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $this->assertInstanceOf(User::class, $messageRead->user);
        $this->assertEquals($user->id, $messageRead->user->id);
    }

    /** @test */
    public function it_prevents_duplicate_read_status()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        // Create first read status
        MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        // Try to create duplicate read status
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);
    }

    /** @test */
    public function it_cascades_when_message_is_deleted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $this->assertDatabaseHas('message_reads', ['id' => $messageRead->id]);

        // Delete the message
        $message->delete();

        $this->assertDatabaseMissing('message_reads', ['id' => $messageRead->id]);
    }

    /** @test */
    public function it_cascades_when_user_is_deleted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $this->assertDatabaseHas('message_reads', ['id' => $messageRead->id]);

        // Delete the user
        $user->delete();

        $this->assertDatabaseMissing('message_reads', ['id' => $messageRead->id]);
    }

    /** @test */
    public function it_has_required_fields()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $messageRead = MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        $messageReadArray = $messageRead->toArray();

        $this->assertArrayHasKey('message_id', $messageReadArray);
        $this->assertArrayHasKey('user_id', $messageReadArray);
        $this->assertArrayHasKey('read_at', $messageReadArray);
        $this->assertArrayHasKey('created_at', $messageReadArray);
        $this->assertArrayHasKey('updated_at', $messageReadArray);
    }
}