import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import NewChatButton from '../NewChatButton';

describe('NewChatButton Component', () => {
  describe('TDD: Button Display', () => {
    it('should render new chat button with correct text', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      expect(screen.getByText('New Chat')).toBeTruthy();
      expect(screen.getByText('Start a new conversation')).toBeTruthy();
    });

    it('should render with correct styling classes', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
      expect(button.className).toContain('p-3');
      expect(button.className).toContain('text-left');
      expect(button.className).toContain('hover:bg-gray-50');
    });

    it('should render with correct icon', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      // Check if the plus icon is present
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toBeTruthy();
    });
  });

  describe('TDD: Button Interaction', () => {
    it('should call onClick when button is clicked', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks correctly', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('should be accessible via keyboard navigation', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      // Button should be focusable for keyboard navigation
      expect(button.tabIndex >= 0 || button.tabIndex === undefined).toBe(true);
    });
  });

  describe('TDD: Button Accessibility', () => {
    it('should have proper button role', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('should be focusable', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should have proper tab index', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      // Buttons are focusable by default, so tabIndex should be 0 or null
      const tabIndex = button.getAttribute('tabIndex');
      expect(tabIndex === '0' || tabIndex === null).toBe(true);
    });
  });

  describe('TDD: Button Styling States', () => {
    it('should have hover state styling', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-gray-50');
    });

    it('should have transition styling', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-colors');
    });

    it('should have border styling', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-b');
      expect(button.className).toContain('border-gray-100');
    });
  });

  describe('TDD: Button Content Structure', () => {
    it('should have correct layout structure', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const button = screen.getByRole('button');
      const flexContainer = button.querySelector('.flex.items-center');
      expect(flexContainer).toBeTruthy();
    });

    it('should have icon container with correct styling', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const iconContainer = screen.getByRole('button').querySelector('.w-10.h-10');
      expect(iconContainer).toBeTruthy();
      expect(iconContainer?.className).toContain('bg-green-500');
      expect(iconContainer?.className).toContain('rounded-full');
    });

    it('should have text content with correct styling', () => {
      const onClick = jest.fn();
      render(<NewChatButton onClick={onClick} />);
      
      const title = screen.getByText('New Chat');
      const description = screen.getByText('Start a new conversation');
      
      expect(title.className).toContain('font-semibold');
      expect(title.className).toContain('text-gray-900');
      expect(description.className).toContain('text-sm');
      expect(description.className).toContain('text-gray-500');
    });
  });

  describe('TDD: Edge Cases', () => {
    it('should handle undefined onClick prop gracefully', () => {
      render(<NewChatButton onClick={undefined as any} />);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle null onClick prop gracefully', () => {
      render(<NewChatButton onClick={null as any} />);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should render correctly without any props', () => {
      render(<NewChatButton onClick={() => {}} />);
      
      expect(screen.getByText('New Chat')).toBeTruthy();
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });
}); 