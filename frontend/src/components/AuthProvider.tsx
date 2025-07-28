import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initializeAuth, token, user, logout } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app load
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Check if user is authenticated but no user data
    if (token && !user) {
      const checkProfile = async () => {
        try {
          await authService.getProfile();
        } catch (error: any) {
          // If profile fetch fails (401, network error, etc.), logout user
          if (error?.response?.status === 401 || error?.message) {
            logout();
          }
        }
      };
      
      checkProfile();
    }
  }, [token, user, logout]);

  return <>{children}</>;
}; 