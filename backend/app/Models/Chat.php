<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'avatar',
        'created_by'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created the chat.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the participants of the chat.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_participants')
            ->withTimestamps();
    }

    /**
     * Get the messages in the chat.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the last message in the chat.
     */
    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'id', 'chat_id')
            ->latest();
    }

    /**
     * Get the name for display.
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'private') {
            $otherParticipant = $this->participants()
                ->where('user_id', '!=', auth()->id())
                ->first();
            return $otherParticipant ? $otherParticipant->name : 'Unknown User';
        }

        return $this->name ?? 'Unnamed Group';
    }

    /**
     * Get the avatar for display.
     */
    public function getDisplayAvatarAttribute(): ?string
    {
        if ($this->type === 'private') {
            $otherParticipant = $this->participants()
                ->where('user_id', '!=', auth()->id())
                ->first();
            return $otherParticipant ? $otherParticipant->avatar : null;
        }

        return $this->avatar;
    }
}
