import axios from 'axios';
import type { AuthResponse, LoginCredentials, RegisterCredentials, UpdateProfileData, User, Chat, Message, MessageReaction } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand store instead of localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth storage instead of localStorage directly
      localStorage.removeItem('auth-storage');
      // Don't redirect automatically, let the component handle it
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    // Clear auth storage
    localStorage.removeItem('auth-storage');
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const chatService = {
  async getChats(): Promise<Chat[]> {
    const response = await api.get('/chats');
    return response.data.data;
  },

  async getChat(id: number): Promise<Chat> {
    const response = await api.get(`/chats/${id}`);
    return response.data.data;
  },

  async createChat(data: { type: 'private' | 'group'; name?: string; participant_ids: number[] }): Promise<Chat> {
    const response = await api.post('/chats', data);
    return response.data.data;
  },

  async getMessages(chatId: number): Promise<Message[]> {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data.data;
  },

  async sendMessage(chatId: number, data: { content: string; message_type?: string; file_url?: string; reply_to_id?: number }): Promise<Message> {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    return response.data.data;
  },
};

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data.data;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data.data;
  },
};

// Message Reactions
export const addReaction = async (messageId: number, emoji: string): Promise<MessageReaction> => {
  const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data.data;
};

export const removeReaction = async (messageId: number, reactionId: number): Promise<void> => {
  await api.delete(`/messages/${messageId}/reactions/${reactionId}`);
};

export const updateReaction = async (messageId: number, reactionId: number, emoji: string): Promise<MessageReaction> => {
  const response = await api.put(`/messages/${messageId}/reactions/${reactionId}`, { emoji });
  return response.data.data;
};

export const getMessageReactions = async (messageId: number): Promise<MessageReaction[]> => {
  const response = await api.get(`/messages/${messageId}/reactions`);
  return response.data.data;
};

// Message Forwarding
export const forwardMessage = async (messageId: number, targetChatId: number): Promise<Message> => {
  const response = await api.post(`/messages/${messageId}/forward`, { target_chat_id: targetChatId });
  return response.data.data;
};

export const forwardMultipleMessages = async (messageIds: number[], targetChatId: number): Promise<Message[]> => {
  const response = await api.post('/messages/forward-multiple', {
    message_ids: messageIds,
    target_chat_id: targetChatId
  });
  return response.data.data;
};

// Message Deletion
export const deleteMessage = async (messageId: number, deleteType: 'for_me' | 'for_everyone'): Promise<void> => {
  await api.delete(`/messages/${messageId}`, { data: { delete_type: deleteType } });
};

// Message Replies
export const getMessageReplies = async (messageId: number): Promise<Message[]> => {
  const response = await api.get(`/messages/${messageId}/replies`);
  return response.data.data;
};

export default api; 