<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class ChatParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'user_id',
        'is_archived',
        'is_muted',
        'is_pinned',
        'muted_until',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'is_muted' => 'boolean',
        'is_pinned' => 'boolean',
        'muted_until' => 'datetime',
    ];

    protected $attributes = [
        'is_archived' => false,
        'is_muted' => false,
        'is_pinned' => false,
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeMuted($query)
    {
        return $query->where('is_muted', true)
            ->where(function ($q) {
                $q->whereNull('muted_until')
                    ->orWhere('muted_until', '>', now());
            });
    }

    public function scopeNotMuted($query)
    {
        return $query->where('is_muted', false)
            ->orWhere(function ($q) {
                $q->where('is_muted', true)
                    ->where('muted_until', '<=', now());
            });
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeNotArchived($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeNotPinned($query)
    {
        return $query->where('is_pinned', false);
    }

    public function isMuteExpired(): bool
    {
        if (!$this->is_muted) {
            return false;
        }

        if ($this->muted_until === null) {
            return false;
        }

        return $this->muted_until->isPast();
    }

    public function mute(?Carbon $until = null): void
    {
        $this->update([
            'is_muted' => true,
            'muted_until' => $until,
        ]);
    }

    public function unmute(): void
    {
        $this->update([
            'is_muted' => false,
            'muted_until' => null,
        ]);
    }

    public function archive(): void
    {
        $this->update(['is_archived' => true]);
    }

    public function unarchive(): void
    {
        $this->update(['is_archived' => false]);
    }

    public function pin(): void
    {
        $this->update(['is_pinned' => true]);
    }

    public function unpin(): void
    {
        $this->update(['is_pinned' => false]);
    }
}