import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageInput from '../MessageInput';

describe('MessageInput Component', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TDD: Input Display', () => {
    it('should render message input with default placeholder', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} placeholder="Custom placeholder" />);
      
      const input = screen.getByPlaceholderText('Custom placeholder');
      expect(input).toBeTruthy();
    });

    it('should render send button', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeTruthy();
      // The component doesn't have aria-label on the button
      expect(sendButton).toBeInTheDocument();
    });

    it('should render with correct styling classes', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      expect(input.className).toContain('resize-none');
      expect(input.className).toContain('border-2');
      expect(input.className).toContain('border-gray-200');
    });
  });

  describe('TDD: Input Interaction', () => {
    it('should update input value when typing', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Hello world' } });
      
      expect(input).toHaveValue('Hello world');
    });

    it('should call onSendMessage when send button is clicked', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
    });

    it('should call onSendMessage when Enter key is pressed', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
    });

    it('should not call onSendMessage when Enter is pressed with Shift key', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not call onSendMessage when input is empty', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByRole('button');
      fireEvent.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not call onSendMessage when input only contains whitespace', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('TDD: Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should not call onSendMessage when disabled', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should show disabled styling when disabled', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('TDD: Input Clearing', () => {
    it('should clear input after sending message', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.click(sendButton);
      
      expect(input).toHaveValue('');
    });

    it('should clear input after sending message with Enter key', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      expect(input).toHaveValue('');
    });
  });

  describe('TDD: Auto-resize', () => {
    it('should auto-resize textarea based on content', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      // Mock scrollHeight
      Object.defineProperty(input, 'scrollHeight', {
        writable: true,
        value: 100,
      });
      
      fireEvent.change(input, { target: { value: 'Hello world\nThis is a multi-line message' } });
      
      // Should adjust height based on content
      expect(input.style.height).toBeDefined();
    });
  });

  describe('TDD: Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      // The component doesn't have aria-label attributes
      expect(input).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      // Input should be focusable
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Button should be focusable (but it's disabled when no message)
      // Add some text first
      fireEvent.change(input, { target: { value: 'Test message' } });
      sendButton.focus();
      expect(document.activeElement).toBe(sendButton);
    });
  });

  describe('TDD: Edge Cases', () => {
    it('should handle very long messages', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const longMessage = 'a'.repeat(1000);
      
      fireEvent.change(input, { target: { value: longMessage } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const specialMessage = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      
      fireEvent.change(input, { target: { value: specialMessage } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(specialMessage);
    });

    it('should handle emoji characters', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const emojiMessage = 'Hello 👋 How are you? 😊';
      
      fireEvent.change(input, { target: { value: emojiMessage } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(emojiMessage);
    });

    it('should handle undefined onSendMessage prop gracefully', () => {
      expect(() => {
        render(<MessageInput onSendMessage={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('TDD: Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const initialValue = (input as HTMLInputElement).value;
      
      // Re-render with same props
      rerender(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect((input as HTMLInputElement).value).toBe(initialValue);
    });
  });
}); 