<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->enum('message_type', ['text', 'image', 'file', 'voice', 'document', 'audio'])->default('text');
            $table->string('file_url')->nullable();
            $table->foreignId('reply_to_id')->nullable()->constrained('messages')->onDelete('set null');
            $table->foreignId('forwarded_from')->nullable()->constrained('messages')->onDelete('set null');
            $table->boolean('is_deleted')->default(false);
            $table->boolean('deleted_for_all')->default(false);
            $table->timestamps();

            $table->index(['chat_id', 'created_at']);
            $table->index(['sender_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
