<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageReplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_create_reply_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $replyMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply message',
            'reply_to_id' => $originalMessage->id
        ]);

        $this->assertDatabaseHas('messages', [
            'id' => $replyMessage->id,
            'reply_to_id' => $originalMessage->id
        ]);

        $this->assertEquals($originalMessage->id, $replyMessage->reply_to_id);
    }

    public function test_it_has_reply_to_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $replyMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply message',
            'reply_to_id' => $originalMessage->id
        ]);

        $this->assertInstanceOf(Message::class, $replyMessage->replyTo);
        $this->assertEquals($originalMessage->id, $replyMessage->replyTo->id);
        $this->assertEquals('Original message', $replyMessage->replyTo->content);
    }

    public function test_it_has_replies_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $reply1 = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply 1',
            'reply_to_id' => $originalMessage->id
        ]);

        $reply2 = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply 2',
            'reply_to_id' => $originalMessage->id
        ]);

        $replies = $originalMessage->replies;

        $this->assertCount(2, $replies);
        $this->assertTrue($replies->contains($reply1));
        $this->assertTrue($replies->contains($reply2));
    }

    public function test_it_can_have_nested_replies()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $firstReply = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'First reply',
            'reply_to_id' => $originalMessage->id
        ]);

        $secondReply = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Second reply',
            'reply_to_id' => $firstReply->id
        ]);

        $this->assertEquals($originalMessage->id, $firstReply->reply_to_id);
        $this->assertEquals($firstReply->id, $secondReply->reply_to_id);
        
        $this->assertCount(1, $originalMessage->replies);
        $this->assertCount(1, $firstReply->replies);
        $this->assertCount(0, $secondReply->replies);
    }

    public function test_reply_message_can_have_file_attachment()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $replyMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply with file',
            'reply_to_id' => $originalMessage->id,
            'message_type' => 'file',
            'file_url' => '/storage/files/document.pdf'
        ]);

        $this->assertEquals('file', $replyMessage->message_type);
        $this->assertEquals('/storage/files/document.pdf', $replyMessage->file_url);
        $this->assertEquals($originalMessage->id, $replyMessage->reply_to_id);
    }

    public function test_reply_message_can_have_different_types()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $textReply = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Text reply',
            'reply_to_id' => $originalMessage->id,
            'message_type' => 'text'
        ]);

        $imageReply = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Image reply',
            'reply_to_id' => $originalMessage->id,
            'message_type' => 'image',
            'file_url' => '/storage/images/photo.jpg'
        ]);

        $this->assertEquals('text', $textReply->message_type);
        $this->assertEquals('image', $imageReply->message_type);
        $this->assertNull($textReply->file_url);
        $this->assertEquals('/storage/images/photo.jpg', $imageReply->file_url);
    }

    public function test_reply_message_cascades_when_original_message_is_deleted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $replyMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply message',
            'reply_to_id' => $originalMessage->id
        ]);

        $this->assertDatabaseHas('messages', ['id' => $replyMessage->id]);

        // Delete the original message
        $originalMessage->delete();

        // The reply should still exist but with null reply_to_id
        $this->assertDatabaseMissing('messages', ['id' => $originalMessage->id]);
        $this->assertDatabaseHas('messages', ['id' => $replyMessage->id]);
        
        // Refresh the reply message
        $replyMessage->refresh();
        $this->assertNull($replyMessage->reply_to_id);
    }

    public function test_reply_message_can_be_deleted_independently()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $originalMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Original message'
        ]);

        $replyMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'content' => 'Reply message',
            'reply_to_id' => $originalMessage->id
        ]);

        $this->assertDatabaseHas('messages', ['id' => $replyMessage->id]);

        // Delete the reply message
        $replyMessage->delete();

        // The original message should still exist
        $this->assertDatabaseHas('messages', ['id' => $originalMessage->id]);
        $this->assertDatabaseMissing('messages', ['id' => $replyMessage->id]);
    }
} 