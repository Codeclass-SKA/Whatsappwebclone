import { renderHook, act } from '@testing-library/react';
import useMessagePolling from '../useMessagePolling';
import chatService from '../../services/chatService';
import { Message } from '../../types';
import { waitFor } from '@testing-library/react';

// Mock dependencies
jest.mock('../../services/chatService');
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    token: 'mock-token',
    user: { id: 1 },
    isAuthenticated: true
  }),
}));

const mockChatService = chatService as jest.Mocked<typeof chatService>;

// Mock console.log to reduce test output noise
jest.spyOn(console, 'log').mockImplementation();


describe('TDD: useMessagePolling', () => {
  const mockMessages: Message[] = [
    {
      id: 1,
      chat_id: 1,
      sender_id: 1,
      content: 'Test message 1',
      message_type: 'text',
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        is_online: true,
        created_at: '',
        updated_at: ''
      },
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T12:00:00Z',
      reply_to_id: null,
      reply_to: null,
      forwarded_from: null,
      forwarded_from_message: null,
      is_deleted: false,
      deleted_for_all: false,
      reactions: []
    }
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockChatService.getMessages.mockResolvedValue(mockMessages);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should poll for messages at the specified interval', async () => {
    const onMessageReceived = jest.fn();
    
    renderHook(() => useMessagePolling({
      chatId: 1,
      onMessageReceived
    }));

    // Initial poll
    act(() => {
      jest.advanceTimersByTime(100); // Small advance to trigger initial poll
    });

    await waitFor(() => {
      expect(mockChatService.getMessages).toHaveBeenCalledTimes(1);
    });

    // Advance time to trigger next poll
    act(() => {
      jest.advanceTimersByTime(10000); // Default polling interval is 10000ms
    });

    await waitFor(() => {
      expect(mockChatService.getMessages).toHaveBeenCalledTimes(2);
    });
  });

  it('should poll for messages initially', async () => {
    const onMessageReceived = jest.fn();
    renderHook(() => useMessagePolling({
      chatId: 1,
      onMessageReceived
    }));

    // Initial poll (useEffect runs immediately)
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockChatService.getMessages).toHaveBeenCalledTimes(1);
    });
  });

  it('should make multiple polling requests', async () => {
    const onMessageReceived = jest.fn();
    renderHook(() => useMessagePolling({
      chatId: 1,
      onMessageReceived
    }));

    // Initial poll (useEffect runs immediately)
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // Advance time to trigger multiple polls
    for (let i = 0; i < 3; i++) {
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    }

    await waitFor(() => {
      expect(mockChatService.getMessages).toHaveBeenCalledTimes(4); // Initial + 3 more
    });
  });
});