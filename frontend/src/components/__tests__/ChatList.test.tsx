import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import ChatList from '../ChatList';
import { useAuthStore } from '../../store/authStore';
import type { Chat, User } from '../../types';

// Mock useAuthStore
jest.mock('../../store/authStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('ChatList Component', () => {
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    is_online: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockOtherUser: User = {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    is_online: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockChatWithLastMessage: Chat = {
    id: 1,
    type: 'private',
    name: 'Private Chat',
    created_by: 1,
    participants: [mockUser, mockOtherUser],
    last_message: {
      id: 1,
      content: 'Hello there!',
      type: 'text',
      created_at: '2023-01-01T12:00:00Z',
      user: mockOtherUser,
    },
    is_archived: false,
    is_muted: false,
    is_pinned: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockChatWithoutLastMessage: Chat = {
    id: 2,
    type: 'private',
    name: 'Empty Chat',
    created_by: 1,
    participants: [mockUser, mockOtherUser],
    last_message: null,
    is_archived: false,
    is_muted: false,
    is_pinned: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockChatWithUndefinedUser: Chat = {
    id: 3,
    type: 'private',
    name: 'Chat with Undefined User',
    created_by: 1,
    participants: [mockUser, mockOtherUser],
    last_message: {
      id: 2,
      content: 'Message from undefined user',
      type: 'text',
      created_at: '2023-01-01T12:00:00Z',
      user: undefined as any, // This is the problematic case
    },
    is_archived: false,
    is_muted: false,
    is_pinned: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockGroupChat: Chat = {
    id: 4,
    type: 'group',
    name: 'Group Chat',
    created_by: 1,
    participants: [mockUser, mockOtherUser],
    last_message: {
      id: 3,
      content: 'Group message',
      type: 'text',
      created_at: '2023-01-01T12:00:00Z',
      user: mockOtherUser,
    },
    is_archived: false,
    is_muted: false,
    is_pinned: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      initializeAuth: jest.fn(),
    });
  });

  describe('TDD: Chat Display', () => {
    it('should render empty state when no chats', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('No chats yet')).toBeTruthy();
      expect(screen.getByText('Start a conversation with someone')).toBeTruthy();
    });

    it('should render chat list with proper chat names', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithLastMessage]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('Chats')).toBeTruthy();
      expect(screen.getByText('Private Chat')).toBeTruthy();
    });

    it('should handle chat with last message correctly', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithLastMessage]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      // Verify that the chat renders without errors
      expect(screen.getByText('Private Chat')).toBeTruthy();
    });

    it('should handle chat without last message correctly', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithoutLastMessage]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('No messages yet')).toBeTruthy();
    });
  });

  describe('TDD: Error Handling - Undefined User', () => {
    it('should handle last message with undefined user gracefully', () => {
      const onChatSelect = jest.fn();
      
      // This test should not throw an error
      expect(() => {
        render(<ChatList chats={[mockChatWithUndefinedUser]} onChatSelect={onChatSelect} />);
      }).not.toThrow();
    });

    it('should display fallback text when last message user is undefined', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithUndefinedUser]} onChatSelect={onChatSelect} />);
      
      // Should show the message content without crashing
      expect(screen.getByText('Unknown User')).toBeTruthy();
      expect(screen.getByText('Chat with Undefined User')).toBeTruthy();
    });

    it('should handle multiple chats with mixed user data', () => {
      const onChatSelect = jest.fn();
      const chats = [mockChatWithLastMessage, mockChatWithUndefinedUser, mockChatWithoutLastMessage];
      
      expect(() => {
        render(<ChatList chats={chats} onChatSelect={onChatSelect} />);
      }).not.toThrow();
      
      expect(screen.getByText('Private Chat')).toBeTruthy();
      expect(screen.getByText('Chat with Undefined User')).toBeTruthy();
      expect(screen.getByText('Empty Chat')).toBeTruthy();
    });
  });

  describe('TDD: Chat Interaction', () => {
    it('should call onChatSelect when chat is clicked', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithLastMessage]} onChatSelect={onChatSelect} />);
      
      const chatElement = screen.getByText('Private Chat').closest('[role="button"]');
      fireEvent.click(chatElement!);
      
      expect(onChatSelect).toHaveBeenCalledWith(mockChatWithLastMessage);
    });

    it('should handle multiple chat clicks', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockChatWithLastMessage, mockChatWithoutLastMessage]} onChatSelect={onChatSelect} />);
      
      const firstChat = screen.getByText('Private Chat').closest('[role="button"]');
      const secondChat = screen.getByText('Empty Chat').closest('[role="button"]');
      
      fireEvent.click(firstChat!);
      fireEvent.click(secondChat!);
      
      expect(onChatSelect).toHaveBeenCalledTimes(2);
      expect(onChatSelect).toHaveBeenCalledWith(mockChatWithLastMessage);
      expect(onChatSelect).toHaveBeenCalledWith(mockChatWithoutLastMessage);
    });
  });

  describe('TDD: Group Chat Features', () => {
    it('should display group chat with participant count', () => {
      const onChatSelect = jest.fn();
      render(<ChatList chats={[mockGroupChat]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('Group Chat')).toBeTruthy();
      expect(screen.getByText('2 participants')).toBeTruthy();
    });

    it('should display online participants for group chats', () => {
      const onlineUser: User = { ...mockOtherUser, is_online: true };
      const groupChatWithOnline: Chat = {
        ...mockGroupChat,
        participants: [mockUser, onlineUser],
      };
      
      const onChatSelect = jest.fn();
      render(<ChatList chats={[groupChatWithOnline]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('1 online')).toBeTruthy();
    });
  });

  describe('TDD: Time Formatting', () => {
    it('should format recent messages correctly', () => {
      const recentChat: Chat = {
        ...mockChatWithLastMessage,
        last_message: {
          ...mockChatWithLastMessage.last_message!,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        },
      };
      
      const onChatSelect = jest.fn();
      render(<ChatList chats={[recentChat]} onChatSelect={onChatSelect} />);
      
      expect(screen.getByText('30m ago')).toBeTruthy();
    });

    it('should format older messages correctly', () => {
      const oldChat: Chat = {
        ...mockChatWithLastMessage,
        last_message: {
          ...mockChatWithLastMessage.last_message!,
          created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        },
      };
      
      const onChatSelect = jest.fn();
      render(<ChatList chats={[oldChat]} onChatSelect={onChatSelect} />);
      
      // Check that the date is formatted (not showing "25h ago" because it's more than 24 hours)
      expect(screen.getByText(/^\d{1,2}\/\d{1,2}\/\d{4}$/)).toBeTruthy();
    });
  });
}); 