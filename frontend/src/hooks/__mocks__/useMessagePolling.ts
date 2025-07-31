import { useEffect } from 'react';

interface UseMessagePollingProps {
  chatId?: number;
  onMessageReceived?: (message: any) => void;
  pollingInterval?: number; // in milliseconds
}

export const useMessagePolling = ({
  chatId,
  onMessageReceived,
  pollingInterval = 10000
}: UseMessagePollingProps) => {
  useEffect(() => {
    // This is a mock implementation that does nothing
    console.log('[Mock Polling] Initialized for chat:', chatId);
    
    return () => {
      console.log('[Mock Polling] Cleaned up for chat:', chatId);
    };
  }, [chatId]);

  return {
    isPolling: true,
    stopPolling: jest.fn(),
  };
};

export default useMessagePolling;