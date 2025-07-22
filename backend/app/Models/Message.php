<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'sender_id',
        'content',
        'message_type',
        'file_url',
        'reply_to_id',
        'forwarded_from',
        'is_deleted',
        'deleted_for_all'
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'deleted_for_all' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the chat that owns the message.
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Get the user who sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the message this message is replying to.
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    /**
     * Get the replies to this message.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    /**
     * Get the message this message is forwarded from.
     */
    public function forwardedFrom(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'forwarded_from');
    }

    /**
     * Get the messages that are forwarded from this message.
     */
    public function forwardedTo(): HasMany
    {
        return $this->hasMany(Message::class, 'forwarded_from');
    }

    /**
     * Get the reactions for this message.
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Scope to get only non-deleted messages.
     */
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    /**
     * Scope to get messages for a specific chat.
     */
    public function scopeForChat($query, $chatId)
    {
        return $query->where('chat_id', $chatId);
    }

    /**
     * Check if the message is from a specific user.
     */
    public function isFromUser(User $user): bool
    {
        return $this->sender_id === $user->id;
    }

    /**
     * Check if the message is forwarded.
     */
    public function isForwarded(): bool
    {
        return !is_null($this->forwarded_from);
    }

    /**
     * Mark message as deleted for sender.
     */
    public function markAsDeleted(): void
    {
        $this->update(['is_deleted' => true]);
    }

    /**
     * Mark message as deleted for all participants.
     */
    public function markAsDeletedForAll(): void
    {
        $this->update(['deleted_for_all' => true]);
    }
}
