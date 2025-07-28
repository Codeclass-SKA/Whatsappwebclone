<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MessageForwardTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected User $otherUser;
    protected Chat $sourceChat;
    protected Chat $targetChat;
    protected Message $messageToForward;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        
        // Create source chat (where original message is)
        $this->sourceChat = Chat::factory()->create(['type' => 'private']);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'user_id' => $this->user->id
        ]);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'user_id' => $this->otherUser->id
        ]);
        
        // Create target chat (where message will be forwarded)
        $this->targetChat = Chat::factory()->create(['type' => 'private']);
        \App\Models\ChatParticipant::factory()->create([
            'chat_id' => $this->targetChat->id,
            'user_id' => $this->user->id
        ]);
        
        // Create message to forward
        $this->messageToForward = Message::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'This message will be forwarded',
            'message_type' => 'text'
        ]);
    }

    /**
     * @test
     */
    public function user_can_forward_message_to_another_chat()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->messageToForward->id}/forward", [
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'content',
                'sender_id',
                'chat_id',
                'message_type',
                'forwarded_from',
                'user' => [
                    'id',
                    'name',
                    'avatar'
                ],
                'created_at',
                'updated_at'
            ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->targetChat->id,
            'sender_id' => $this->user->id,
            'content' => $this->messageToForward->content,
            'message_type' => $this->messageToForward->message_type,
            'forwarded_from' => $this->messageToForward->id
        ]);
    }

    /**
     * @test
     */
    public function user_can_forward_message_with_file_attachment()
    {
        $messageWithFile = Message::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Document.pdf',
            'message_type' => 'document',
            'file_url' => 'uploads/documents/document.pdf'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$messageWithFile->id}/forward", [
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->targetChat->id,
            'sender_id' => $this->user->id,
            'content' => $messageWithFile->content,
            'message_type' => $messageWithFile->message_type,
            'file_url' => $messageWithFile->file_url,
            'forwarded_from' => $messageWithFile->id
        ]);
    }

    /**
     * @test
     */
    public function user_cannot_forward_message_to_chat_they_are_not_participant_of()
    {
        $unauthorizedChat = Chat::factory()->create(['type' => 'private']);

        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->messageToForward->id}/forward", [
                'target_chat_id' => $unauthorizedChat->id
            ]);

        $response->assertStatus(403);
    }

    /**
     * @test
     */
    public function user_cannot_forward_nonexistent_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/99999/forward", [
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(404);
    }

    /**
     * @test
     */
    public function user_cannot_forward_deleted_message()
    {
        $deletedMessage = Message::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Deleted message',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$deletedMessage->id}/forward", [
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function forward_requires_target_chat_id()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->messageToForward->id}/forward", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_chat_id']);
    }

    /**
     * @test
     */
    public function forward_requires_valid_target_chat_id()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->messageToForward->id}/forward", [
                'target_chat_id' => 99999
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_chat_id']);
    }

    /**
     * @test
     */
    public function forward_requires_authentication()
    {
        $response = $this->postJson("/api/messages/{$this->messageToForward->id}/forward", [
            'target_chat_id' => $this->targetChat->id
        ]);

        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function user_can_forward_multiple_messages()
    {
        $message1 = Message::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'First message'
        ]);

        $message2 = Message::factory()->create([
            'chat_id' => $this->sourceChat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second message'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/forward", [
                'message_ids' => [$message1->id, $message2->id],
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->targetChat->id,
            'sender_id' => $this->user->id,
            'content' => $message1->content,
            'forwarded_from' => $message1->id
        ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->targetChat->id,
            'sender_id' => $this->user->id,
            'content' => $message2->content,
            'forwarded_from' => $message2->id
        ]);
    }

    /**
     * @test
     */
    public function forwarded_message_includes_original_sender_info()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/messages/{$this->messageToForward->id}/forward", [
                'target_chat_id' => $this->targetChat->id
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'forwarded_from' => $this->messageToForward->id,
                'original_sender' => [
                    'id' => $this->otherUser->id,
                    'name' => $this->otherUser->name
                ]
            ]);
    }
} 