<?php

namespace Database\Factories;

use App\Models\MessageReaction;
use App\Models\User;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MessageReaction>
 */
class MessageReactionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = MessageReaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => Message::factory(),
            'user_id' => User::factory(),
            'emoji' => $this->faker->randomElement(MessageReaction::getAllowedEmojis()),
        ];
    }

    /**
     * Create a reaction with specific emoji.
     */
    public function withEmoji(string $emoji): static
    {
        return $this->state(fn (array $attributes) => [
            'emoji' => $emoji,
        ]);
    }

    /**
     * Create a reaction with thumbs up emoji.
     */
    public function thumbsUp(): static
    {
        return $this->withEmoji('👍');
    }

    /**
     * Create a reaction with heart emoji.
     */
    public function heart(): static
    {
        return $this->withEmoji('❤️');
    }

    /**
     * Create a reaction with laugh emoji.
     */
    public function laugh(): static
    {
        return $this->withEmoji('😂');
    }
}
