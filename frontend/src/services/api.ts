import axios from 'axios';
import type { AuthResponse, LoginCredentials, RegisterCredentials, UpdateProfileData, User, Chat, Message, MessageReaction } from '../types';
import { API_URL } from '../utils/env';

// Extend axios config type to include metadata
interface ExtendedAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
  headers?: any;
  method?: string;
  url?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and monitor performance
api.interceptors.request.use(
  (config: any) => {
    // Add timestamp for performance monitoring
    config.metadata = { startTime: new Date() };
    
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
    
    // Only log non-polling requests to reduce console noise
    if (!config.url?.includes('/messages') || config.method !== 'GET') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - Request started`);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and monitor performance
api.interceptors.response.use(
  (response: any) => {
    // Calculate response time
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
    // Only log non-polling requests to reduce console noise
    if (!response.config.url?.includes('/messages') || response.config.method !== 'GET') {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success (${duration}ms)`);
    }
    
    // Log slow responses (>1000ms) for all requests
    if (duration > 1000) {
      console.warn(`[API] Slow response detected: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Calculate response time for errors too
    const endTime = new Date();
    const startTime = error.config?.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error (${duration}ms):`, error.response?.status, error.response?.data);
    
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
    return response.data.data; // Backend returns with data wrapper
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

// Simple cache for message reactions
const reactionsCache = new Map<number, { data: MessageReaction[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const getMessageReactions = async (messageId: number): Promise<MessageReaction[]> => {
  const now = Date.now();
  const cached = reactionsCache.get(messageId);
  
  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const response = await api.get(`/messages/${messageId}/reactions`);
  const data = response.data.data;
  
  // Cache the result
  reactionsCache.set(messageId, { data, timestamp: now });
  
  return data;
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