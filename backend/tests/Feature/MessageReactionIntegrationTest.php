<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Events\MessageReactionAdded;
use App\Events\MessageReactionRemoved;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Broadcast;

class MessageReactionIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([
            MessageReactionAdded::class,
            MessageReactionRemoved::class,
        ]);
    }

    public function test_adding_reaction_broadcasts_event()
    {
        // Create users and chat
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        // Add users to chat
        $chat->participants()->attach([$user->id, $otherUser->id]);

        // Create message
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $otherUser->id,
        ]);

        $this->actingAs($user);

        // Add reaction
        $response = $this->postJson("/api/messages/{$message->id}/reactions", [
            'emoji' => '👍',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'message_id',
                    'user_id',
                    'emoji',
                    'created_at',
                ],
            ]);

        // Assert reaction was saved
        $reaction = MessageReaction::first();
        $this->assertEquals('👍', $reaction->emoji);
        $this->assertEquals($user->id, $reaction->user_id);

        // Assert event was broadcasted
        Event::assertDispatched(MessageReactionAdded::class, function ($event) use ($reaction) {
            return $event->reaction->id === $reaction->id;
        });

        // Verify other user can see the reaction
        $this->actingAs($otherUser);
        $response = $this->getJson("/api/messages/{$message->id}/reactions");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.emoji', '👍');
    }

    public function test_removing_reaction_broadcasts_event()
    {
        // Create users and chat
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        $chat->participants()->attach([$user->id, $otherUser->id]);

        // Create message and reaction
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $otherUser->id,
        ]);

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '👍',
        ]);

        $this->actingAs($user);

        // Remove reaction
        $response = $this->deleteJson("/api/messages/{$message->id}/reactions/{$reaction->id}");
        $response->assertStatus(200);

        // Assert reaction was deleted
        $this->assertDatabaseMissing('message_reactions', ['id' => $reaction->id]);

        // Assert event was broadcasted
        Event::assertDispatched(MessageReactionRemoved::class, function ($event) use ($reaction) {
            return $event->reactionId === $reaction->id;
        });
    }

    public function test_multiple_users_reacting_to_message()
    {
        // Create users and chat
        $users = User::factory()->count(3)->create();
        $chat = Chat::factory()->create(['type' => 'group']);
        
        $chat->participants()->attach($users->pluck('id'));

        // Create message
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $users[0]->id,
        ]);

        // Each user adds different reactions
        $emojis = ['👍', '❤️', '😂'];
        foreach ($users as $index => $user) {
            $this->actingAs($user);
            $response = $this->postJson("/api/messages/{$message->id}/reactions", [
                'emoji' => $emojis[$index],
            ]);
            $response->assertStatus(201);
        }

        // Verify all reactions are visible
        $response = $this->getJson("/api/messages/{$message->id}/reactions");
        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');

        // Assert each emoji exists in response
        $responseEmojis = collect($response->json('data'))->pluck('emoji')->all();
        foreach ($emojis as $emoji) {
            $this->assertContains($emoji, $responseEmojis);
        }

        // Assert events were broadcasted for each reaction
        Event::assertDispatched(MessageReactionAdded::class, 3);
    }

    public function test_reaction_validation_and_permissions()
    {
        // Create users and chat
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $nonMember = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        $chat->participants()->attach([$user->id, $otherUser->id]);

        // Create message
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);

        // Test invalid emoji
        $this->actingAs($otherUser);
        $response = $this->postJson("/api/messages/{$message->id}/reactions", [
            'emoji' => 'invalid',
        ]);
        $response->assertStatus(422);

        // Test non-member cannot react
        $this->actingAs($nonMember);
        $response = $this->postJson("/api/messages/{$message->id}/reactions", [
            'emoji' => '👍',
        ]);
        $response->assertStatus(403);

        // Test duplicate reaction from same user
        $this->actingAs($otherUser);
        $this->postJson("/api/messages/{$message->id}/reactions", ['emoji' => '👍']);
        $response = $this->postJson("/api/messages/{$message->id}/reactions", ['emoji' => '👍']);
        $response->assertStatus(422);
    }

    public function test_reaction_updates_in_real_time()
    {
        // Create users and chat
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        $chat->participants()->attach([$user->id, $otherUser->id]);

        // Create message
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
        ]);

        $this->actingAs($otherUser);

        // Add reaction
        $response = $this->postJson("/api/messages/{$message->id}/reactions", [
            'emoji' => '👍',
        ]);
        $reaction = MessageReaction::find($response->json('data.id'));

        // Assert event was broadcasted with correct data
        Event::assertDispatched(MessageReactionAdded::class, function ($event) use ($reaction) {
            return $event->reaction->id === $reaction->id &&
                   $event->reaction->emoji === '👍' &&
                   $event->reaction->user->id === $reaction->user_id;
        });

        // Remove reaction
        $response = $this->deleteJson("/api/messages/{$message->id}/reactions/{$reaction->id}");

        // Assert event was broadcasted with correct data
        Event::assertDispatched(MessageReactionRemoved::class, function ($event) use ($reaction) {
            return $event->reactionId === $reaction->id &&
                   $event->messageId === $reaction->message_id;
        });
    }
}