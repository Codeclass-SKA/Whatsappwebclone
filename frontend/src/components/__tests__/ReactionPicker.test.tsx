import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ReactionPicker from '../ReactionPicker';

describe('ReactionPicker - TDD Integration Tests', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();
  const mockTargetElement = document.createElement('div');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TDD: Picker Positioning and Overlap Prevention', () => {
    it('should render with correct z-index to prevent overlapping', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const picker = screen.getByRole('dialog');
      // Check if picker has the correct CSS class
      expect(picker.className).toContain('reaction-picker-container');
      
      // Check inline styles for z-index
      const styles = window.getComputedStyle(picker);
      expect(picker.style.zIndex).toBe('99999');
    });

    it('should position itself correctly relative to target element', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const picker = screen.getByRole('dialog');
      expect(picker.style.position).toBe('absolute');
      expect(picker.style.top).toBe('100%');
      expect(picker.style.right).toBe('0px');
    });

    it('should have consistent button sizing to prevent layout shifts', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.style.minWidth).toBe('40px');
        expect(button.style.minHeight).toBe('40px');
        expect(button.style.display).toBe('flex');
      });
    });
  });

  describe('TDD: Click Outside Behavior', () => {
    it('should not close when clicking on target element', async () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      // Simulate click on target element
      fireEvent.mouseDown(mockTargetElement);

      // Should not close
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close when clicking outside picker and target element', async () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      // Click outside the picker
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should add event listeners immediately to prevent issues', async () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      // Event listeners should be attached immediately
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should close on Escape key', async () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('TDD: Emoji Selection', () => {
    it('should call onSelect and onClose when emoji is clicked', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const thumbsUpButton = screen.getByLabelText('React with 👍');
      fireEvent.click(thumbsUpButton);

      expect(mockOnSelect).toHaveBeenCalledWith('👍');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle keyboard navigation correctly', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const thumbsUpButton = screen.getByLabelText('React with 👍');
      
      // Test Enter key
      fireEvent.keyDown(thumbsUpButton, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('👍');
      expect(mockOnClose).toHaveBeenCalled();

      // Reset mocks
      mockOnSelect.mockClear();
      mockOnClose.mockClear();

      // Test Space key
      fireEvent.keyDown(thumbsUpButton, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('👍');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('TDD: Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const picker = screen.getByRole('dialog');
      expect(picker.getAttribute('aria-label')).toBe('Reaction picker');

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button, index) => {
        const expectedEmoji = ['👍', '❤️', '😂', '😮', '😢', '😡', '😀', '😍', '🤔', '👏', '🙏', '🔥'][index];
        expect(button.getAttribute('aria-label')).toBe(`React with ${expectedEmoji}`);
      });
    });

    it('should be focusable and keyboard navigable', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBe('button');
        
        // Test focus
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe('TDD: Grid Layout', () => {
    it('should display emojis in a 6-column grid', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const picker = screen.getByRole('dialog');
      expect(picker.style.display).toBe('grid');
      expect(picker.style.gridTemplateColumns).toBe('repeat(6, 1fr)');
    });

    it('should render all 12 emoji options', () => {
      render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      const expectedEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '😀', '😍', '🤔', '👏', '🙏', '🔥'];
      
      expectedEmojis.forEach(emoji => {
        expect(screen.getByText(emoji)).toBeTruthy();
      });
    });
  });

  describe('TDD: Performance', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <ReactionPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          targetElement={mockTargetElement}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});