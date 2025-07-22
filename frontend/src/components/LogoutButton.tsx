import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      console.log('[LogoutButton] Logout initiated');
      await logout();
      console.log('[LogoutButton] Logout completed');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[LogoutButton] Logout error:', error);
      // Even if logout fails, redirect to login
      navigate('/login', { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-green-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-green-600"
      title="Logout"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
};

export default LogoutButton; 