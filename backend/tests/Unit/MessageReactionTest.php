<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageReactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_create_a_reaction()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertEquals($message->id, $reaction->message_id);
        $this->assertEquals($user->id, $reaction->user_id);
        $this->assertEquals('👍', $reaction->emoji);
    }

    public function test_it_has_message_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertInstanceOf(Message::class, $reaction->message);
        $this->assertEquals($message->id, $reaction->message->id);
    }

    public function test_it_has_user_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertInstanceOf(User::class, $reaction->user);
        $this->assertEquals($user->id, $reaction->user->id);
    }

    public function test_it_can_check_if_reaction_is_from_user()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertTrue($reaction->isFromUser($user));
        $this->assertFalse($reaction->isFromUser($otherUser));
    }

    public function test_it_has_allowed_emojis()
    {
        $allowedEmojis = MessageReaction::getAllowedEmojis();

        $this->assertIsArray($allowedEmojis);
        $this->assertContains('👍', $allowedEmojis);
        $this->assertContains('❤️', $allowedEmojis);
        $this->assertContains('😂', $allowedEmojis);
    }

    public function test_it_can_validate_emoji()
    {
        $this->assertTrue(MessageReaction::isValidEmoji('👍'));
        $this->assertTrue(MessageReaction::isValidEmoji('❤️'));
        $this->assertTrue(MessageReaction::isValidEmoji('😂'));
        
        $this->assertFalse(MessageReaction::isValidEmoji('invalid_emoji'));
        $this->assertFalse(MessageReaction::isValidEmoji(''));
        $this->assertFalse(MessageReaction::isValidEmoji('😀😀')); // Multiple emojis
    }

    public function test_it_prevents_duplicate_reactions()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        // Create first reaction
        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        // Try to create duplicate reaction
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);
    }

    public function test_it_allows_different_emojis_from_same_user()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        // Create first reaction
        MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        // Create second reaction with different emoji
        $reaction2 = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '❤️'
        ]);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '❤️'
        ]);
    }

    public function test_it_cascades_when_message_is_deleted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertDatabaseHas('message_reactions', ['id' => $reaction->id]);

        // Delete the message
        $message->delete();

        $this->assertDatabaseMissing('message_reactions', ['id' => $reaction->id]);
    }

    public function test_it_cascades_when_user_is_deleted()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍'
        ]);

        $this->assertDatabaseHas('message_reactions', ['id' => $reaction->id]);

        // Delete the user
        $user->delete();

        $this->assertDatabaseMissing('message_reactions', ['id' => $reaction->id]);
    }
} 