import { useEffect, useRef } from 'react';
import echo, { updateEchoToken } from '../lib/echo';
import { useAuthStore } from '../store/authStore';
import type { Message, MessageReaction } from '../types';
import { debugEchoStructure } from '../utils/echoDebug';

interface UseEchoProps {
  chatId?: number;
  onMessageReceived?: (message: Message) => void;
  onReactionAdded?: (reaction: MessageReaction) => void;
  onReactionRemoved?: (reactionData: { id: number; message_id: number; user_id: number; emoji: string }) => void;
  onUserTyping?: (data: { user_id: number; user_name: string; is_typing: boolean }) => void;
  onUserOnlineStatus?: (data: { user_id: number; is_online: boolean; last_seen?: string }) => void;
}

export const useEcho = ({ 
  chatId, 
  onMessageReceived, 
  onReactionAdded, 
  onReactionRemoved,
  onUserTyping,
  onUserOnlineStatus
}: UseEchoProps) => {
  const { token, user } = useAuthStore();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!chatId || !token || !user) {
      console.log('[Echo] Missing required data:', { chatId, hasToken: !!token, hasUser: !!user });
      return;
    }

    console.log('[Echo] Initializing for chat:', chatId);

    // Only debug Echo structure in development
    if (process.env.NODE_ENV === 'development') {
      debugEchoStructure();
    }

    // Update Echo auth headers for Reverb using utility function
    updateEchoToken(token);

    // Add a small delay to ensure Echo is properly initialized
    const timeoutId = setTimeout(() => {
      try {
        // Check if Echo is properly initialized
        if (!echo || !echo.connector) {
          console.warn('[Echo] Echo not properly initialized, skipping channel join');
          return;
        }
        
        // Join private chat channel
        const channel = echo.private(`chat.${chatId}`);
        channelRef.current = channel;
        
        console.log('[Echo] Successfully joined channel:', `chat.${chatId}`);

      // Listen for message events
      if (onMessageReceived) {
        channel.listen('MessageSent', (data: any) => {
          console.log('[Echo] Message received:', data);
          const message: Message = {
            id: data.id,
            content: data.content,
            sender_id: data.sender_id,
            chat_id: data.chat_id,
            message_type: data.message_type,
            user: data.user,
            created_at: data.created_at,
            updated_at: data.updated_at,
            is_deleted: data.is_deleted || false,
            deleted_for_all: data.deleted_for_all || false,
          };
          onMessageReceived(message);
        });
      }

    // Listen for reaction events
    if (onReactionAdded) {
      channel.listen('MessageReactionAdded', (data: any) => {
        console.log('[Echo] Reaction added:', data);
        onReactionAdded(data.reaction);
      });
    }

    if (onReactionRemoved) {
      channel.listen('MessageReactionRemoved', (data: any) => {
        console.log('[Echo] Reaction removed:', data);
        onReactionRemoved(data);
      });
    }

    // Listen for typing events
    if (onUserTyping) {
      channel.listen('UserTyping', (data: any) => {
        console.log('[Echo] User typing:', data);
        onUserTyping(data);
      });
    }

    // Listen for user online status
    if (onUserOnlineStatus) {
      channel.listen('UserOnlineStatus', (data: any) => {
        console.log('[Echo] User online status:', data);
        onUserOnlineStatus(data);
      });
    }

    // Listen for other events
    channel.listen('MessageDeleted', (data: any) => {
      console.log('[Echo] Message deleted:', data);
    });

    channel.listen('MessageRead', (data: any) => {
      console.log('[Echo] Message read:', data);
    });

    channel.listen('ChatCreated', (data: any) => {
      console.log('[Echo] Chat created:', data);
    });

    channel.listen('UserJoinedChat', (data: any) => {
      console.log('[Echo] User joined chat:', data);
    });

    channel.listen('UserLeftChat', (data: any) => {
      console.log('[Echo] User left chat:', data);
    });

    // Cleanup on unmount
    return () => {
      try {
        if (channelRef.current) {
          console.log('[Echo] Leaving channel:', `chat.${chatId}`);
          echo.leave(`chat.${chatId}`);
          channelRef.current = null;
        }
      } catch (error) {
        console.error('[Echo] Error during cleanup:', error);
      }
    };
             } catch (error) {
         console.error('[Echo] Error initializing channel:', error);
         // Don't throw the error, just log it and continue
         // This prevents the app from crashing if Echo fails
       }
     }, 100); // 100ms delay

     // Cleanup function
     return () => {
       clearTimeout(timeoutId);
       if (channelRef.current) {
         channelRef.current.unsubscribe();
         channelRef.current = null;
       }
     };
   }, [chatId, token, user, onMessageReceived, onReactionAdded, onReactionRemoved, onUserTyping, onUserOnlineStatus]);

  // Method to send typing indicator
  const sendTyping = (isTyping: boolean) => {
    try {
      if (channelRef.current && user) {
        channelRef.current.whisper('typing', {
          user_id: user.id,
          user_name: user.name,
          is_typing: isTyping,
        });
        console.log('[Echo] Typing indicator sent:', { isTyping, userId: user.id });
      }
    } catch (error) {
      console.error('[Echo] Error sending typing indicator:', error);
    }
  };

  return {
    channel: channelRef.current,
    sendTyping,
  };
};