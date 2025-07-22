<?php

namespace Tests\Unit;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_create_text_message()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Hello, how are you?',
            'message_type' => 'text',
        ]);

        $this->assertInstanceOf(Message::class, $message);
        $this->assertEquals($chat->id, $message->chat_id);
        $this->assertEquals($user->id, $message->sender_id);
        $this->assertEquals('Hello, how are you?', $message->content);
        $this->assertEquals('text', $message->message_type);
        $this->assertFalse($message->fresh()->is_deleted);
        $this->assertFalse($message->fresh()->deleted_for_all);
    }

    public function test_it_can_create_image_message()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Check out this image!',
            'message_type' => 'image',
            'file_url' => 'https://example.com/image.jpg',
        ]);

        $this->assertInstanceOf(Message::class, $message);
        $this->assertEquals('image', $message->message_type);
        $this->assertEquals('https://example.com/image.jpg', $message->file_url);
    }

    public function test_it_can_create_reply_message()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $originalMessage = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message',
            'message_type' => 'text',
        ]);

        $replyMessage = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'This is a reply',
            'message_type' => 'text',
            'reply_to_id' => $originalMessage->id,
        ]);

        $this->assertEquals($originalMessage->id, $replyMessage->reply_to_id);
    }

    public function test_it_can_mark_as_deleted_for_sender()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'This will be deleted',
            'message_type' => 'text',
        ]);

        $message->update(['is_deleted' => true]);

        $this->assertTrue($message->fresh()->is_deleted);
        $this->assertFalse($message->fresh()->deleted_for_all);
    }

    public function test_it_can_mark_as_deleted_for_everyone()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'This will be deleted for everyone',
            'message_type' => 'text',
        ]);

        $message->update(['deleted_for_all' => true]);

        $this->assertTrue($message->fresh()->deleted_for_all);
    }

    public function test_it_has_required_fields()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Test message',
            'message_type' => 'text',
        ]);

        $messageArray = $message->toArray();

        $this->assertArrayHasKey('chat_id', $messageArray);
        $this->assertArrayHasKey('sender_id', $messageArray);
        $this->assertArrayHasKey('content', $messageArray);
        $this->assertArrayHasKey('message_type', $messageArray);
        $this->assertArrayHasKey('created_at', $messageArray);
        $this->assertArrayHasKey('updated_at', $messageArray);
        $this->assertArrayHasKey('id', $messageArray);
    }

    public function test_it_has_deleted_fields_when_set()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Test message',
            'message_type' => 'text',
            'is_deleted' => true,
            'deleted_for_all' => true,
        ]);

        $messageArray = $message->toArray();

        $this->assertArrayHasKey('is_deleted', $messageArray);
        $this->assertArrayHasKey('deleted_for_all', $messageArray);
        $this->assertTrue($messageArray['is_deleted']);
        $this->assertTrue($messageArray['deleted_for_all']);
    }

    public function test_it_can_have_file_url()
    {
        $user = User::factory()->create();
        $chat = Chat::create([
            'type' => 'private',
            'created_by' => $user->id,
        ]);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'File message',
            'message_type' => 'file',
            'file_url' => 'https://example.com/document.pdf',
        ]);

        $messageArray = $message->toArray();

        $this->assertArrayHasKey('file_url', $messageArray);
        $this->assertEquals('https://example.com/document.pdf', $messageArray['file_url']);
    }
} 