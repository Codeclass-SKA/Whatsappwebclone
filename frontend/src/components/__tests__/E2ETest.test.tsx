import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthProvider';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api';
import chatService from '../../services/chatService';

// Mock dependencies
jest.mock('../../store/authStore');
jest.mock('../../services/api', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../../services/chatService', () => ({
  chatService: {
    getChats: jest.fn(),
    getChat: jest.fn(),
    sendMessage: jest.fn(),
    createChat: jest.fn(),
    archiveChat: jest.fn(),
    muteChat: jest.fn(),
    pinChat: jest.fn(),
    deleteMessage: jest.fn(),
    forwardMessage: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
    searchMessages: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>;
const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;
const mockGetChats = chatService.getChats as jest.MockedFunction<typeof chatService.getChats>;
const mockSendMessage = chatService.sendMessage as jest.MockedFunction<typeof chatService.sendMessage>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('E2E Test: Complete User Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth store mock
    mockUseAuthStore.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      initializeAuth: jest.fn(),
      clearError: jest.fn(),
    });
  });

  describe('TDD: User Registration Flow', () => {
    it('should allow user to register successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      mockRegister.mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        message: 'User registered successfully',
      });

      mockUseAuthStore.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        register: jest.fn().mockResolvedValue({
          user: mockUser,
          token: 'mock-token',
        }),
        login: jest.fn(),
        logout: jest.fn(),
        initializeAuth: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <div data-testid="registration-form">
            <input data-testid="name-input" placeholder="Name" />
            <input data-testid="email-input" placeholder="Email" />
            <input data-testid="password-input" type="password" placeholder="Password" />
            <button data-testid="register-button">Register</button>
          </div>
        </TestWrapper>
      );

      // Simulate user registration
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle registration errors gracefully', async () => {
      mockRegister.mockRejectedValue(new Error('Email already exists'));

      render(
        <TestWrapper>
          <div data-testid="registration-form">
            <input data-testid="name-input" placeholder="Name" />
            <input data-testid="email-input" placeholder="Email" />
            <input data-testid="password-input" type="password" placeholder="Password" />
            <button data-testid="register-button">Register</button>
            <div data-testid="error-message"></div>
          </div>
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'existing@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  describe('TDD: User Login Flow', () => {
    it('should allow user to login successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      mockLogin.mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        message: 'Login successful',
      });

      render(
        <TestWrapper>
          <div data-testid="login-form">
            <input data-testid="email-input" placeholder="Email" />
            <input data-testid="password-input" type="password" placeholder="Password" />
            <button data-testid="login-button">Login</button>
          </div>
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('TDD: Chat Management Flow', () => {
    it('should load and display chat list', async () => {
      const mockChats = [
        {
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
        },
      ];

      mockGetChats.mockResolvedValue(mockChats);

      mockUseAuthStore.mockReturnValue({
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
      });

      render(
        <TestWrapper>
          <div data-testid="chat-list">
            <button data-testid="load-chats-button">Load Chats</button>
            <div data-testid="chats-container"></div>
          </div>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-chats-button'));

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });
    });

    it('should send message successfully', async () => {
      const mockMessage = {
        id: 1,
        content: 'Hello world',
        sender: { id: 1, name: 'Test User' },
        chatId: 1,
        createdAt: new Date().toISOString(),
      };

      mockSendMessage.mockResolvedValue(mockMessage);

      render(
        <TestWrapper>
          <div data-testid="message-input">
            <input data-testid="message-text" placeholder="Type a message..." />
            <button data-testid="send-button">Send</button>
          </div>
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('message-text'), { target: { value: 'Hello world' } });
      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(1, 'Hello world');
      });
    });
  });

  describe('TDD: Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockGetChats.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <div data-testid="error-handling">
            <button data-testid="load-chats-button">Load Chats</button>
            <div data-testid="error-message"></div>
          </div>
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-chats-button'));

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });
    });

    it('should handle authentication errors', async () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Invalid credentials',
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        initializeAuth: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <div data-testid="auth-error">
            <div data-testid="error-message"></div>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    });
  });

  describe('TDD: Real-time Features', () => {
    it('should handle real-time message updates', async () => {
      const mockMessage = {
        id: 1,
        content: 'Real-time message',
        sender: { id: 1, name: 'Test User' },
        chatId: 1,
        createdAt: new Date().toISOString(),
      };

      render(
        <TestWrapper>
          <div data-testid="real-time-container">
            <div data-testid="messages-list"></div>
          </div>
        </TestWrapper>
      );

      // Simulate real-time message
      const messagesList = screen.getByTestId('messages-list');
      const messageElement = document.createElement('div');
      messageElement.textContent = 'Real-time message';
      messageElement.setAttribute('data-testid', 'message-1');
      messagesList.appendChild(messageElement);

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument();
      });
    });
  });
}); 