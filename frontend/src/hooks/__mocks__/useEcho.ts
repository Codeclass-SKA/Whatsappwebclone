import { useEffect } from 'react';

interface UseEchoProps {
  chatId?: number;
  onMessageReceived?: (message: any) => void;
  onReactionAdded?: (reaction: any) => void;
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
  useEffect(() => {
    // This is a mock implementation that does nothing
    console.log('[Mock Echo] Initialized for chat:', chatId);
    
    return () => {
      console.log('[Mock Echo] Cleaned up for chat:', chatId);
    };
  }, [chatId]);

  return {
    connected: true,
    disconnect: jest.fn(),
  };
};

export default useEcho;