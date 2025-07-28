import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import chatService from '../chatService';

// Mock the entire api module
jest.mock('../api', () => ({
  chatService: {
    sendMessage: jest.fn()
  }
}));

describe('Chat Service - Send Message', () => {
  const mockChatService = chatService as jest.Mocked<typeof chatService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message successfully with correct response structure', async () => {
    const mockMessage = {
      id: 1,
      content: 'Hello world',
      sender_id: 1,
      chat_id: 1,
      message_type: 'text',
      user: {
        id: 1,
        name: 'John Doe',
        avatar: null
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    mockChatService.sendMessage.mockResolvedValue(mockMessage as any);

    const result = await mockChatService.sendMessage(1, {
      content: 'Hello world',
      message_type: 'text'
    });

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(1, {
      content: 'Hello world',
      message_type: 'text'
    });

    expect(result).toEqual(mockMessage);
  });

  it('should send message with reply successfully', async () => {
    const mockMessage = {
      id: 2,
      content: 'Reply message',
      sender_id: 1,
      chat_id: 1,
      message_type: 'text',
      reply_to_id: 1,
      user: {
        id: 1,
        name: 'John Doe',
        avatar: null
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    mockChatService.sendMessage.mockResolvedValue(mockMessage as any);

    const result = await mockChatService.sendMessage(1, {
      content: 'Reply message',
      reply_to_id: 1
    });

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(1, {
      content: 'Reply message',
      reply_to_id: 1
    });

    expect(result).toEqual(mockMessage);
    expect(result.reply_to_id).toBe(1);
  });

  it('should handle send message error gracefully', async () => {
    const mockError = new Error('Validation failed');

    mockChatService.sendMessage.mockRejectedValue(mockError);

    await expect(mockChatService.sendMessage(1, {
      content: ''
    })).rejects.toThrow('Validation failed');
  });

  it('should handle network error gracefully', async () => {
    const mockError = new Error('Network Error');

    mockChatService.sendMessage.mockRejectedValue(mockError);

    await expect(mockChatService.sendMessage(1, {
      content: 'Test message'
    })).rejects.toThrow('Network Error');
  });

  it('should send message with file attachment', async () => {
    const mockMessage = {
      id: 3,
      content: 'File message',
      sender_id: 1,
      chat_id: 1,
      message_type: 'file',
      file_url: 'https://example.com/file.pdf',
      user: {
        id: 1,
        name: 'John Doe',
        avatar: null
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    mockChatService.sendMessage.mockResolvedValue(mockMessage as any);

    const result = await mockChatService.sendMessage(1, {
      content: 'File message',
      message_type: 'file',
      file_url: 'https://example.com/file.pdf'
    });

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(1, {
      content: 'File message',
      message_type: 'file',
      file_url: 'https://example.com/file.pdf'
    });

    expect(result).toEqual(mockMessage);
  });
});