<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'user_id',
        'emoji'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the message that was reacted to.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the user who reacted.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the chat through the message.
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class, 'chat_id', 'id', 'messages');
    }

    /**
     * Check if the reaction is from a specific user.
     */
    public function isFromUser(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    /**
     * Get allowed emoji reactions.
     */
    public static function getAllowedEmojis(): array
    {
        return [
            '👍', '👎', '❤️', '😀', '😂', '😮', '😢', '😡', '👏', '🙏',
            '🔥', '💯', '💪', '🎉', '🎯', '💡', '⚡', '🚀', '💎', '🏆'
        ];
    }

    /**
     * Check if emoji is valid.
     */
    public static function isValidEmoji(string $emoji): bool
    {
        return in_array($emoji, self::getAllowedEmojis());
    }
}
