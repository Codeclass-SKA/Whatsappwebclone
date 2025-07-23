import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatManagement } from '../useChatManagement';
import * as chatService from '../../services/chatService';

// Mock chatService
jest.mock('../../services/chatService', () => ({
  archiveChat: jest.fn(),
  unarchiveChat: jest.fn(),
  muteChat: jest.fn(),
  unmuteChat: jest.fn(),
  pinChat: jest.fn(),
  unpinChat: jest.fn(),
  exportChat: jest.fn(),
  getArchivedChats: jest.fn(),
}));

const mockedChatService = chatService as jest.Mocked<typeof chatService>;

describe('useChatManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleArchive', () => {
    it('should archive chat successfully', async () => {
      mockedChatService.archiveChat.mockResolvedValue({ message: 'Chat archived' });
      mockedChatService.getArchivedChats.mockResolvedValue([]);

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleArchive(1, true);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.archiveChat).toHaveBeenCalledWith(1);
      expect(mockedChatService.getArchivedChats).toHaveBeenCalled();
    });

    it('should unarchive chat successfully', async () => {
      mockedChatService.unarchiveChat.mockResolvedValue({ message: 'Chat unarchived' });
      mockedChatService.getArchivedChats.mockResolvedValue([]);

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleArchive(1, false);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.unarchiveChat).toHaveBeenCalledWith(1);
      expect(mockedChatService.getArchivedChats).toHaveBeenCalled();
    });

    it('should handle archive error', async () => {
      const errorMessage = 'Archive failed';
      mockedChatService.archiveChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleArchive(1, true);
        expect(response.success).toBe(false);
        expect(response.error).toBe(errorMessage);
      });
    });
  });

  describe('handleMute', () => {
    it('should mute chat successfully', async () => {
      mockedChatService.muteChat.mockResolvedValue({ message: 'Chat muted' });

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleMute(1, true);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.muteChat).toHaveBeenCalledWith(1);
    });

    it('should unmute chat successfully', async () => {
      mockedChatService.unmuteChat.mockResolvedValue({ message: 'Chat unmuted' });

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleMute(1, false);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.unmuteChat).toHaveBeenCalledWith(1);
    });
  });

  describe('handlePin', () => {
    it('should pin chat successfully', async () => {
      mockedChatService.pinChat.mockResolvedValue({ message: 'Chat pinned' });

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handlePin(1, true);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.pinChat).toHaveBeenCalledWith(1);
    });

    it('should unpin chat successfully', async () => {
      mockedChatService.unpinChat.mockResolvedValue({ message: 'Chat unpinned' });

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handlePin(1, false);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.unpinChat).toHaveBeenCalledWith(1);
    });
  });

  describe('handleExport', () => {
    it('should export chat successfully', async () => {
      const mockResult = { 
        download_url: 'https://example.com/export.zip',
        message: 'Chat exported' 
      };
      mockedChatService.exportChat.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleExport(1);
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockResult);
      });

      expect(mockedChatService.exportChat).toHaveBeenCalledWith(1);
    });

    it('should handle export error', async () => {
      const errorMessage = 'Export failed';
      mockedChatService.exportChat.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleExport(1);
        expect(response.success).toBe(false);
        expect(response.error).toBe(errorMessage);
      });
    });
  });

  describe('loadArchivedChats', () => {
    it('should load archived chats successfully', async () => {
      const mockChats = [
        {
          id: 1,
          name: 'Archived Chat',
          type: 'private' as const,
          created_by: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_archived: true,
          is_muted: false,
          is_pinned: false,
          participants: [],
          last_message: null,
        }
      ];
      mockedChatService.getArchivedChats.mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.loadArchivedChats();
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockChats);
      });

      expect(mockedChatService.getArchivedChats).toHaveBeenCalled();
    });
  });

  describe('handleUnarchive', () => {
    it('should call handleArchive with false', async () => {
      mockedChatService.unarchiveChat.mockResolvedValue({ message: 'Chat unarchived' });
      mockedChatService.getArchivedChats.mockResolvedValue([]);

      const { result } = renderHook(() => useChatManagement());

      await act(async () => {
        const response = await result.current.handleUnarchive(1);
        expect(response.success).toBe(true);
      });

      expect(mockedChatService.unarchiveChat).toHaveBeenCalledWith(1);
    });
  });
}); 