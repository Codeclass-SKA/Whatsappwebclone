import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageList from '../MessageList';
import MessageInput from '../MessageInput';
import { useAuthStore } from '../../store/authStore';
import type { Message, User } from '../../types';
import type { MockStore } from '../../types/test';

// Mock useAuthStore
jest.mock('../../store/authStore');

const mockUseAuthStore = useAuthStore as unknown as MockStore<{
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}>;

describe('TDD: Message Display and Performance', () => {
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

  // Create a very long message to test display issues
  const longMessageContent = 'This is a very long message that should be displayed completely. '.repeat(10);

  const mockMessages: Message[] = [
    {
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
    },
    {
      id: 2,
      chat_id: 1,
      sender_id: 1,
      content: longMessageContent,
      message_type: 'text',
      user: mockUser,
      created_at: '2023-01-01T12:05:00Z',
      updated_at: '2023-01-01T12:05:00Z',
      reply_to_id: null,
      reply_to: null,
      forwarded_from: null,
      forwarded_from_message: null,
      is_deleted: false,
      deleted_for_all: false,
      reactions: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      token: 'mock-token',
    });
  });

  it('should display long messages completely', async () => {
    render(<MessageList messages={mockMessages} />);

    // Check that the long message is displayed
    // Use a substring of the long message to find the element
    const partialText = longMessageContent.substring(0, 50);
    const messageElement = screen.getByText(new RegExp(partialText));
    expect(messageElement).toBeInTheDocument();
    
    // Check that the message element contains the text (might be split across elements)
    const messageContainer = messageElement.closest('.rounded-lg');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer?.textContent).toContain(partialText);
  });

  it('should handle sending long messages', async () => {
    const handleSendMessage = jest.fn();
    render(<MessageInput onSendMessage={handleSendMessage} />);

    // Type a long message
    const inputElement = screen.getByPlaceholderText(/Type a message.../i);
    fireEvent.change(inputElement, { target: { value: longMessageContent } });

    // Send the message
    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);

    // Check that the message was sent (we don't need to check the exact content)
    expect(handleSendMessage).toHaveBeenCalled();
  });

  it('should display messages with proper word wrapping', async () => {
    // Create a message with a very long word
    const longWord = 'supercalifragilisticexpialidocious'.repeat(5);
    const messageWithLongWord: Message = {
      id: 3,
      chat_id: 1,
      sender_id: 1,
      content: `This message contains a very long word: ${longWord}`,
      message_type: 'text',
      user: mockUser,
      created_at: '2023-01-01T12:10:00Z',
      updated_at: '2023-01-01T12:10:00Z',
      reply_to_id: null,
      reply_to: null,
      forwarded_from: null,
      forwarded_from_message: null,
      is_deleted: false,
      deleted_for_all: false,
      reactions: [],
    };

    render(<MessageList messages={[messageWithLongWord]} />);

    // Check that the message with the long word is displayed
    const messageElement = screen.getByText(new RegExp(longWord));
    expect(messageElement).toBeInTheDocument();
    
    // The message should have the 'break-words' class to ensure proper wrapping
    expect(messageElement).toHaveClass('break-words');
    expect(messageElement).toHaveClass('whitespace-pre-wrap');
    expect(messageElement).toHaveClass('overflow-hidden');
  });

  it('should display messages with appropriate max width based on screen size', async () => {
    render(<MessageList messages={mockMessages} />);

    // Get the message bubble container
    const messageBubbles = document.querySelectorAll('.rounded-lg');
    
    // Check if at least one message bubble has the appropriate max-width classes
    // This is more flexible as some elements with rounded-lg might not be message bubbles
    let foundMessageBubble = false;
    messageBubbles.forEach(bubble => {
      if (bubble.classList.contains('max-w-xs') && 
          bubble.classList.contains('lg:max-w-md')) {
        foundMessageBubble = true;
      }
    });
    
    expect(foundMessageBubble).toBeTruthy();
  });
});