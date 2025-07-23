import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReplyMessage from '../ReplyMessage';

describe('ReplyMessage', () => {
  const defaultProps = {
    replyTo: {
      id: 1,
      content: 'Original message content',
      user: {
        id: 2,
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      },
      message_type: 'text' as const,
      created_at: '2024-01-01T12:00:00Z'
    },
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reply preview correctly', () => {
    render(<ReplyMessage {...defaultProps} />);
    
    expect(screen.getByText('Replying to John Doe')).toBeInTheDocument();
    expect(screen.getByText('Original message content')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel reply')).toBeInTheDocument();
  });

  it('shows user avatar when available', () => {
    render(<ReplyMessage {...defaultProps} />);
    
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('shows default avatar when no avatar provided', () => {
    const propsWithoutAvatar = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        user: {
          ...defaultProps.replyTo.user,
          avatar: null
        }
      }
    };
    
    render(<ReplyMessage {...propsWithoutAvatar} />);
    
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toHaveAttribute('src', '/default-avatar.png');
  });

  it('truncates long message content', () => {
    const longMessage = 'This is a very long message that should be truncated when displayed in the reply preview to keep the UI clean and consistent';
    const propsWithLongMessage = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        content: longMessage
      }
    };
    
    render(<ReplyMessage {...propsWithLongMessage} />);
    
    expect(screen.getByText(/This is a very long message that should be truncat/)).toBeInTheDocument();
    expect(screen.queryByText(longMessage)).not.toBeInTheDocument();
  });

  it('handles different message types', () => {
    const imageMessageProps = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        message_type: 'image' as const,
        content: 'Image message'
      }
    };
    
    render(<ReplyMessage {...imageMessageProps} />);
    
    expect(screen.getByText('📷 Image message')).toBeInTheDocument();
  });

  it('handles file message type', () => {
    const fileMessageProps = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        message_type: 'file' as const,
        content: 'document.pdf'
      }
    };
    
    render(<ReplyMessage {...fileMessageProps} />);
    
    expect(screen.getByText('📎 document.pdf')).toBeInTheDocument();
  });

  it('handles audio message type', () => {
    const audioMessageProps = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        message_type: 'audio' as const,
        content: 'Voice message'
      }
    };
    
    render(<ReplyMessage {...audioMessageProps} />);
    
    expect(screen.getByText('🎵 Voice message')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ReplyMessage {...defaultProps} />);
    
    const cancelButton = screen.getByLabelText('Cancel reply');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('shows deleted message indicator when message is deleted', () => {
    const deletedMessageProps = {
      ...defaultProps,
      replyTo: {
        ...defaultProps.replyTo,
        deleted_at: '2024-01-01T12:30:00Z',
        content: null
      }
    };
    
    render(<ReplyMessage {...deletedMessageProps} />);
    
    expect(screen.getByText('🗑️ This message was deleted')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ReplyMessage {...defaultProps} />);
    
    const cancelButton = screen.getByLabelText('Cancel reply');
    expect(cancelButton).toHaveAttribute('aria-label', 'Cancel reply');
    
    const replyPreview = screen.getByText('Original message content').closest('div');
    expect(replyPreview).toHaveAttribute('role', 'button');
  });

  it('applies correct styling classes', () => {
    render(<ReplyMessage {...defaultProps} />);
    
    const container = document.querySelector('.bg-gray-50.border-l-4.border-blue-500');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-gray-50');
    expect(container).toHaveClass('border-l-4');
    expect(container).toHaveClass('border-blue-500');
  });
}); 