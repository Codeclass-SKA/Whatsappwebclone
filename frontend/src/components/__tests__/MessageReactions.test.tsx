import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageReactions from '../MessageReactions';

// Mock chatService
jest.mock('../../services/chatService', () => ({
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
}));

const mockChatService = require('../../services/chatService');

describe('MessageReactions', () => {
  const defaultProps = {
    messageId: 1,
    chatId: 1,
    reactions: [
      { id: 1, emoji: '👍', user_id: 1, user: { name: 'John Doe' } },
      { id: 2, emoji: '❤️', user_id: 2, user: { name: 'Jane Smith' } },
      { id: 3, emoji: '👍', user_id: 3, user: { name: 'Bob Wilson' } },
    ],
    currentUserId: 1,
    onReactionUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reactions correctly', () => {
    render(<MessageReactions {...defaultProps} />);
    
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Count for 👍
    expect(screen.getByText('1')).toBeInTheDocument(); // Count for ❤️
  });

  it('shows user names in tooltip', () => {
    render(<MessageReactions {...defaultProps} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    expect(reactionButton).toHaveAttribute('title', 'John Doe, Bob Wilson');
  });

  it('removes reaction when clicking on own reaction', async () => {
    mockChatService.removeReaction.mockResolvedValue({ success: true });
    
    render(<MessageReactions {...defaultProps} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    fireEvent.click(reactionButton!);
    
    await waitFor(() => {
      expect(mockChatService.removeReaction).toHaveBeenCalledWith(1, 1, '👍');
      expect(defaultProps.onReactionUpdate).toHaveBeenCalled();
    });
  });

  it('removes reaction when clicking on own reaction', async () => {
    mockChatService.removeReaction.mockResolvedValue({ success: true });
    
    render(<MessageReactions {...defaultProps} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    fireEvent.click(reactionButton!);
    
    await waitFor(() => {
      expect(mockChatService.removeReaction).toHaveBeenCalledWith(1, 1, '👍');
      expect(defaultProps.onReactionUpdate).toHaveBeenCalled();
    });
  });

  it('shows reaction picker when clicking add reaction button', () => {
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);
    
    expect(screen.getByText('😀')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('🤔')).toBeInTheDocument();
    expect(screen.getByText('😂')).toBeInTheDocument();
  });

  it('adds new reaction from picker', async () => {
    mockChatService.addReaction.mockResolvedValue({ success: true });
    
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);
    
    const emojiButton = screen.getByText('😂');
    fireEvent.click(emojiButton);
    
    await waitFor(() => {
      expect(mockChatService.addReaction).toHaveBeenCalledWith(1, 1, '😂');
      expect(defaultProps.onReactionUpdate).toHaveBeenCalled();
    });
  });

  it('closes reaction picker when selecting emoji', async () => {
    mockChatService.addReaction.mockResolvedValue({ success: true });
    
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);
    
    expect(screen.getByText('😀')).toBeInTheDocument();
    
    const emojiButton = screen.getByText('😀');
    fireEvent.click(emojiButton);
    
    await waitFor(() => {
      expect(screen.queryByText('😀')).not.toBeInTheDocument();
    });
  });

  it('handles reaction add error gracefully', async () => {
    mockChatService.addReaction.mockRejectedValue(new Error('Failed to add reaction'));
    
    render(<MessageReactions {...defaultProps} />);
    
    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);
    
    const emojiButton = screen.getByText('😂');
    fireEvent.click(emojiButton);
    
    await waitFor(() => {
      expect(mockChatService.addReaction).toHaveBeenCalledWith(1, 1, '😂');
      // Should not call onReactionUpdate on error
      expect(defaultProps.onReactionUpdate).not.toHaveBeenCalled();
    });
  });

  it('handles reaction remove error gracefully', async () => {
    mockChatService.removeReaction.mockRejectedValue(new Error('Failed to remove reaction'));
    
    render(<MessageReactions {...defaultProps} />);
    
    const reactionButton = screen.getByText('👍').closest('button');
    fireEvent.click(reactionButton!);
    
    await waitFor(() => {
      expect(mockChatService.removeReaction).toHaveBeenCalledWith(1, 1, '👍');
      // Should not call onReactionUpdate on error
      expect(defaultProps.onReactionUpdate).not.toHaveBeenCalled();
    });
  });

  it('groups reactions by emoji correctly', () => {
    render(<MessageReactions {...defaultProps} />);
    
    // Should show 2 👍 reactions grouped together
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Should show 1 ❤️ reaction
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('highlights user own reactions', () => {
    render(<MessageReactions {...defaultProps} />);
    
    const ownReaction = screen.getByText('👍').closest('button');
    expect(ownReaction).toHaveClass('bg-blue-100');
  });

  it('does not highlight other user reactions', () => {
    render(<MessageReactions {...defaultProps} />);
    
    const otherReaction = screen.getByText('❤️').closest('button');
    expect(otherReaction).not.toHaveClass('bg-blue-100');
  });
}); 