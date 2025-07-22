<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'user_id',
        'role',
        'is_archived',
        'is_muted',
        'muted_until',
        'is_pinned',
        'joined_at'
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'is_muted' => 'boolean',
        'muted_until' => 'datetime',
        'is_pinned' => 'boolean',
        'joined_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the chat that owns the participant.
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Get the user that owns the participant.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get archived participants.
     */
    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    /**
     * Scope to get non-archived participants.
     */
    public function scopeNotArchived($query)
    {
        return $query->where('is_archived', false);
    }

    /**
     * Scope to get muted participants.
     */
    public function scopeMuted($query)
    {
        return $query->where('is_muted', true);
    }

    /**
     * Scope to get non-muted participants.
     */
    public function scopeNotMuted($query)
    {
        return $query->where('is_muted', false);
    }

    /**
     * Scope to get pinned participants.
     */
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope to get non-pinned participants.
     */
    public function scopeNotPinned($query)
    {
        return $query->where('is_pinned', false);
    }

    /**
     * Check if mute has expired.
     */
    public function isMuteExpired(): bool
    {
        if (!$this->is_muted) {
            return false;
        }

        return $this->muted_until && $this->muted_until->isPast();
    }
} 