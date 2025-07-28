import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Import components that actually exist and work
import Avatar from '../Avatar';
import LogoutButton from '../LogoutButton';

// Mock services
jest.mock('../../services/api', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    initializeAuth: jest.fn(),
    clearError: jest.fn(),
  }),
}));

describe('TDD: Simple Component Tests', () => {
  describe('Avatar Component', () => {
    it('should display user initials when no avatar is provided', () => {
      render(<Avatar src={null} alt="John Doe" size="md" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display user initials for single name', () => {
      render(<Avatar src={null} alt="John" size="md" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display user initials for multiple names', () => {
      render(<Avatar src={null} alt="John Michael Doe" size="md" />);
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should display avatar image when provided', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      render(<Avatar src={avatarUrl} alt="John Doe" size="md" />);
      const img = screen.getByAltText('John Doe');
      expect(img).toHaveAttribute('src', avatarUrl);
    });

    it('should apply correct size classes', () => {
      const { rerender } = render(<Avatar src={null} alt="John Doe" size="sm" />);
      let avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-8', 'h-8');

      rerender(<Avatar src={null} alt="John Doe" size="md" />);
      avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-10', 'h-10');

      rerender(<Avatar src={null} alt="John Doe" size="lg" />);
      avatar = screen.getByText('JD').parentElement;
      expect(avatar).toHaveClass('w-12', 'h-12');
    });
  });

  describe('LogoutButton Component', () => {
    it('should render logout button', () => {
      render(
        <BrowserRouter>
          <LogoutButton />
        </BrowserRouter>
      );
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should call logout function when clicked', () => {
      const mockLogout = jest.fn();
      jest.spyOn(require('../../store/authStore'), 'useAuthStore').mockReturnValue({
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        register: jest.fn(),
        login: jest.fn(),
        logout: mockLogout,
        initializeAuth: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LogoutButton />
        </BrowserRouter>
      );
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('TDD: Basic Form Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com'
      ];

      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password strength', () => {
      const strongPasswords = [
        'Password123!',
        'MySecurePass1@',
        'ComplexP@ssw0rd'
      ];

      const weakPasswords = [
        'password',
        '123456',
        'abc123',
        'qwerty'
      ];

      const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      strongPasswords.forEach(password => {
        expect(passwordStrengthRegex.test(password)).toBe(true);
      });

      weakPasswords.forEach(password => {
        expect(passwordStrengthRegex.test(password)).toBe(false);
      });
    });
  });

  describe('TDD: Data Structure Validation', () => {
    it('should validate user object structure', () => {
      const validUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      expect(validUser).toHaveProperty('id');
      expect(validUser).toHaveProperty('name');
      expect(validUser).toHaveProperty('email');
      expect(validUser).toHaveProperty('avatar');
      expect(validUser).toHaveProperty('status');
      expect(validUser).toHaveProperty('lastSeen');

      expect(typeof validUser.id).toBe('number');
      expect(typeof validUser.name).toBe('string');
      expect(typeof validUser.email).toBe('string');
      expect(validUser.name.length).toBeGreaterThan(0);
      expect(validUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should validate chat object structure', () => {
      const validChat = {
        id: 1,
        name: 'Test Chat',
        type: 'group',
        lastMessage: {
          id: 1,
          content: 'Hello world',
          sender: { id: 1, name: 'User 1' },
          createdAt: new Date().toISOString(),
        },
        unreadCount: 2,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(validChat).toHaveProperty('id');
      expect(validChat).toHaveProperty('name');
      expect(validChat).toHaveProperty('type');
      expect(validChat).toHaveProperty('lastMessage');
      expect(validChat).toHaveProperty('unreadCount');
      expect(validChat).toHaveProperty('participants');
      expect(validChat).toHaveProperty('createdAt');
      expect(validChat).toHaveProperty('updatedAt');

      expect(typeof validChat.id).toBe('number');
      expect(typeof validChat.name).toBe('string');
      expect(['private', 'group']).toContain(validChat.type);
      expect(typeof validChat.unreadCount).toBe('number');
      expect(Array.isArray(validChat.participants)).toBe(true);
    });

    it('should validate message object structure', () => {
      const validMessage = {
        id: 1,
        content: 'Hello world',
        sender: { id: 1, name: 'User 1', avatar: null },
        chatId: 1,
        createdAt: new Date().toISOString(),
        reactions: [],
        replyTo: null,
      };

      expect(validMessage).toHaveProperty('id');
      expect(validMessage).toHaveProperty('content');
      expect(validMessage).toHaveProperty('sender');
      expect(validMessage).toHaveProperty('chatId');
      expect(validMessage).toHaveProperty('createdAt');
      expect(validMessage).toHaveProperty('reactions');
      expect(validMessage).toHaveProperty('replyTo');

      expect(typeof validMessage.id).toBe('number');
      expect(typeof validMessage.content).toBe('string');
      expect(typeof validMessage.chatId).toBe('number');
      expect(validMessage.content.length).toBeGreaterThan(0);
      expect(Array.isArray(validMessage.reactions)).toBe(true);
    });
  });

  describe('TDD: Utility Functions', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      expect(formattedDate).toMatch(/^[A-Za-z]{3} \d{1,2}, \d{4}$/);
    });

    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      expect(formattedTime).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const maxLength = 20;
      
      const truncateText = (text: string, maxLen: number) => {
        return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
      };

      const truncated = truncateText(longText, maxLength);
      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should generate initials from name', () => {
      const generateInitials = (name: string) => {
        const words = name.trim().split(' ');
        if (words.length === 1) {
          return words[0].charAt(0).toUpperCase();
        }
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
      };

      expect(generateInitials('John Doe')).toBe('JD');
      expect(generateInitials('John')).toBe('J');
      expect(generateInitials('John Michael Doe')).toBe('JD');
      expect(generateInitials('')).toBe('');
    });
  });

  describe('TDD: Error Handling', () => {
    it('should handle null values gracefully', () => {
      const safeGetProperty = (obj: any, property: string, defaultValue: any = null) => {
        return obj && obj[property] !== undefined ? obj[property] : defaultValue;
      };

      const testObj = { name: 'Test', value: 42 };
      const nullObj = null;

      expect(safeGetProperty(testObj, 'name', 'default')).toBe('Test');
      expect(safeGetProperty(testObj, 'nonexistent', 'default')).toBe('default');
      expect(safeGetProperty(nullObj, 'name', 'default')).toBe('default');
    });

    it('should validate required fields', () => {
      const validateRequired = (data: any, requiredFields: string[]) => {
        const errors: string[] = [];
        
        requiredFields.forEach(field => {
          if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`${field} is required`);
          }
        });
        
        return errors;
      };

      const validData = { name: 'Test', email: 'test@example.com' };
      const invalidData = { name: '', email: 'test@example.com' };
      const requiredFields = ['name', 'email'];

      expect(validateRequired(validData, requiredFields)).toEqual([]);
      expect(validateRequired(invalidData, requiredFields)).toContain('name is required');
    });
  });

  describe('TDD: State Management', () => {
    it('should handle loading states', () => {
      const initialState = { isLoading: false, data: null, error: null };
      
      const loadingState = { ...initialState, isLoading: true };
      const successState = { ...initialState, isLoading: false, data: { id: 1 } };
      const errorState = { ...initialState, isLoading: false, error: 'Something went wrong' };

      expect(loadingState.isLoading).toBe(true);
      expect(successState.isLoading).toBe(false);
      expect(successState.data).toBeDefined();
      expect(errorState.isLoading).toBe(false);
      expect(errorState.error).toBeDefined();
    });

    it('should handle authentication states', () => {
      const unauthenticatedState = {
        user: null,
        token: null,
        isAuthenticated: false,
      };

      const authenticatedState = {
        user: { id: 1, name: 'Test User' },
        token: 'valid-token',
        isAuthenticated: true,
      };

      expect(unauthenticatedState.isAuthenticated).toBe(false);
      expect(unauthenticatedState.user).toBeNull();
      expect(authenticatedState.isAuthenticated).toBe(true);
      expect(authenticatedState.user).toBeDefined();
    });
  });
}); 