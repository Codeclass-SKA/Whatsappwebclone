import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReplyPreview from '../ReplyPreview';

describe('ReplyPreview', () => {
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
    isOwnMessage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reply preview correctly', () => {
    render(<ReplyPreview {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Original message content')).toBeInTheDocument();
  });

  it('shows user name correctly', () => {
    render(<ReplyPreview {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
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
    
    render(<ReplyPreview {...propsWithLongMessage} />);
    
    expect(screen.getByText(/This is a very long message th/)).toBeInTheDocument();
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
    
    render(<ReplyPreview {...imageMessageProps} />);
    
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
    
    render(<ReplyPreview {...fileMessageProps} />);
    
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
    
    render(<ReplyPreview {...audioMessageProps} />);
    
    expect(screen.getByText('🎵 Voice message')).toBeInTheDocument();
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
    
    render(<ReplyPreview {...deletedMessageProps} />);
    
    expect(screen.getByText('🗑️ This message was deleted')).toBeInTheDocument();
  });

  it('applies different styling for own messages', () => {
    const ownMessageProps = {
      ...defaultProps,
      isOwnMessage: true
    };
    
    render(<ReplyPreview {...ownMessageProps} />);
    
    const container = document.querySelector('.bg-green-50.border-green-300');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-green-50');
    expect(container).toHaveClass('border-green-300');
  });

  it('applies different styling for other messages', () => {
    render(<ReplyPreview {...defaultProps} />);
    
    const container = document.querySelector('.bg-gray-50.border-gray-300');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-gray-50');
    expect(container).toHaveClass('border-gray-300');
  });

  it('shows different indicator color for own messages', () => {
    const ownMessageProps = {
      ...defaultProps,
      isOwnMessage: true
    };
    
    render(<ReplyPreview {...ownMessageProps} />);
    
    const indicator = document.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-green-500');
  });

  it('shows different indicator color for other messages', () => {
    render(<ReplyPreview {...defaultProps} />);
    
    const indicator = document.querySelector('.bg-gray-500');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-gray-500');
  });

  it('has proper accessibility attributes', () => {
    render(<ReplyPreview {...defaultProps} />);
    
    const replyPreview = screen.getByText('Original message content');
    expect(replyPreview).toHaveAttribute('role', 'button');
  });
}); 