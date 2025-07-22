import api from './api';
import type { Chat, Message } from '../types';

export interface CreateChatData {
  type: 'private' | 'group';
  participant_ids: number[];
  name?: string;
}

export interface SendMessageData {
  content: string;
}

class ChatService {
  async getChats(): Promise<Chat[]> {
    const response = await api.get('/chats');
    return response.data.data;
  }

  async createChat(data: CreateChatData): Promise<Chat> {
    const response = await api.post('/chats', data);
    return response.data.data;
  }

  async getMessages(chatId: number): Promise<Message[]> {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data.data;
  }

  async sendMessage(chatId: number, data: SendMessageData): Promise<Message> {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    return response.data.data;
  }
}

export const chatService = new ChatService();
export default chatService; 