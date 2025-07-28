<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        if ($users->count() < 2) {
            $this->command->info('Need at least 2 users to create chats. Run DatabaseSeeder first.');
            return;
        }

        // Create a private chat between first two users
        $user1 = $users->first();
        $user2 = $users->skip(1)->first();
        
        if (!Chat::whereHas('participants', function($query) use ($user1) {
            $query->where('user_id', $user1->id);
        })->whereHas('participants', function($query) use ($user2) {
            $query->where('user_id', $user2->id);
        })->where('type', 'private')->exists()) {
            
            $privateChat = Chat::create([
                'type' => 'private',
                'name' => $user2->name,
                'created_by' => $user1->id,
            ]);
            
            $privateChat->participants()->attach([$user1->id, $user2->id]);
            
            // Add some demo messages
            Message::create([
                'content' => 'Hello! How are you?',
                'sender_id' => $user1->id,
                'chat_id' => $privateChat->id,
                'message_type' => 'text',
            ]);
            
            Message::create([
                'content' => 'Hi there! I\'m doing great, thanks for asking!',
                'sender_id' => $user2->id,
                'chat_id' => $privateChat->id,
                'message_type' => 'text',
            ]);
            
            $this->command->info('Created private chat between ' . $user1->name . ' and ' . $user2->name);
        }

        // Create a group chat if we have enough users
        if ($users->count() >= 3) {
            $groupUsers = $users->take(3);
            
            if (!Chat::where('type', 'group')->where('name', 'Demo Group')->exists()) {
                $groupChat = Chat::create([
                    'type' => 'group',
                    'name' => 'Demo Group',
                    'created_by' => $user1->id,
                ]);
                
                $groupChat->participants()->attach($groupUsers->pluck('id'));
                
                // Add demo group messages
                Message::create([
                    'content' => 'Welcome to our demo group!',
                    'sender_id' => $user1->id,
                    'chat_id' => $groupChat->id,
                    'message_type' => 'text',
                ]);
                
                Message::create([
                    'content' => 'Thanks for creating this group!',
                    'sender_id' => $user2->id,
                    'chat_id' => $groupChat->id,
                    'message_type' => 'text',
                ]);
                
                $this->command->info('Created group chat: Demo Group');
            }
        }
    }
}