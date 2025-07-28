import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageReactions from '../MessageReactions';
import { addReaction, removeReaction } from '../../services/chatService';
import type { MessageReaction } from '../../types';

// Mock the chatService
jest.mock('../../services/chatService', () => ({
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
}));

const mockAddReaction = addReaction as jest.MockedFunction<typeof addReaction>;
const mockRemoveReaction = removeReaction as jest.MockedFunction<typeof removeReaction>;

describe('MessageReactions', () => {
  const mockOnRemoveReaction = jest.fn();
  const mockOnUpdateReaction = jest.fn();

  const defaultProps = {
    messageId: 1,
    reactions: [] as MessageReaction[],
    onRemoveReaction: mockOnRemoveReaction,
    onUpdateReaction: mockOnUpdateReaction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => '1'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render empty state when no reactions', () => {
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    expect(addButton).toBeTruthy();
  });

  it('should render grouped reactions', () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        user: { id: 1, name: 'John', email: 'john@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        message_id: 1,
        user_id: 2,
        emoji: '👍',
        user: { id: 2, name: 'Jane', email: 'jane@example.com', is_online: false, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    const reactionButton = screen.getByText('👍');
    expect(reactionButton).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('should handle reaction click for user reaction removal', async () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        user: { id: 1, name: 'John', email: 'john@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    const reactionButton = screen.getByText('👍');
    fireEvent.click(reactionButton);

    await waitFor(() => {
      expect(mockOnRemoveReaction).toHaveBeenCalledWith(1, 1);
    });
  });

  it('should handle adding new reaction', async () => {
    mockAddReaction.mockResolvedValue({
      id: 1,
      message_id: 1,
      user_id: 1,
      emoji: '👍',
      user: { id: 1, name: 'John', email: 'john@example.com', created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    });

    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);

    // Wait for picker to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Reaction picker')).toBeTruthy();
    });

    const thumbsUpButton = screen.getByLabelText('React with 👍');
    fireEvent.click(thumbsUpButton);

    await waitFor(() => {
      expect(mockAddReaction).toHaveBeenCalledWith(1, 0, '👍');
    });
  });

  it('should show reaction picker on add button click', async () => {
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Reaction picker')).toBeTruthy();
    });
  });

  it('should group reactions by emoji correctly', () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        user: { id: 1, name: 'John', email: 'john@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        message_id: 1,
        user_id: 2,
        emoji: '👍',
        user: { id: 2, name: 'Jane', email: 'jane@example.com', is_online: false, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
      {
        id: 3,
        message_id: 1,
        user_id: 3,
        emoji: '❤️',
        user: { id: 3, name: 'Bob', email: 'bob@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    expect(screen.getByText('👍')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('❤️')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('should highlight user reactions', () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        user: { id: 1, name: 'John', email: 'john@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    expect(reactionButton).toHaveClass('bg-blue-100');
  });

  it('should show user names in tooltip', () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        user: { id: 1, name: 'John', email: 'john@example.com', is_online: true, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        message_id: 1,
        user_id: 2,
        emoji: '👍',
        user: { id: 2, name: 'Jane', email: 'jane@example.com', is_online: false, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    expect(reactionButton).toHaveAttribute('title', 'John, Jane');
  });

  it('should handle reaction click for non-user reaction addition', async () => {
    const reactions: MessageReaction[] = [
      {
        id: 1,
        message_id: 1,
        user_id: 2,
        emoji: '👍',
        user: { id: 2, name: 'Jane', email: 'jane@example.com', is_online: false, created_at: '', updated_at: '' },
        created_at: '',
        updated_at: '',
      },
    ];

    mockAddReaction.mockResolvedValue({
      id: 2,
      message_id: 1,
      user_id: 1,
      emoji: '👍',
      user: { id: 1, name: 'John', email: 'john@example.com', created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    });

    render(<MessageReactions {...defaultProps} reactions={reactions} />);
    
    const reactionButton = screen.getByText('👍');
    fireEvent.click(reactionButton);

    await waitFor(() => {
      expect(mockAddReaction).toHaveBeenCalledWith(1, 0, '👍');
    });
  });

  it('should handle errors in reaction operations', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAddReaction.mockRejectedValue(new Error('Network error'));

    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Reaction picker')).toBeTruthy();
    });

    const thumbsUpButton = screen.getByLabelText('React with 👍');
    fireEvent.click(thumbsUpButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to add reaction:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});