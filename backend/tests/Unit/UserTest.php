<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_user()
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $user = User::create($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
        $this->assertTrue(password_verify('password123', $user->password));
    }

    /** @test */
    public function it_can_update_user_status()
    {
        $user = User::factory()->create();

        $user->update(['status' => 'Available']);

        $this->assertEquals('Available', $user->fresh()->status);
    }

    /** @test */
    public function it_can_update_user_bio()
    {
        $user = User::factory()->create();

        $user->update(['bio' => 'Hello, I am a developer']);

        $this->assertEquals('Hello, I am a developer', $user->fresh()->bio);
    }

    /** @test */
    public function it_can_update_last_seen()
    {
        $user = User::factory()->create();
        $now = now();

        $user->update(['last_seen' => $now]);

        $this->assertEquals($now->toDateTimeString(), $user->fresh()->last_seen->toDateTimeString());
    }

    /** @test */
    public function it_can_toggle_online_status()
    {
        $user = User::factory()->create(['is_online' => false]);

        $user->update(['is_online' => true]);

        $this->assertTrue($user->fresh()->is_online);
    }

    /** @test */
    public function it_has_required_fields()
    {
        $user = User::factory()->create();

        $this->assertArrayHasKey('name', $user->toArray());
        $this->assertArrayHasKey('email', $user->toArray());
        $this->assertArrayHasKey('status', $user->toArray());
        $this->assertArrayHasKey('bio', $user->toArray());
        $this->assertArrayHasKey('last_seen', $user->toArray());
        $this->assertArrayHasKey('is_online', $user->toArray());
    }
} 