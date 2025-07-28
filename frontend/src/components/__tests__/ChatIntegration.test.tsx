import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Chat from '../../pages/Chat';
import { useAuthStore } from '../../store/authStore';
import { echo } from '../../lib/echo';
import type { Message, User, ChatService } from '../../types';
import type { MockEcho, MockEchoChannel, MockStore } from '../../types/test';

jest.mock('../../services/api', () => ({
  chatService: {
    getChats: jest.fn(),
    getChat: jest.fn(),
    createChat: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    searchMessages: jest.fn(),
    unarchiveChat: jest.fn(),
  },
}));

// Import after mock
import chatService from '../../services/chatService';

jest.mock('../../store/authStore');
const mockUseAuthStore = useAuthStore as unknown as MockStore<{
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}>;

jest.mock('../../lib/echo', () => ({
  echo: {
    private: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  } as MockEcho,
}));

const mockEcho = echo as unknown as MockEcho;

describe('ChatIntegration', () => {
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

  const mockMessage: Message = {
    id: 1,
    chat_id: 1,
    sender_id: 2,
    content: 'Hello there!',
    message_type: 'text',
    user: mockOtherUser,
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    reply_to_id: null,
    reply_to: null,
    forwarded_from: null,
    forwarded_from_message: null,
    is_deleted: false,
    deleted_for_all: false,
    reactions: [],
  };

  let mockChannel: MockEchoChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      token: 'mock-token',
    });

    // Mock Echo channel
    mockChannel = {
      listen: jest.fn().mockReturnThis(),
      stopListening: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      leave: jest.fn(),
    };
    mockEcho.private.mockReturnValue(mockChannel);

    // Mock initial API responses
    (chatService.getChats as jest.Mock).mockResolvedValue([{
      id: 1,
      type: 'private',
      name: null,
      avatar: null,
      created_by: 1,
      participants: [mockUser, mockOtherUser],
      last_message: mockMessage,
      is_archived: false,
      is_muted: false,
      is_pinned: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }]);

    (chatService.getMessages as jest.Mock).mockResolvedValue([mockMessage]);
    (chatService.getChat as jest.Mock).mockResolvedValue({
      id: 1,
      type: 'private',
      name: null,
      avatar: null,
      created_by: 1,
      participants: [mockUser, mockOtherUser],
      last_message: mockMessage,
      is_archived: false,
      is_muted: false,
      is_pinned: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    });
  });

  describe('TDD: Basic Chat Functionality', () => {
    it('should render chat interface', async () => {
      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      // Check basic UI elements
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('New Chat')).toBeInTheDocument();
      
      // Wait for "Chats" to appear after loading
      await waitFor(() => {
        expect(screen.getByText('Chats')).toBeInTheDocument();
      });
    });

    it('should display chat list', async () => {
      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      // Wait for chat list to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Check that chat item shows last message (using more flexible selector)
      expect(screen.getByText(/Hello there!/)).toBeInTheDocument();
    });

    it('should allow selecting a chat', async () => {
      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      // Wait for chat list to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Select chat
      const chatItem = screen.getByText('Jane Smith');
      fireEvent.click(chatItem);

      // Check that chat header shows selected user
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Check that messages are displayed (use getAllByText to handle multiple instances)
      expect(screen.getAllByText(/Hello there!/)).toHaveLength(2); // One in chat list, one in message area
    });
  });

  describe('TDD: Message Handling', () => {
    it('should display existing messages when chat is selected', async () => {
      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      // Wait for chat list to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Select chat
      const chatItem = screen.getByText('Jane Smith');
      fireEvent.click(chatItem);

      // Check that existing message is displayed (use getAllByText to handle multiple instances)
      await waitFor(() => {
        expect(screen.getAllByText(/Hello there!/)).toHaveLength(2); // One in chat list, one in message area
      });
    });

    it('should show message input when chat is selected', async () => {
      render(
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      );

      // Wait for chat list to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Select chat
      const chatItem = screen.getByText('Jane Smith');
      fireEvent.click(chatItem);

      // Check that message input is available
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Message/)).toBeInTheDocument();
      });
    });
  });
});