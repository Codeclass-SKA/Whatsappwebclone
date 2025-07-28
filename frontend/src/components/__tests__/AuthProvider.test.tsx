import React, { ReactNode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '../AuthProvider';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api';
import type { User } from '../../types';

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

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockGetProfile = authService.getProfile as jest.MockedFunction<typeof authService.getProfile>;
const mockLogout = authService.logout as jest.MockedFunction<typeof authService.logout>;

describe('AuthProvider', () => {
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    is_online: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockInitializeAuth = jest.fn();
  const mockSetToken = jest.fn();
  const mockSetUser = jest.fn();
  const mockLogoutStore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAuthStore.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
      initializeAuth: mockInitializeAuth,
      setToken: mockSetToken,
      setUser: mockSetUser,
      logout: mockLogoutStore,
    });

    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('TDD: Authentication Flow', () => {
    it('should initialize auth on mount', async () => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(mockInitializeAuth).toHaveBeenCalled();
    });

    it('should fetch user profile when authenticated', async () => {
      mockUseAuthStore.mockReturnValue({
        token: 'test-token',
        user: null,
        isAuthenticated: true,
        initializeAuth: mockInitializeAuth,
        setToken: mockSetToken,
        setUser: mockSetUser,
        logout: mockLogoutStore,
      });

      mockGetProfile.mockResolvedValue({ user: mockUser });

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockGetProfile).toHaveBeenCalled();
      });
    });

    it('should handle profile fetch error', async () => {
      mockUseAuthStore.mockReturnValue({
        token: 'test-token',
        user: null,
        isAuthenticated: true,
        initializeAuth: mockInitializeAuth,
        setToken: mockSetToken,
        setUser: mockSetUser,
        logout: mockLogoutStore,
      });

      mockGetProfile.mockRejectedValue(new Error('Failed to fetch profile'));

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLogoutStore).toHaveBeenCalled();
      });
    });
  });

  describe('TDD: Session Management', () => {
    it('should handle session expiration', async () => {
      mockUseAuthStore.mockReturnValue({
        token: 'expired-token',
        user: null,
        isAuthenticated: true,
        initializeAuth: mockInitializeAuth,
        setToken: mockSetToken,
        setUser: mockSetUser,
        logout: mockLogoutStore,
      });

      const error = new Error('Unauthorized');
      (error as any).response = { status: 401 };
      mockGetProfile.mockRejectedValue(error);

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLogoutStore).toHaveBeenCalled();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockUseAuthStore.mockReturnValue({
        token: 'test-token',
        user: null,
        isAuthenticated: true,
        initializeAuth: mockInitializeAuth,
        setToken: mockSetToken,
        setUser: mockSetUser,
        logout: mockLogoutStore,
      });

      mockGetProfile.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLogoutStore).toHaveBeenCalled();
      });
    });

    it('should not logout when user data exists', async () => {
      mockUseAuthStore.mockReturnValue({
        token: 'test-token',
        user: mockUser,
        isAuthenticated: true,
        initializeAuth: mockInitializeAuth,
        setToken: mockSetToken,
        setUser: mockSetUser,
        logout: mockLogoutStore,
      });

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      // Should not call getProfile when user already exists
      expect(mockGetProfile).not.toHaveBeenCalled();
      expect(mockLogoutStore).not.toHaveBeenCalled();
    });
  });

  describe('TDD: Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      unmount();

      // Verify no memory leaks or pending operations
      expect(mockLogoutStore).not.toHaveBeenCalled();
    });

    it('should handle cleanup with pending operations', async () => {
      mockGetProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { unmount } = render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      // Start profile fetch
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Unmount while fetch is pending
      unmount();

      // Complete the fetch
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Verify no state updates after unmount
      expect(mockSetUser).not.toHaveBeenCalled();
    });
  });
});