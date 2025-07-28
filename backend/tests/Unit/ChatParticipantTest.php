<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\ChatParticipant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatParticipantTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_chat_participant()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);

        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertInstanceOf(ChatParticipant::class, $participant);
        $this->assertEquals($chat->id, $participant->chat_id);
        $this->assertEquals($user->id, $participant->user_id);
    }

    /** @test */
    public function it_has_chat_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertInstanceOf(Chat::class, $participant->chat);
        $this->assertEquals($chat->id, $participant->chat->id);
    }

    /** @test */
    public function it_has_user_relationship()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertInstanceOf(User::class, $participant->user);
        $this->assertEquals($user->id, $participant->user->id);
    }

    /** @test */
    public function it_can_archive_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_archived' => false
        ]);

        $participant->update(['is_archived' => true]);
        $this->assertTrue($participant->fresh()->is_archived);

        $archivedParticipants = ChatParticipant::archived()->get();
        $this->assertTrue($archivedParticipants->contains($participant));

        $notArchivedParticipants = ChatParticipant::notArchived()->get();
        $this->assertFalse($notArchivedParticipants->contains($participant));
    }

    /** @test */
    public function it_can_mute_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_muted' => false
        ]);

        $muteUntil = now()->addHours(8);
        $participant->update([
            'is_muted' => true,
            'muted_until' => $muteUntil
        ]);

        $this->assertTrue($participant->fresh()->is_muted);
        $this->assertEquals(
            $muteUntil->toDateTimeString(),
            $participant->fresh()->muted_until->toDateTimeString()
        );

        $mutedParticipants = ChatParticipant::muted()->get();
        $this->assertTrue($mutedParticipants->contains($participant));

        $notMutedParticipants = ChatParticipant::notMuted()->get();
        $this->assertFalse($notMutedParticipants->contains($participant));
    }

    /** @test */
    public function it_can_check_mute_expiration()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        
        // Create participant with expired mute
        $expiredParticipant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_muted' => true,
            'muted_until' => now()->subHour()
        ]);

        // Create participant with active mute
        $activeParticipant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => User::factory()->create()->id,
            'is_muted' => true,
            'muted_until' => now()->addHour()
        ]);

        $this->assertTrue($expiredParticipant->isMuteExpired());
        $this->assertFalse($activeParticipant->isMuteExpired());
    }

    /** @test */
    public function it_can_pin_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_pinned' => false
        ]);

        $participant->update(['is_pinned' => true]);
        $this->assertTrue($participant->fresh()->is_pinned);

        $pinnedParticipants = ChatParticipant::pinned()->get();
        $this->assertTrue($pinnedParticipants->contains($participant));

        $notPinnedParticipants = ChatParticipant::notPinned()->get();
        $this->assertFalse($notPinnedParticipants->contains($participant));
    }

    /** @test */
    public function it_has_required_fields()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['type' => 'private']);
        $participant = ChatParticipant::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $participantArray = $participant->toArray();

        $this->assertArrayHasKey('chat_id', $participantArray);
        $this->assertArrayHasKey('user_id', $participantArray);
        $this->assertArrayHasKey('is_archived', $participantArray);
        $this->assertArrayHasKey('is_muted', $participantArray);
        $this->assertArrayHasKey('is_pinned', $participantArray);
        $this->assertArrayHasKey('created_at', $participantArray);
        $this->assertArrayHasKey('updated_at', $participantArray);
    }
}