import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import type { Message, MessageReaction } from '../types';

interface UseWebSocketProps {
  chatId?: number;
  onMessageReceived?: (message: Message) => void;
  onReactionAdded?: (reaction: MessageReaction) => void;
  onReactionRemoved?: (reactionData: { id: number; message_id: number; user_id: number; emoji: string }) => void;
}

export const useWebSocket = ({ 
  chatId, 
  onMessageReceived, 
  onReactionAdded, 
  onReactionRemoved 
}: UseWebSocketProps) => {
  const { token } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!chatId || !token) return;

    // Create WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:6001';
    const socket = new WebSocket(`${wsUrl}/app/chat.${chatId}?token=${token}`);
    
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[WebSocket] Connected to chat:', chatId);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', data);
        
        if (data.event === 'message.sent' && data.data) {
          const message: Message = {
            id: data.data.id,
            content: data.data.content,
            sender_id: data.data.sender_id,
            chat_id: data.data.chat_id,
            message_type: data.data.message_type,
            user: data.data.user,
            created_at: data.data.created_at,
            updated_at: data.data.updated_at,
          };
          
          onMessageReceived?.(message);
        } else if (data.event === 'message.reaction.added' && data.data?.reaction) {
          console.log('[WebSocket] Reaction added:', data.data.reaction);
          onReactionAdded?.(data.data.reaction);
        } else if (data.event === 'message.reaction.removed' && data.data) {
          console.log('[WebSocket] Reaction removed:', data.data);
          onReactionRemoved?.(data.data);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    socket.onclose = () => {
      console.log('[WebSocket] Disconnected from chat:', chatId);
    };

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [chatId, token, onMessageReceived, onReactionAdded, onReactionRemoved]);

  return socketRef.current;
}; 