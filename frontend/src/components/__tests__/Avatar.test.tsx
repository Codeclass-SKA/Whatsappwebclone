import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';
import '@testing-library/jest-dom';
import Avatar from '../Avatar';

describe('Avatar Component', () => {
  describe('TDD: Avatar Display', () => {
    it('should display user initials when no avatar is provided', () => {
      render(<Avatar src={null} alt="John Doe" size="md" />);
      
      expect(screen.getByText('JD')).toBeTruthy();
    });

    it('should display user initials for single name', () => {
      render(<Avatar src={null} alt="John" size="md" />);
      
      expect(screen.getByText('J')).toBeTruthy();
    });

    it('should display user initials for multiple names', () => {
      render(<Avatar src={null} alt="John Michael Doe" size="md" />);
      
      expect(screen.getByText('JM')).toBeTruthy();
    });

    it('should display avatar image when provided', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      render(<Avatar src={avatarUrl} alt="John Doe" size="md" />);
      
      const img = screen.getByAltText('John Doe');
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe(avatarUrl);
    });

    it('should handle empty name gracefully', () => {
      render(<Avatar src={null} alt="" size="md" />);
      
      expect(screen.getByText('?')).toBeTruthy();
    });
  });

  describe('TDD: Avatar Sizes', () => {
    it('should apply correct size classes for small avatar', () => {
      render(<Avatar src={null} alt="John Doe" size="sm" />);
      
      const avatarContainer = screen.getByText('JD').closest('.relative');
      expect(avatarContainer?.className).toContain('w-8');
      expect(avatarContainer?.className).toContain('h-8');
    });

    it('should apply correct size classes for medium avatar', () => {
      render(<Avatar src={null} alt="John Doe" size="md" />);
      
      const avatarContainer = screen.getByText('JD').closest('.relative');
      expect(avatarContainer?.className).toContain('w-10');
      expect(avatarContainer?.className).toContain('h-10');
    });

    it('should apply correct size classes for large avatar', () => {
      render(<Avatar src={null} alt="John Doe" size="lg" />);
      
      const avatarContainer = screen.getByText('JD').closest('.relative');
      expect(avatarContainer?.className).toContain('w-12');
      expect(avatarContainer?.className).toContain('h-12');
    });
  });

  describe('TDD: Avatar Accessibility', () => {
    it('should have proper alt text for avatar image', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      render(<Avatar src={avatarUrl} alt="John Doe" size="md" />);
      
      const img = screen.getByAltText('John Doe');
      expect(img).toBeTruthy();
    });
  });

  describe('TDD: Avatar Edge Cases', () => {
    it('should handle special characters in name', () => {
      render(<Avatar src={null} alt="José María" size="md" />);
      
      expect(screen.getByText('JM')).toBeTruthy();
    });

    it('should handle numbers in name', () => {
      render(<Avatar src={null} alt="John123" size="md" />);
      
      expect(screen.getByText('J')).toBeTruthy();
    });

    it('should handle very long names', () => {
      render(<Avatar src={null} alt="John Michael Christopher Alexander Doe" size="md" />);
      
      expect(screen.getByText('JM')).toBeTruthy();
    });

    it('should handle single character name', () => {
      render(<Avatar src={null} alt="A" size="md" />);
      
      expect(screen.getByText('A')).toBeTruthy();
    });
  });

  describe('TDD: Image Error Handling', () => {
    it('should show initials when image fails to load', () => {
      const avatarUrl = 'https://example.com/broken-image.jpg';
      render(<Avatar src={avatarUrl} alt="John Doe" size="md" />);
      
      const img = screen.getByAltText('John Doe');
      const initialsElement = screen.getByText('JD');
      
      // Initially, image should be visible and initials hidden
      expect(img).toBeTruthy();
      expect(initialsElement.closest('.avatar-initials')?.className).toContain('hidden');
      
      // Simulate image error
      fireEvent.error(img);
      
      // After error, initials should be visible
      expect(initialsElement.closest('.avatar-initials')?.style.display).toBe('flex');
    });
  });
}); 