import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import chatService from '../services/chatService';
import type { Message } from '../types';

interface UseMessagePollingProps {
  chatId?: number;
  onMessageReceived?: (message: Message) => void;
  pollingInterval?: number; // in milliseconds
}

export const useMessagePolling = ({ 
  chatId, 
  onMessageReceived, 
  pollingInterval = 10000 // Increased from 3000 to 10000ms (10 seconds)
}: UseMessagePollingProps) => {
  const { token } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chatId || !token) return;

    const pollMessages = async () => {
      try {
        const messages = await chatService.getMessages(chatId);
        
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          
          // Check if we have a new message
          if (lastMessageIdRef.current === null) {
            // First time loading, set the last message ID
            lastMessageIdRef.current = latestMessage.id;
          } else if (latestMessage.id > lastMessageIdRef.current) {
            // New messages found
            const newMessages = messages.filter(msg => msg.id > lastMessageIdRef.current!);
            
            newMessages.forEach(message => {
              console.log('[Polling] New message received:', message);
              onMessageReceived?.(message);
            });
            
            lastMessageIdRef.current = latestMessage.id;
          }
        }
      } catch (error) {
        console.error('[Polling] Error fetching messages:', error);
      }
    };

    // Start polling
    intervalRef.current = setInterval(pollMessages, pollingInterval);

    // Initial poll
    pollMessages();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastMessageIdRef.current = null;
    };
  }, [chatId, token, onMessageReceived, pollingInterval]);

  return {
    stopPolling: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
    startPolling: () => {
      if (!intervalRef.current && chatId && token) {
        intervalRef.current = setInterval(async () => {
          try {
            const messages = await chatService.getMessages(chatId);
            if (messages.length > 0) {
              const latestMessage = messages[messages.length - 1];
              if (lastMessageIdRef.current && latestMessage.id > lastMessageIdRef.current) {
                const newMessages = messages.filter(msg => msg.id > lastMessageIdRef.current!);
                newMessages.forEach(message => onMessageReceived?.(message));
                lastMessageIdRef.current = latestMessage.id;
              }
            }
          } catch (error) {
            console.error('[Polling] Error:', error);
          }
        }, pollingInterval);
      }
    }
  };
}; 