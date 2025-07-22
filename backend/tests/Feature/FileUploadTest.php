<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('public');
        
        $this->user = User::factory()->create();
        $this->chat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $this->user->id,
        ]);
        
        $this->chat->participants()->attach($this->user->id);
    }

    public function test_user_can_upload_image()
    {
        $file = UploadedFile::fake()->image('test-image.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'image'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'user_id',
                    'chat_id',
                    'message_type',
                    'file_url',
                    'file_name',
                    'file_size',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'message_type' => 'image'
        ]);

        Storage::disk('public')->assertExists('uploads/images/' . $file->hashName());
    }

    public function test_user_can_upload_document()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1024);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'document'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'user_id',
                    'chat_id',
                    'message_type',
                    'file_url',
                    'file_name',
                    'file_size',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'message_type' => 'document'
        ]);

        Storage::disk('public')->assertExists('uploads/documents/' . $file->hashName());
    }

    public function test_user_can_upload_audio()
    {
        $file = UploadedFile::fake()->create('audio.mp3', 2048);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'audio'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'content',
                    'user_id',
                    'chat_id',
                    'message_type',
                    'file_url',
                    'file_name',
                    'file_size',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'sender_id' => $this->user->id,
            'message_type' => 'audio'
        ]);

        Storage::disk('public')->assertExists('uploads/audios/' . $file->hashName());
    }

    public function test_user_cannot_upload_unauthorized_file_type()
    {
        $file = UploadedFile::fake()->create('script.exe', 1024);

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'executable'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_user_cannot_upload_file_exceeding_size_limit()
    {
        $file = UploadedFile::fake()->create('large-file.pdf', 10240); // 10MB

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'document'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_user_cannot_upload_to_unauthorized_chat()
    {
        $unauthorizedChat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => User::factory()->create()->id,
        ]);

        $file = UploadedFile::fake()->image('test-image.jpg');

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$unauthorizedChat->id}/upload", [
                'file' => $file,
                'type' => 'image'
            ]);

        $response->assertStatus(403);
    }

    public function test_upload_requires_authentication()
    {
        $file = UploadedFile::fake()->image('test-image.jpg');

        $response = $this->postJson("/api/chats/{$this->chat->id}/upload", [
            'file' => $file,
            'type' => 'image'
        ]);

        $response->assertStatus(401);
    }

    public function test_upload_requires_file_parameter()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'type' => 'image'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_requires_type_parameter()
    {
        $file = UploadedFile::fake()->image('test-image.jpg');

        $response = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_user_can_download_uploaded_file()
    {
        $file = UploadedFile::fake()->image('test-image.jpg');
        
        $uploadResponse = $this->actingAs($this->user)
            ->postJson("/api/chats/{$this->chat->id}/upload", [
                'file' => $file,
                'type' => 'image'
            ]);

        $messageId = $uploadResponse->json('data.id');

        $downloadResponse = $this->actingAs($this->user)
            ->get("/api/messages/{$messageId}/download");

        $downloadResponse->assertStatus(200);
    }

    public function test_user_cannot_download_unauthorized_file()
    {
        $otherUser = User::factory()->create();
        $otherChat = Chat::factory()->create([
            'type' => 'private',
            'created_by' => $otherUser->id,
        ]);
        
        $otherChat->participants()->attach($otherUser->id);

        $file = UploadedFile::fake()->image('test-image.jpg');
        
        $uploadResponse = $this->actingAs($otherUser)
            ->postJson("/api/chats/{$otherChat->id}/upload", [
                'file' => $file,
                'type' => 'image'
            ]);

        $messageId = $uploadResponse->json('data.id');

        $downloadResponse = $this->actingAs($this->user)
            ->get("/api/messages/{$messageId}/download");

        $downloadResponse->assertStatus(403);
    }
} 