<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\User;
use App\Models\Chat;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'content' => $this->faker->sentence(),
            'sender_id' => User::factory(),
            'chat_id' => Chat::factory(),
            'message_type' => 'text',
            'is_deleted' => false,
            'deleted_for_all' => false,
        ];
    }

    /**
     * Indicate that the message is edited.
     */
    public function deleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_deleted' => true,
        ]);
    }

    /**
     * Indicate that the message is deleted for all.
     */
    public function deletedForAll(): static
    {
        return $this->state(fn (array $attributes) => [
            'deleted_for_all' => true,
        ]);
    }

    /**
     * Create a message with specific content.
     */
    public function withContent(string $content): static
    {
        return $this->state(fn (array $attributes) => [
            'content' => $content,
        ]);
    }

    /**
     * Indicate that the message is forwarded from another message.
     */
    public function forwarded(Message $originalMessage): static
    {
        return $this->state(fn (array $attributes) => [
            'forwarded_from' => $originalMessage->id,
        ]);
    }
} 