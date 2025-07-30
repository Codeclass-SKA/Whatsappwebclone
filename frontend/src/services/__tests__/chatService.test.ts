import { 
  archiveChat, 
  unarchiveChat, 
  muteChat, 
  unmuteChat, 
  pinChat, 
  unpinChat, 
  exportChat, 
  getArchivedChats,
  addReaction,
  removeReaction,
  getMessageReactions
} from '../chatService';

// Mock the api module
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Import the mocked api after mocking
import api from '../api';

const mockApi = api as jest.Mocked<typeof api>;

describe('Chat Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Archive Chat', () => {
    it('should archive a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat archived successfully' } };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await archiveChat(chatId);

      expect(mockApi.post).toHaveBeenCalledWith(`/chats/${chatId}/archive`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle archive chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to archive chat';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(archiveChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unarchive Chat', () => {
    it('should unarchive a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unarchived successfully' } };
      mockApi.delete.mockResolvedValue(mockResponse);

      const result = await unarchiveChat(chatId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/archive`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unarchive chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unarchive chat';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unarchiveChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Mute Chat', () => {
    it('should mute a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat muted successfully' } };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await muteChat(chatId);

      expect(mockApi.post).toHaveBeenCalledWith(`/chats/${chatId}/mute`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle mute chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to mute chat';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(muteChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unmute Chat', () => {
    it('should unmute a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unmuted successfully' } };
      mockApi.delete.mockResolvedValue(mockResponse);

      const result = await unmuteChat(chatId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/mute`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unmute chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unmute chat';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unmuteChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Pin Chat', () => {
    it('should pin a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat pinned successfully' } };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await pinChat(chatId);

      expect(mockApi.post).toHaveBeenCalledWith(`/chats/${chatId}/pin`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle pin chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to pin chat';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(pinChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unpin Chat', () => {
    it('should unpin a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unpinned successfully' } };
      mockApi.delete.mockResolvedValue(mockResponse);

      const result = await unpinChat(chatId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/pin`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unpin chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unpin chat';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unpinChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Export Chat', () => {
    it('should export a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat exported successfully', file_url: 'export.pdf' } };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await exportChat(chatId);

      expect(mockApi.post).toHaveBeenCalledWith(`/chats/${chatId}/export`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle export chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to export chat';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(exportChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Get Archived Chats', () => {
    it('should get archived chats successfully', async () => {
      const mockChats = [
        { id: 1, name: 'Archived Chat 1', type: 'private' },
        { id: 2, name: 'Archived Chat 2', type: 'group' }
      ];
      const mockResponse = { data: { data: mockChats } };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getArchivedChats();

      expect(mockApi.get).toHaveBeenCalledWith('/chats/archived');
      expect(result).toEqual(mockChats);
    });

    it('should handle get archived chats error', async () => {
      const errorMessage = 'Failed to get archived chats';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      await expect(getArchivedChats()).rejects.toThrow(errorMessage);
    });
  });

  describe('Message Reactions', () => {
    describe('Add Reaction', () => {
      it('should add reaction successfully', async () => {
        const messageId = 1;
        const emoji = '👍';
        const mockResponse = { data: { message: 'Reaction added successfully' } };
        mockApi.post.mockResolvedValue(mockResponse);

        const result = await addReaction(messageId, emoji);

        expect(mockApi.post).toHaveBeenCalledWith(`/messages/${messageId}/reactions`, {
          emoji
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle add reaction error', async () => {
        const messageId = 1;
        const emoji = '👍';
        const errorMessage = 'Failed to add reaction';
        mockApi.post.mockRejectedValue(new Error(errorMessage));

        await expect(addReaction(messageId, emoji)).rejects.toThrow(errorMessage);
      });
    });

    describe('Remove Reaction', () => {
      it('should remove reaction successfully', async () => {
        const messageId = 1;
        const emoji = '👍';
        const mockResponse = { data: { message: 'Reaction removed successfully' } };
        mockApi.delete.mockResolvedValue(mockResponse);

        const result = await removeReaction(messageId, emoji);

        expect(mockApi.delete).toHaveBeenCalledWith(`/messages/${messageId}/reactions`, {
          data: { emoji }
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle remove reaction error', async () => {
        const messageId = 1;
        const emoji = '👍';
        const errorMessage = 'Failed to remove reaction';
        mockApi.delete.mockRejectedValue(new Error(errorMessage));

        await expect(removeReaction(messageId, emoji)).rejects.toThrow(errorMessage);
      });
    });

    describe('Get Message Reactions', () => {
      it('should get message reactions successfully', async () => {
        const messageId = 1;
        const chatId = 1;
        const mockReactions = [
          { id: 1, emoji: '👍', user_id: 1 },
          { id: 2, emoji: '❤️', user_id: 2 }
        ];
        const mockResponse = { data: { data: mockReactions } };
        mockApi.get.mockResolvedValue(mockResponse);

        const result = await getMessageReactions(messageId, chatId);

        expect(mockApi.get).toHaveBeenCalledWith(`/chats/${chatId}/messages/${messageId}/reactions`);
        expect(result).toEqual(mockReactions);
      });

      it('should handle get message reactions error', async () => {
        const messageId = 1;
        const chatId = 1;
        const errorMessage = 'Failed to get message reactions';
        mockApi.get.mockRejectedValue(new Error(errorMessage));

        await expect(getMessageReactions(messageId, chatId)).rejects.toThrow(errorMessage);
      });
    });
  });
}); 