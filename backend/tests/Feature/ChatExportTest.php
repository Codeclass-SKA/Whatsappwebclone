<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class ChatExportTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $otherUser;
    protected $chat;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        
        $this->chat = Chat::factory()->create(['type' => 'private']);
        
        // Add both users as participants
        ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);
        ChatParticipant::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->otherUser->id,
            'role' => 'member'
        ]);
    }

    /**
     * @test
     */
    public function user_can_export_chat_history_as_json()
    {
        // Create some messages
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello, how are you?'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'I am fine, thank you!'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/json');
        
        $data = $response->json();
        $this->assertArrayHasKey('chat_info', $data);
        $this->assertArrayHasKey('messages', $data);
        $this->assertCount(2, $data['messages']);
    }

    /**
     * @test
     */
    public function user_can_export_chat_history_as_csv()
    {
        // Create some messages
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello, how are you?'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'I am fine, thank you!'
        ]);

        $response = $this->actingAs($this->user)
            ->get("/api/chats/{$this->chat->id}/export?format=csv");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="chat_export.csv"');
        
        $content = $response->getContent();
        $this->assertStringContainsString('Date,Time,Sender,Message,Type,Reply To', $content);
        $this->assertStringContainsString('Hello\\, how are you?', $content);
    }

    /**
     * @test
     */
    public function user_can_export_chat_history_as_txt()
    {
        // Create some messages
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Hello, how are you?'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'I am fine, thank you!'
        ]);

        $response = $this->actingAs($this->user)
            ->get("/api/chats/{$this->chat->id}/export?format=txt");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="chat_export.txt"');
        
        $content = $response->getContent();
        $this->assertStringContainsString('Hello, how are you?', $content);
        $this->assertStringContainsString('I am fine, thank you!', $content);
    }

    /**
     * @test
     */
    public function user_cannot_export_chat_they_are_not_participant_of()
    {
        $otherChat = Chat::factory()->create(['type' => 'private']);
        ChatParticipant::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $this->otherUser->id,
            'role' => 'member'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$otherChat->id}/export?format=json");

        $response->assertStatus(403);
    }

    /**
     * @test
     */
    public function export_requires_authentication()
    {
        $response = $this->getJson("/api/chats/{$this->chat->id}/export?format=json");
        $response->assertStatus(401);
    }

    /**
     * @test
     */
    public function export_requires_valid_format()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=invalid");

        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function export_returns_404_for_nonexistent_chat()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/999/export?format=json");

        $response->assertStatus(404);
    }

    /**
     * @test
     */
    public function export_includes_chat_metadata()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Test message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertArrayHasKey('chat_info', $data);
        $this->assertEquals($this->chat->id, $data['chat_info']['id']);
        $this->assertEquals($this->chat->type, $data['chat_info']['type']);
    }

    /**
     * @test
     */
    public function export_includes_message_metadata()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Test message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(1, $data['messages']);
        $exportedMessage = $data['messages'][0];
        
        $this->assertEquals($message->id, $exportedMessage['id']);
        $this->assertEquals($message->content, $exportedMessage['content']);
        $this->assertEquals($message->sender_id, $exportedMessage['sender_id']);
        $this->assertArrayHasKey('sender_name', $exportedMessage);
        $this->assertArrayHasKey('created_at', $exportedMessage);
    }

    /**
     * @test
     */
    public function export_excludes_deleted_messages()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Active message'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Deleted message',
            'is_deleted' => true
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(1, $data['messages']);
        $this->assertEquals('Active message', $data['messages'][0]['content']);
    }

    /**
     * @test
     */
    public function export_supports_date_range_filter()
    {
        // Create messages with different dates
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Old message',
            'created_at' => now()->subDays(10)
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Recent message',
            'created_at' => now()->subDays(2)
        ]);

        $startDate = now()->subDays(5)->format('Y-m-d');
        $endDate = now()->format('Y-m-d');

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json&start_date={$startDate}&end_date={$endDate}");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(1, $data['messages']);
        $this->assertEquals('Recent message', $data['messages'][0]['content']);
    }

    /**
     * @test
     */
    public function export_supports_pagination()
    {
        // Create 25 messages
        for ($i = 0; $i < 25; $i++) {
            Message::factory()->create([
                'chat_id' => $this->chat->id,
                'sender_id' => $this->user->id,
                'content' => "Message {$i}"
            ]);
        }

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json&per_page=10");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(10, $data['messages']);
        $this->assertArrayHasKey('pagination', $data);
        $this->assertEquals(25, $data['pagination']['total']);
        $this->assertEquals(3, $data['pagination']['last_page']);
    }

    /**
     * @test
     */
    public function export_works_with_group_chats()
    {
        $groupChat = Chat::factory()->create([
            'type' => 'group',
            'name' => 'Test Group'
        ]);
        
        ChatParticipant::factory()->create([
            'chat_id' => $groupChat->id,
            'user_id' => $this->user->id,
            'role' => 'member'
        ]);

        Message::factory()->create([
            'chat_id' => $groupChat->id,
            'sender_id' => $this->user->id,
            'content' => 'Group message'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$groupChat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertEquals('group', $data['chat_info']['type']);
        $this->assertEquals('Test Group', $data['chat_info']['name']);
        $this->assertCount(1, $data['messages']);
    }

    /**
     * @test
     */
    public function export_includes_reply_messages()
    {
        $originalMessage = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Original message'
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Reply message',
            'reply_to_id' => $originalMessage->id
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(2, $data['messages']);
        $replyMessage = collect($data['messages'])->firstWhere('content', 'Reply message');
        $this->assertNotNull($replyMessage);
        $this->assertEquals($originalMessage->id, $replyMessage['reply_to_id']);
    }

    /**
     * @test
     */
    public function export_includes_file_attachments()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'Message with file',
            'message_type' => 'file',
            'file_url' => 'https://example.com/file.pdf'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(1, $data['messages']);
        $message = $data['messages'][0];
        $this->assertEquals('file', $message['message_type']);
        $this->assertEquals('https://example.com/file.pdf', $message['file_url']);
    }

    /**
     * @test
     */
    public function export_orders_messages_by_created_at()
    {
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'content' => 'First message',
            'created_at' => now()->subHour()
        ]);
        
        Message::factory()->create([
            'chat_id' => $this->chat->id,
            'sender_id' => $this->otherUser->id,
            'content' => 'Second message',
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/chats/{$this->chat->id}/export?format=json");

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertCount(2, $data['messages']);
        $this->assertEquals('First message', $data['messages'][0]['content']);
        $this->assertEquals('Second message', $data['messages'][1]['content']);
    }
}
