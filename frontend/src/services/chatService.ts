import api from './api';
import type { Chat, Message } from '../types';

export interface CreateChatData {
  type: 'private' | 'group';
  participant_ids: number[];
  name?: string;
}

export interface SendMessageData {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
  file_url?: string;
  reply_to_id?: number;
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

  // Chat Management Functions
  async archiveChat(chatId: number): Promise<any> {
    const response = await api.post(`/chats/${chatId}/archive`);
    return response.data;
  }

  async unarchiveChat(chatId: number): Promise<any> {
    const response = await api.delete(`/chats/${chatId}/archive`);
    return response.data;
  }

  async muteChat(chatId: number): Promise<any> {
    const response = await api.post(`/chats/${chatId}/mute`);
    return response.data;
  }

  async unmuteChat(chatId: number): Promise<any> {
    const response = await api.delete(`/chats/${chatId}/mute`);
    return response.data;
  }

  async pinChat(chatId: number): Promise<any> {
    const response = await api.post(`/chats/${chatId}/pin`);
    return response.data;
  }

  async unpinChat(chatId: number): Promise<any> {
    const response = await api.delete(`/chats/${chatId}/pin`);
    return response.data;
  }

  async exportChat(chatId: number): Promise<any> {
    const response = await api.post(`/chats/${chatId}/export`);
    return response.data;
  }

  async getArchivedChats(): Promise<Chat[]> {
    const response = await api.get('/chats/archived');
    return response.data.data;
  }

  // Message Reaction Functions
  async addReaction(messageId: number, chatId: number, emoji: string): Promise<any> {
    const response = await api.post(`/chats/${chatId}/messages/${messageId}/reactions`, {
      emoji
    });
    return response.data;
  }

  async removeReaction(messageId: number, chatId: number, emoji: string): Promise<any> {
    const response = await api.delete(`/chats/${chatId}/messages/${messageId}/reactions`, {
      data: { emoji }
    });
    return response.data;
  }

  async getMessageReactions(messageId: number, chatId: number): Promise<any[]> {
    const response = await api.get(`/chats/${chatId}/messages/${messageId}/reactions`);
    return response.data.data;
  }

  // Message Reply Functions
  async replyToMessage(chatId: number, data: SendMessageData & { reply_to_id: number }): Promise<Message> {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    return response.data.data;
  }

  async getRepliesToMessage(messageId: number, chatId: number): Promise<Message[]> {
    const response = await api.get(`/chats/${chatId}/messages/${messageId}/replies`);
    return response.data.data;
  }
}

export const chatService = new ChatService();

// Export individual functions for testing
export const archiveChat = (chatId: number) => chatService.archiveChat(chatId);
export const unarchiveChat = (chatId: number) => chatService.unarchiveChat(chatId);
export const muteChat = (chatId: number) => chatService.muteChat(chatId);
export const unmuteChat = (chatId: number) => chatService.unmuteChat(chatId);
export const pinChat = (chatId: number) => chatService.pinChat(chatId);
export const unpinChat = (chatId: number) => chatService.unpinChat(chatId);
export const exportChat = (chatId: number) => chatService.exportChat(chatId);
export const getArchivedChats = () => chatService.getArchivedChats();
export const addReaction = (messageId: number, chatId: number, emoji: string) => chatService.addReaction(messageId, chatId, emoji);
export const removeReaction = (messageId: number, chatId: number, emoji: string) => chatService.removeReaction(messageId, chatId, emoji);
export const getMessageReactions = (messageId: number, chatId: number) => chatService.getMessageReactions(messageId, chatId);
export const replyToMessage = (chatId: number, data: any) => chatService.replyToMessage(chatId, data);
export const getRepliesToMessage = (messageId: number, chatId: number) => chatService.getRepliesToMessage(messageId, chatId);

export default chatService; 