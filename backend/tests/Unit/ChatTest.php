<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_private_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $user->id
        ]);

        $this->assertInstanceOf(Chat::class, $chat);
        $this->assertEquals('private', $chat->type);
        $this->assertEquals($user->id, $chat->created_by);
    }

    /** @test */
    public function it_can_create_group_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Test Group',
            'created_by' => $user->id
        ]);

        $this->assertInstanceOf(Chat::class, $chat);
        $this->assertEquals('group', $chat->type);
        $this->assertEquals('Test Group', $chat->name);
        $this->assertEquals($user->id, $chat->created_by);
    }

    /** @test */
    public function it_can_add_participants()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);

        $chat->participants()->attach([$user->id, $otherUser->id]);

        $this->assertCount(2, $chat->participants);
        $this->assertTrue($chat->participants->contains($user));
        $this->assertTrue($chat->participants->contains($otherUser));
    }

    /** @test */
    public function it_can_remove_participants()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);

        $chat->participants()->attach([$user->id, $otherUser->id]);
        $this->assertCount(2, $chat->participants);

        $chat->participants()->detach($otherUser->id);
        
        // Refresh the relationship to get updated data
        $chat->load('participants');
        
        $this->assertCount(1, $chat->participants);
        $this->assertTrue($chat->participants->contains($user));
        $this->assertFalse($chat->participants->contains($otherUser));
    }

    /** @test */
    public function it_has_required_fields()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['created_by' => $user->id]);

        $this->assertArrayHasKey('type', $chat->toArray());
        $this->assertArrayHasKey('created_by', $chat->toArray());
        $this->assertArrayHasKey('created_at', $chat->toArray());
        $this->assertArrayHasKey('updated_at', $chat->toArray());
    }

    /** @test */
    public function it_has_name_and_avatar_when_set()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Test Group',
            'avatar' => 'test-avatar.jpg',
            'created_by' => $user->id
        ]);

        $this->assertEquals('Test Group', $chat->name);
        $this->assertEquals('test-avatar.jpg', $chat->avatar);
    }
} 