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
import api from '../api';

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

const mockedApi = api as jest.Mocked<typeof api>;

describe('Chat Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Archive Chat', () => {
    it('should archive a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat archived successfully' } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await archiveChat(chatId);

      expect(mockedApi.post).toHaveBeenCalledWith(`/chats/${chatId}/archive`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle archive chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to archive chat';
      mockedApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(archiveChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unarchive Chat', () => {
    it('should unarchive a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unarchived successfully' } };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await unarchiveChat(chatId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/archive`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unarchive chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unarchive chat';
      mockedApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unarchiveChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Mute Chat', () => {
    it('should mute a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat muted successfully' } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await muteChat(chatId);

      expect(mockedApi.post).toHaveBeenCalledWith(`/chats/${chatId}/mute`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle mute chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to mute chat';
      mockedApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(muteChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unmute Chat', () => {
    it('should unmute a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unmuted successfully' } };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await unmuteChat(chatId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/mute`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unmute chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unmute chat';
      mockedApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unmuteChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Pin Chat', () => {
    it('should pin a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat pinned successfully' } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await pinChat(chatId);

      expect(mockedApi.post).toHaveBeenCalledWith(`/chats/${chatId}/pin`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle pin chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to pin chat';
      mockedApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(pinChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Unpin Chat', () => {
    it('should unpin a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { data: { message: 'Chat unpinned successfully' } };
      mockedApi.delete.mockResolvedValue(mockResponse);

      const result = await unpinChat(chatId);

      expect(mockedApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/pin`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unpin chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to unpin chat';
      mockedApi.delete.mockRejectedValue(new Error(errorMessage));

      await expect(unpinChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Export Chat', () => {
    it('should export a chat successfully', async () => {
      const chatId = 1;
      const mockResponse = { 
        data: { 
          download_url: 'https://example.com/chat-export.zip',
          message: 'Chat exported successfully' 
        } 
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await exportChat(chatId);

      expect(mockedApi.post).toHaveBeenCalledWith(`/chats/${chatId}/export`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle export chat error', async () => {
      const chatId = 1;
      const errorMessage = 'Failed to export chat';
      mockedApi.post.mockRejectedValue(new Error(errorMessage));

      await expect(exportChat(chatId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Get Archived Chats', () => {
    it('should get archived chats successfully', async () => {
      const mockArchivedChats = [
        {
          id: 1,
          name: 'Archived Chat 1',
          type: 'private',
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
      const mockResponse = { data: { data: mockArchivedChats } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await getArchivedChats();

      expect(mockedApi.get).toHaveBeenCalledWith('/chats/archived');
      expect(result).toEqual(mockArchivedChats);
    });

    it('should handle get archived chats error', async () => {
      const errorMessage = 'Failed to get archived chats';
      mockedApi.get.mockRejectedValue(new Error(errorMessage));

      await expect(getArchivedChats()).rejects.toThrow(errorMessage);
    });
  });

  describe('Message Reactions', () => {
    describe('Add Reaction', () => {
      it('should add reaction successfully', async () => {
        const messageId = 1;
        const chatId = 1;
        const emoji = '👍';
        const mockResponse = { data: { success: true } };
        mockedApi.post.mockResolvedValue(mockResponse);

        const result = await addReaction(messageId, chatId, emoji);

        expect(mockedApi.post).toHaveBeenCalledWith(`/chats/${chatId}/messages/${messageId}/reactions`, {
          emoji
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle add reaction error', async () => {
        const messageId = 1;
        const chatId = 1;
        const emoji = '👍';
        const errorMessage = 'Failed to add reaction';
        mockedApi.post.mockRejectedValue(new Error(errorMessage));

        await expect(addReaction(messageId, chatId, emoji)).rejects.toThrow(errorMessage);
      });
    });

    describe('Remove Reaction', () => {
      it('should remove reaction successfully', async () => {
        const messageId = 1;
        const chatId = 1;
        const emoji = '👍';
        const mockResponse = { data: { success: true } };
        mockedApi.delete.mockResolvedValue(mockResponse);

        const result = await removeReaction(messageId, chatId, emoji);

        expect(mockedApi.delete).toHaveBeenCalledWith(`/chats/${chatId}/messages/${messageId}/reactions`, {
          data: { emoji }
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle remove reaction error', async () => {
        const messageId = 1;
        const chatId = 1;
        const emoji = '👍';
        const errorMessage = 'Failed to remove reaction';
        mockedApi.delete.mockRejectedValue(new Error(errorMessage));

        await expect(removeReaction(messageId, chatId, emoji)).rejects.toThrow(errorMessage);
      });
    });

    describe('Get Message Reactions', () => {
      it('should get message reactions successfully', async () => {
        const messageId = 1;
        const chatId = 1;
        const mockReactions = [
          { id: 1, emoji: '👍', user_id: 1, user: { name: 'John' } },
          { id: 2, emoji: '❤️', user_id: 2, user: { name: 'Jane' } },
        ];
        const mockResponse = { data: { data: mockReactions } };
        mockedApi.get.mockResolvedValue(mockResponse);

        const result = await getMessageReactions(messageId, chatId);

        expect(mockedApi.get).toHaveBeenCalledWith(`/chats/${chatId}/messages/${messageId}/reactions`);
        expect(result).toEqual(mockReactions);
      });

      it('should handle get message reactions error', async () => {
        const messageId = 1;
        const chatId = 1;
        const errorMessage = 'Failed to get reactions';
        mockedApi.get.mockRejectedValue(new Error(errorMessage));

        await expect(getMessageReactions(messageId, chatId)).rejects.toThrow(errorMessage);
      });
    });
  });
}); 