<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create specific users with predefined credentials
        $specificUsers = [
            [
                'name' => 'Alternative User',
                'email' => 'alternative.xen@gmail.com',
                'password' => 'bismillah',
            ],
            [
                'name' => 'User One',
                'email' => 'user1@user.com',
                'password' => 'bismillah',
            ],
            [
                'name' => 'User Two',
                'email' => 'user2@user.com',
                'password' => 'bismillah',
            ],
        ];

        foreach ($specificUsers as $userData) {
            if (!User::where('email', $userData['email'])->exists()) {
                User::create([
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'password' => bcrypt($userData['password']),
                ]);
            }
        }

        // Create test user only if it doesn't exist
        if (!User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        // Create additional test users for development if needed
        if (User::count() < 7) {
            $additionalUsers = 7 - User::count();
            User::factory($additionalUsers)->create();
        }

        // Seed demo chats and messages
        $this->call(ChatSeeder::class);
    }
}
