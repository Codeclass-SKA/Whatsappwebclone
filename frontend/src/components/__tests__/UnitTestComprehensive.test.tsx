import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Import components
import Avatar from '../Avatar';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import ChatList from '../ChatList';
import NewChatModal from '../NewChatModal';
import MessageActions from '../MessageActions';
import MessageReactions from '../MessageReactions';
import ReplyMessage from '../ReplyMessage';
import ForwardMessageModal from '../ForwardMessageModal';
import MessageSearch from '../MessageSearch';

// Mock services
jest.mock('../../services/api', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../../services/chatService', () => ({
  chatService: {
    getChats: jest.fn(),
    getChat: jest.fn(),
    sendMessage: jest.fn(),
    createChat: jest.fn(),
    archiveChat: jest.fn(),
    muteChat: jest.fn(),
    pinChat: jest.fn(),
    deleteMessage: jest.fn(),
    forwardMessage: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
    searchMessages: jest.fn(),
  },
}));

// Mock hooks
jest.mock('../../hooks/useChatManagement', () => ({
  useChatManagement: () => ({
    chats: [],
    selectedChat: null,
    isLoading: false,
    error: null,
    loadChats: jest.fn(),
    selectChat: jest.fn(),
    sendMessage: jest.fn(),
    createChat: jest.fn(),
    archiveChat: jest.fn(),
    muteChat: jest.fn(),
    pinChat: jest.fn(),
    deleteMessage: jest.fn(),
    forwardMessage: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
    searchMessages: jest.fn(),
  }),
}));

// Mock store
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    initializeAuth: jest.fn(),
    clearError: jest.fn(),
  }),
}));

describe('Unit Tests: Component Functionality', () => {
  describe('TDD: Avatar Component', () => {
    it('should display user initials when no avatar is provided', () => {
      render(<Avatar src={null} alt="John Doe" size="md" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display user initials for single name', () => {
      render(<Avatar src={null} alt="John" size="md" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display user initials for multiple names', () => {
      render(<Avatar src={null} alt="John Michael Doe" size="md" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display avatar image when provided', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      render(<Avatar src={avatarUrl} alt="John Doe" size="md" />);
      const img = screen.getByAltText('John Doe');
      expect(img).toHaveAttribute('src', avatarUrl);
    });

    it('should apply correct size classes', () => {
      const { rerender } = render(<Avatar src={null} alt="John Doe" size="sm" />);
      let avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-8', 'h-8');

      rerender(<Avatar src={null} alt="John Doe" size="md" />);
      avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-10', 'h-10');

      rerender(<Avatar src={null} alt="John Doe" size="lg" />);
      avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-12', 'h-12');
    });
  });

  describe('TDD: MessageInput Component', () => {
    const mockOnSend = jest.fn();

    beforeEach(() => {
      mockOnSend.mockClear();
    });

    it('should render message input with send button', () => {
      render(<MessageInput onSend={mockOnSend} />);
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should call onSend when send button is clicked', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('should call onSend when Enter key is pressed', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/type a message/i);

      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('should not call onSend for empty messages', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should clear input after sending message', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.click(sendButton);

      expect(input).toHaveValue('');
    });
  });

  describe('TDD: MessageList Component', () => {
    const mockMessages = [
      {
        id: 1,
        content: 'Hello world',
        sender: { id: 1, name: 'User 1', avatar: null },
        chatId: 1,
        createdAt: new Date().toISOString(),
        reactions: [],
        replyTo: null,
      },
      {
        id: 2,
        content: 'Hi there!',
        sender: { id: 2, name: 'User 2', avatar: null },
        chatId: 1,
        createdAt: new Date().toISOString(),
        reactions: [],
        replyTo: null,
      },
    ];

    it('should render list of messages', () => {
      render(<MessageList messages={mockMessages} currentUserId={1} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should display sender names', () => {
      render(<MessageList messages={mockMessages} currentUserId={1} />);
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });

    it('should apply different styles for own messages', () => {
      render(<MessageList messages={mockMessages} currentUserId={1} />);
      const ownMessage = screen.getByText('Hello world').closest('.message');
      const otherMessage = screen.getByText('Hi there!').closest('.message');
      
      expect(ownMessage).toHaveClass('own-message');
      expect(otherMessage).not.toHaveClass('own-message');
    });

    it('should handle empty messages list', () => {
      render(<MessageList messages={[]} currentUserId={1} />);
      expect(screen.getByText(/no messages/i)).toBeInTheDocument();
    });
  });

  describe('TDD: ChatList Component', () => {
    const mockChats = [
      {
        id: 1,
        name: 'Test Chat 1',
        type: 'group',
        lastMessage: {
          id: 1,
          content: 'Hello world',
          sender: { id: 1, name: 'User 1' },
          createdAt: new Date().toISOString(),
        },
        unreadCount: 2,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Test Chat 2',
        type: 'private',
        lastMessage: {
          id: 2,
          content: 'Hi there!',
          sender: { id: 2, name: 'User 2' },
          createdAt: new Date().toISOString(),
        },
        unreadCount: 0,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should render list of chats', () => {
      render(<ChatList chats={mockChats} selectedChatId={null} onChatSelect={jest.fn()} />);
      expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
      expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
    });

    it('should display last message content', () => {
      render(<ChatList chats={mockChats} selectedChatId={null} onChatSelect={jest.fn()} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should display unread count', () => {
      render(<ChatList chats={mockChats} selectedChatId={null} onChatSelect={jest.fn()} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should call onChatSelect when chat is clicked', () => {
      const mockOnChatSelect = jest.fn();
      render(<ChatList chats={mockChats} selectedChatId={null} onChatSelect={mockOnChatSelect} />);
      
      fireEvent.click(screen.getByText('Test Chat 1'));
      expect(mockOnChatSelect).toHaveBeenCalledWith(1);
    });

    it('should highlight selected chat', () => {
      render(<ChatList chats={mockChats} selectedChatId={1} onChatSelect={jest.fn()} />);
      const selectedChat = screen.getByText('Test Chat 1').closest('.chat-item');
      expect(selectedChat).toHaveClass('selected');
    });

    it('should handle empty chats list', () => {
      render(<ChatList chats={[]} selectedChatId={null} onChatSelect={jest.fn()} />);
      expect(screen.getByText(/no chats/i)).toBeInTheDocument();
    });
  });

  describe('TDD: NewChatModal Component', () => {
    const mockOnCreate = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
      mockOnCreate.mockClear();
      mockOnClose.mockClear();
    });

    it('should render modal with form', () => {
      render(<NewChatModal isOpen={true} onCreate={mockOnCreate} onClose={mockOnClose} />);
      expect(screen.getByText(/new chat/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/chat name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should call onCreate when form is submitted', () => {
      render(<NewChatModal isOpen={true} onCreate={mockOnCreate} onClose={mockOnClose} />);
      const nameInput = screen.getByPlaceholderText(/chat name/i);
      const createButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'New Test Chat' } });
      fireEvent.click(createButton);

      expect(mockOnCreate).toHaveBeenCalledWith('New Test Chat');
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<NewChatModal isOpen={true} onCreate={mockOnCreate} onClose={mockOnClose} />);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not render when isOpen is false', () => {
      render(<NewChatModal isOpen={false} onCreate={mockOnCreate} onClose={mockOnClose} />);
      expect(screen.queryByText(/new chat/i)).not.toBeInTheDocument();
    });
  });

  describe('TDD: MessageActions Component', () => {
    const mockOnReply = jest.fn();
    const mockOnForward = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
      mockOnReply.mockClear();
      mockOnForward.mockClear();
      mockOnDelete.mockClear();
    });

    it('should render action buttons', () => {
      render(
        <MessageActions
          messageId={1}
          onReply={mockOnReply}
          onForward={mockOnForward}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forward/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should call onReply when reply button is clicked', () => {
      render(
        <MessageActions
          messageId={1}
          onReply={mockOnReply}
          onForward={mockOnForward}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /reply/i }));
      expect(mockOnReply).toHaveBeenCalledWith(1);
    });

    it('should call onForward when forward button is clicked', () => {
      render(
        <MessageActions
          messageId={1}
          onReply={mockOnReply}
          onForward={mockOnForward}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /forward/i }));
      expect(mockOnForward).toHaveBeenCalledWith(1);
    });

    it('should call onDelete when delete button is clicked', () => {
      render(
        <MessageActions
          messageId={1}
          onReply={mockOnReply}
          onForward={mockOnForward}
          onDelete={mockOnDelete}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('TDD: MessageReactions Component', () => {
    const mockReactions = [
      { id: 1, emoji: '👍', count: 3, users: [1, 2, 3] },
      { id: 2, emoji: '❤️', count: 1, users: [1] },
    ];

    it('should render reactions', () => {
      render(<MessageReactions reactions={mockReactions} messageId={1} onAddReaction={jest.fn()} />);
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should call onAddReaction when reaction is clicked', () => {
      const mockOnAddReaction = jest.fn();
      render(<MessageReactions reactions={mockReactions} messageId={1} onAddReaction={mockOnAddReaction} />);
      
      fireEvent.click(screen.getByText('👍'));
      expect(mockOnAddReaction).toHaveBeenCalledWith(1, '👍');
    });

    it('should handle empty reactions', () => {
      render(<MessageReactions reactions={[]} messageId={1} onAddReaction={jest.fn()} />);
      expect(screen.queryByText('👍')).not.toBeInTheDocument();
    });
  });

  describe('TDD: ReplyMessage Component', () => {
    const mockReplyTo = {
      id: 1,
      content: 'Original message',
      sender: { id: 1, name: 'User 1' },
    };

    it('should render reply preview', () => {
      render(<ReplyMessage replyTo={mockReplyTo} onCancel={jest.fn()} />);
      expect(screen.getByText('Original message')).toBeInTheDocument();
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn();
      render(<ReplyMessage replyTo={mockReplyTo} onCancel={mockOnCancel} />);
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not render when replyTo is null', () => {
      render(<ReplyMessage replyTo={null} onCancel={jest.fn()} />);
      expect(screen.queryByText('Original message')).not.toBeInTheDocument();
    });
  });

  describe('TDD: ForwardMessageModal Component', () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', type: 'private', participants: [], avatar: null },
      { id: 2, name: 'Chat 2', type: 'group', participants: [], avatar: null },
    ];

    const mockMessage = {
      id: 1,
      chat_id: 3,
      sender_id: 1,
      content: 'Test message to forward',
      message_type: 'text',
      user: { id: 1, name: 'John Doe' },
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

    // Mock chatService
    jest.mock('../../services/chatService', () => ({
      getChats: jest.fn(() => Promise.resolve(mockChats)),
    }));

    it('should render modal with chat list', async () => {
      render(
        <ForwardMessageModal
          isOpen={true}
          message={mockMessage}
          onForward={jest.fn()}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Forward Message')).toBeInTheDocument();
        expect(screen.getByText('Chat 1')).toBeInTheDocument();
        expect(screen.getByText('Chat 2')).toBeInTheDocument();
      });
    });

    it('should call onForward when chat is selected', async () => {
      const mockOnForward = jest.fn();
      render(
        <ForwardMessageModal
          isOpen={true}
          message={mockMessage}
          onForward={mockOnForward}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Chat 1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Chat 1'));
      fireEvent.click(screen.getByText('Forward'));
      expect(mockOnForward).toHaveBeenCalledWith(1);
    });

    it('should not render when isOpen is false', () => {
      render(
        <ForwardMessageModal
          isOpen={false}
          message={mockMessage}
          onForward={jest.fn()}
          onClose={jest.fn()}
        />
      );
      expect(screen.queryByText('Forward Message')).not.toBeInTheDocument();
    });
  });

  describe('TDD: MessageSearch Component', () => {
    const mockOnMessageSelect = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
      mockOnMessageSelect.mockClear();
      mockOnClose.mockClear();
      // Mock fetch
      global.fetch = jest.fn();
    });

    it('should render search input', () => {
      render(
        <MessageSearch
          chatId={1}
          isOpen={true}
          onClose={mockOnClose}
          onMessageSelect={mockOnMessageSelect}
        />
      );
      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    it('should call onMessageSelect when message is clicked', async () => {
      const mockResults = [
        {
          id: 1,
          content: 'Test message',
          user: { name: 'John Doe', avatar: null },
          created_at: '2023-01-01T12:00:00Z',
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResults }),
      });

      render(
        <MessageSearch
          chatId={1}
          isOpen={true}
          onClose={mockOnClose}
          onMessageSelect={mockOnMessageSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test message'));
      expect(mockOnMessageSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    it('should debounce search calls', async () => {
      jest.useFakeTimers();
      
      render(
        <MessageSearch
          chatId={1}
          isOpen={true}
          onClose={mockOnClose}
          onMessageSelect={mockOnMessageSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search messages...');

      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      jest.runAllTimers();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/messages/search?q=test&chat_id=1'),
          expect.any(Object)
        );
      });

      jest.useRealTimers();
    });

    it('should not render when isOpen is false', () => {
      render(
        <MessageSearch
          chatId={1}
          isOpen={false}
          onClose={mockOnClose}
          onMessageSelect={mockOnMessageSelect}
        />
      );
      expect(screen.queryByPlaceholderText('Search messages...')).not.toBeInTheDocument();
    });
  });
}); 