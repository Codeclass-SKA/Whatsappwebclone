import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactionPicker from '../ReactionPicker';

describe('ReactionPicker', () => {
  const defaultProps = {
    onSelect: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders common emoji reactions', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('😂')).toBeInTheDocument();
    expect(screen.getByText('😮')).toBeInTheDocument();
    expect(screen.getByText('😢')).toBeInTheDocument();
    expect(screen.getByText('😡')).toBeInTheDocument();
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const emojiButton = screen.getByText('👍');
    fireEvent.click(emojiButton);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith('👍');
  });

  it('calls onClose when pressing escape key', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside the picker', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const picker = screen.getByRole('dialog');
    fireEvent.click(picker);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const emojiButtons = screen.getAllByRole('button');
    const firstEmoji = emojiButtons[0];
    
    firstEmoji.focus();
    fireEvent.keyDown(firstEmoji, { key: 'Enter' });
    
    expect(defaultProps.onSelect).toHaveBeenCalled();
  });

  it('closes picker on escape key', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const picker = screen.getByRole('dialog');
    expect(picker).toHaveAttribute('aria-label', 'Reaction picker');
    
    const emojiButtons = screen.getAllByRole('button');
    emojiButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('renders emoji with proper styling', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const emojiButtons = screen.getAllByRole('button');
    emojiButtons.forEach(button => {
      expect(button).toHaveClass('hover:bg-gray-100');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('p-2');
    });
  });

  it('groups emojis in a grid layout', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const picker = screen.getByRole('dialog');
    expect(picker).toHaveClass('grid');
    expect(picker).toHaveClass('grid-cols-6');
    expect(picker).toHaveClass('gap-1');
  });
}); 