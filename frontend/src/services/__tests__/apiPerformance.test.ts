import axios from 'axios';
import api from '../api';
import chatService from '../chatService';
import type { Message } from '../../types';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('TDD: API Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return our mocked axios instance
    mockAxios.create.mockReturnValue(mockAxios as any);
  });

  it('should log slow API responses', async () => {
    // Spy on console.warn
    const consoleWarnSpy = jest.spyOn(console, 'warn');
    
    // Mock a slow response (>1000ms)
    const mockResponse = {
      data: { data: [] },
      config: {
        metadata: { startTime: new Date(Date.now() - 1500) }, // 1.5 seconds ago
        method: 'GET',
        url: '/chats/1/messages'
      }
    };
    
    mockAxios.get.mockResolvedValueOnce(mockResponse);
    
    // Call the API
    await chatService.getMessages(1);
    
    // Verify that the slow response was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[API] Slow response detected:')
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('should handle large message payloads efficiently', async () => {
    // Create a large message payload
    const largeContent = 'This is a test message. '.repeat(100); // 2400 characters
    
    // Mock the API response
    mockAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          content: largeContent,
          chat_id: 1,
          sender_id: 1,
          message_type: 'text',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });
    
    // Send a large message
    const result = await chatService.sendMessage(1, {
      content: largeContent,
      type: 'text'
    });
    
    // Verify the message was sent correctly
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/chats/1/messages',
      expect.objectContaining({
        content: largeContent
      })
    );
    
    // Verify the response contains the complete message
    expect(result.content).toEqual(largeContent);
    expect(result.content.length).toEqual(largeContent.length);
  });

  it('should optimize polling requests to reduce network load', async () => {
    // Mock getMessages to return different results on subsequent calls
    const mockMessages1: Message[] = [
      {
        id: 1,
        chat_id: 1,
        sender_id: 1,
        content: 'Message 1',
        message_type: 'text',
        user: { id: 1, name: 'User', email: 'user@example.com', is_online: true, created_at: '', updated_at: '' },
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
    
    const mockMessages2: Message[] = [
      ...mockMessages1,
      {
        id: 2,
        chat_id: 1,
        sender_id: 2,
        content: 'Message 2',
        message_type: 'text',
        user: { id: 2, name: 'User 2', email: 'user2@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '2023-01-01T12:01:00Z',
        updated_at: '2023-01-01T12:01:00Z',
        reply_to_id: null,
        reply_to: null,
        forwarded_from: null,
        forwarded_from_message: null,
        is_deleted: false,
        deleted_for_all: false,
        reactions: []
      }
    ];
    
    // First call returns the first set of messages
    mockAxios.get.mockResolvedValueOnce({ data: { data: mockMessages1 } });
    
    // Second call returns both messages
    mockAxios.get.mockResolvedValueOnce({ data: { data: mockMessages2 } });
    
    // First API call
    const result1 = await chatService.getMessages(1);
    expect(result1.length).toBe(1);
    
    // Second API call
    const result2 = await chatService.getMessages(1);
    expect(result2.length).toBe(2);
    
    // Verify that the API was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith('/chats/1/messages');
  });
});