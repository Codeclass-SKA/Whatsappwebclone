<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_chats_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        $chat->participants()->attach($user->id);

        $this->assertInstanceOf(Chat::class, $user->chats->first());
        $this->assertEquals(1, $user->chats->count());
    }

    public function test_user_has_messages_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        $chat->participants()->attach($user->id);
        
        $message = Message::factory()->create([
            'sender_id' => $user->id,
            'chat_id' => $chat->id
        ]);

        $this->assertInstanceOf(Message::class, $user->messages->first());
        $this->assertEquals(1, $user->messages->count());
    }

    public function test_user_has_sent_messages_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create();
        $chat->participants()->attach($user->id);
        
        $message = Message::factory()->create([
            'sender_id' => $user->id,
            'chat_id' => $chat->id
        ]);

        $this->assertInstanceOf(Message::class, $user->sentMessages->first());
        $this->assertEquals($user->id, $user->sentMessages->first()->sender_id);
    }

    public function test_user_can_check_is_online_status()
    {
        $user = User::factory()->create([
            'is_online' => true
        ]);

        $this->assertTrue($user->is_online);

        $user->is_online = false;
        $user->save();

        $this->assertFalse($user->is_online);
    }

    public function test_user_has_avatar_attribute()
    {
        $user = User::factory()->create([
            'avatar' => 'default-avatar.png'
        ]);

        $this->assertEquals('default-avatar.png', $user->avatar);
    }

    public function test_user_has_status_attribute()
    {
        $user = User::factory()->create([
            'status' => 'Available'
        ]);

        $this->assertEquals('Available', $user->status);
    }

    public function test_user_has_last_seen_attribute()
    {
        $user = User::factory()->create([
            'last_seen' => now()
        ]);

        $this->assertNotNull($user->last_seen);
    }

    public function test_user_can_be_created_with_all_attributes()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'avatar' => 'test-avatar.png',
            'status' => 'Testing',
            'is_online' => true,
            'last_seen' => now()
        ];

        $user = User::create($userData);

        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('test-avatar.png', $user->avatar);
        $this->assertEquals('Testing', $user->status);
        $this->assertTrue($user->is_online);
        $this->assertNotNull($user->last_seen);
    }
}