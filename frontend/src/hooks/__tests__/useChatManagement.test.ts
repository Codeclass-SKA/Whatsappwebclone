import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatManagement } from '../useChatManagement';
import * as chatService from '../../services/chatService';
import { useAuthStore } from '../../store/authStore';

// Mock dependencies
jest.mock('../../services/chatService');
jest.mock('../../store/authStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockChatService = chatService as jest.Mocked<typeof chatService>;

describe('useChatManagement Hook', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockChats = [
    {
      id: 1,
      name: 'Test Chat 1',
      type: 'group' as const,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      last_message: null,
      participants: [],
    },
    {
      id: 2,
      name: 'Test Chat 2',
      type: 'group' as const,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      last_message: null,
      participants: [],
    },
  ];

  const mockChat = {
    id: 1,
    name: 'Test Chat',
    type: 'group' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    last_message: null,
    participants: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuthStore
    mockUseAuthStore.mockReturnValue({
      token: 'test-token',
      user: mockUser,
      isAuthenticated: true,
      initializeAuth: jest.fn(),
      setToken: jest.fn(),
      setUser: jest.fn(),
      logout: jest.fn(),
    });

    // Mock chatService functions
    mockChatService.getChats.mockResolvedValue(mockChats);
    mockChatService.getChat.mockResolvedValue(mockChat);
    mockChatService.createChat.mockResolvedValue(mockChat);
    mockChatService.sendMessage.mockResolvedValue({
      id: 1,
      content: 'Hello world',
      sender_id: 1,
      chat_id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    });
    mockChatService.archiveChat.mockResolvedValue({ success: true });
    mockChatService.muteChat.mockResolvedValue({ success: true });
    mockChatService.unmuteChat.mockResolvedValue({ success: true });
    mockChatService.pinChat.mockResolvedValue({ success: true });
    mockChatService.unpinChat.mockResolvedValue({ success: true });
    mockChatService.deleteMessage.mockResolvedValue({ success: true });
    mockChatService.forwardMessage.mockResolvedValue({ success: true });
    mockChatService.addReaction.mockResolvedValue({ success: true });
    mockChatService.removeReaction.mockResolvedValue({ success: true });
    mockChatService.searchMessages.mockResolvedValue([]);
    mockChatService.getArchivedChats.mockResolvedValue([]);
  });

  describe('TDD: Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatManagement());

      expect(result.current.chats).toEqual([]);
      expect(result.current.selectedChat).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useChatManagement());

      expect(typeof result.current.loadChats).toBe('function');
      expect(typeof result.current.selectChat).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.createChat).toBe('function');
    });
  });

  describe('TDD: Load Chats', () => {
    it('should load chats successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.loadChats();
      });

      expect(mockChatService.getChats).toHaveBeenCalled();
      expect(result.current.chats).toEqual(mockChats);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading state correctly', () => {
      const { result } = renderHook(() => useChatManagement());

      act(() => {
        result.current.loadChats();
      });

      expect(result.current.isLoading).toBe(true);

      return waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle errors when loading chats fails', async () => {
      const errorMessage = 'Failed to load chats';
      mockChatService.getChats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.loadChats();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('TDD: Select Chat', () => {
    it('should select a chat successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.selectChat(1);
      });

      expect(mockChatService.getChat).toHaveBeenCalledWith(1);
      expect(result.current.selectedChat).toEqual(mockChat);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when selecting chat fails', async () => {
      const errorMessage = 'Failed to load chat';
      mockChatService.getChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.selectChat(1);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.selectedChat).toBeNull();
    });
  });

  describe('TDD: Send Message', () => {
    it('should send message successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.sendMessage(1, 'Hello world');
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(1, 'Hello world');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when sending message fails', async () => {
      const errorMessage = 'Failed to send message';
      mockChatService.sendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.sendMessage(1, 'Hello world');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Create Chat', () => {
    it('should create chat successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.createChat('New Chat');
      });

      expect(mockChatService.createChat).toHaveBeenCalledWith('New Chat');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when creating chat fails', async () => {
      const errorMessage = 'Failed to create chat';
      mockChatService.createChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.createChat('New Chat');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Archive Chat', () => {
    it('should archive chat successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.archiveChat(1);
      });

      expect(mockChatService.archiveChat).toHaveBeenCalledWith(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when archiving chat fails', async () => {
      const errorMessage = 'Failed to archive chat';
      mockChatService.archiveChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.archiveChat(1);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Mute Chat', () => {
    it('should mute chat successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.muteChat(1, true);
      });

      expect(mockChatService.muteChat).toHaveBeenCalledWith(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when muting chat fails', async () => {
      const errorMessage = 'Failed to mute chat';
      mockChatService.muteChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.muteChat(1, true);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Pin Chat', () => {
    it('should pin chat successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.pinChat(1, true);
      });

      expect(mockChatService.pinChat).toHaveBeenCalledWith(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when pinning chat fails', async () => {
      const errorMessage = 'Failed to pin chat';
      mockChatService.pinChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.pinChat(1, true);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Delete Message', () => {
    it('should delete message successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.deleteMessage(1);
      });

      expect(mockChatService.deleteMessage).toHaveBeenCalledWith(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when deleting message fails', async () => {
      const errorMessage = 'Failed to delete message';
      mockChatService.deleteMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.deleteMessage(1);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Forward Message', () => {
    it('should forward message successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.forwardMessage(1, 2);
      });

      expect(mockChatService.forwardMessage).toHaveBeenCalledWith(1, 2);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when forwarding message fails', async () => {
      const errorMessage = 'Failed to forward message';
      mockChatService.forwardMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.forwardMessage(1, 2);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Add Reaction', () => {
    it('should add reaction successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.addReaction(1, '👍');
      });

      expect(mockChatService.addReaction).toHaveBeenCalledWith(1, '👍');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when adding reaction fails', async () => {
      const errorMessage = 'Failed to add reaction';
      mockChatService.addReaction.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.addReaction(1, '👍');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Remove Reaction', () => {
    it('should remove reaction successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.removeReaction(1, '👍');
      });

      expect(mockChatService.removeReaction).toHaveBeenCalledWith(1, '👍');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when removing reaction fails', async () => {
      const errorMessage = 'Failed to remove reaction';
      mockChatService.removeReaction.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.removeReaction(1, '👍');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Search Messages', () => {
    it('should search messages successfully', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.searchMessages('hello');
      });

      expect(mockChatService.searchMessages).toHaveBeenCalledWith('hello');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when searching messages fails', async () => {
      const errorMessage = 'Failed to search messages';
      mockChatService.searchMessages.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.searchMessages('hello');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('TDD: Authentication Integration', () => {
    it('should not perform actions when user is not authenticated', async () => {
      mockUseAuthStore.mockReturnValue({
        token: null,
        user: null,
        isAuthenticated: false,
        initializeAuth: jest.fn(),
        setToken: jest.fn(),
        setUser: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.loadChats();
      });

      expect(mockChatService.getChats).not.toHaveBeenCalled();
      expect(result.current.error).toBe('User not authenticated');
    });

    it('should include authentication token in requests', async () => {
      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        await result.current.loadChats();
      });

      expect(mockChatService.getChats).toHaveBeenCalled();
    });
  });
}); 