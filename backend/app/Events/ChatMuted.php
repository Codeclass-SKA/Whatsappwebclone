<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ChatMuted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $userId;
    public $isMuted;
    public $mutedUntil;

    /**
     * Create a new event instance.
     */
    public function __construct(int $chatId, int $userId, bool $isMuted, ?Carbon $mutedUntil = null)
    {
        $this->chatId = $chatId;
        $this->userId = $userId;
        $this->isMuted = $isMuted;
        $this->mutedUntil = $mutedUntil;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat.{$this->chatId}")
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'user_id' => $this->userId,
            'is_muted' => $this->isMuted,
            'muted_until' => $this->mutedUntil ? $this->mutedUntil->toISOString() : null,
            'timestamp' => now()->toISOString()
        ];
    }
}
