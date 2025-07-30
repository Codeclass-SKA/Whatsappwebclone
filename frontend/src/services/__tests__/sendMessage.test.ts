import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the api module
const mockApiInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

jest.mock('../api', () => ({
  __esModule: true,
  default: mockApiInstance,
}));

// Import after mocking
import { sendMessage } from '../chatService';

describe('Chat Service - Send Message', () => {
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

    const mockResponse = { data: { data: mockMessage } };
    mockApiInstance.post.mockResolvedValue(mockResponse);

    const result = await sendMessage(1, {
      content: 'Hello world',
      type: 'text'
    });

    expect(mockApiInstance.post).toHaveBeenCalledWith('/chats/1/messages', {
      content: 'Hello world',
      type: 'text'
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

    const mockResponse = { data: { data: mockMessage } };
    mockApiInstance.post.mockResolvedValue(mockResponse);

    const result = await sendMessage(1, {
      content: 'Reply message',
      reply_to_id: 1
    });

    expect(mockApiInstance.post).toHaveBeenCalledWith('/chats/1/messages', {
      content: 'Reply message',
      reply_to_id: 1
    });

    expect(result).toEqual(mockMessage);
    expect(result.reply_to_id).toBe(1);
  });

  it('should handle send message error gracefully', async () => {
    const mockError = new Error('Validation failed');
    mockApiInstance.post.mockRejectedValue(mockError);

    await expect(sendMessage(1, {
      content: ''
    })).rejects.toThrow('Validation failed');
  });

  it('should handle network error gracefully', async () => {
    const mockError = new Error('Network Error');
    mockApiInstance.post.mockRejectedValue(mockError);

    await expect(sendMessage(1, {
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

    const mockResponse = { data: { data: mockMessage } };
    mockApiInstance.post.mockResolvedValue(mockResponse);

    const result = await sendMessage(1, {
      content: 'File message',
      type: 'file',
      file_url: 'https://example.com/file.pdf'
    });

    expect(mockApiInstance.post).toHaveBeenCalledWith('/chats/1/messages', {
      content: 'File message',
      type: 'file',
      file_url: 'https://example.com/file.pdf'
    });

    expect(result).toEqual(mockMessage);
  });
});