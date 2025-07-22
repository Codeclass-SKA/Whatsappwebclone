import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        console.log('[AuthStore] setUser called', user);
        set({
          user,
          isAuthenticated: true,
        });
      },

      setToken: (token) => {
        console.log('[AuthStore] setToken called', token ? 'token exists' : 'no token');
        set({
          token,
        });
      },

      setLoading: (isLoading) => {
        console.log('[AuthStore] setLoading called', isLoading);
        set({
          isLoading,
        });
      },

      setError: (error) => {
        console.log('[AuthStore] setError called', error);
        set({
          error,
        });
      },

      initializeAuth: () => {
        const state = get();
        console.log('[AuthStore] initializeAuth called', {
          hasToken: !!state.token,
          hasUser: !!state.user,
          isAuthenticated: state.isAuthenticated
        });
        
        if (state.token && state.user) {
          console.log('[AuthStore] Setting isAuthenticated to true');
          set({ isAuthenticated: true });
        }
      },

      login: async (email: string, password: string) => {
        console.log('[AuthStore] login called', { email });
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          console.log('[AuthStore] login success', response);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.log('[AuthStore] login error', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login gagal',
          });
          throw error;
        }
      },

      logout: async () => {
        console.log('[AuthStore] logout called');
        try {
          // Call backend logout API
          await authService.logout();
          console.log('[AuthStore] backend logout successful');
        } catch (error) {
          console.log('[AuthStore] backend logout failed, but continuing with local logout:', error);
        }
        
        // Clear local state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Clear localStorage manually
        localStorage.removeItem('auth-storage');
        console.log('[AuthStore] local logout completed');
      },

      clearError: () => {
        console.log('[AuthStore] clearError called');
        set({
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 