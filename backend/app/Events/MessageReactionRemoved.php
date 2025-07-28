<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionRemoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reactionId;
    public $messageId;
    public $userId;
    public $chatId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $reactionId, int $messageId, int $userId, int $chatId)
    {
        $this->reactionId = $reactionId;
        $this->messageId = $messageId;
        $this->userId = $userId;
        $this->chatId = $chatId;
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
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'reaction_id' => $this->reactionId,
            'message_id' => $this->messageId,
            'user_id' => $this->userId,
            'chat_id' => $this->chatId
        ];
    }
}
