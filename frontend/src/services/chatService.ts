import api from './api';
import type { Chat, Message } from '../types';

export interface CreateChatData {
  type: 'private' | 'group';
  participant_ids: number[];
  name?: string;
}

export interface SendMessageData {
  content: string;
  type?: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
  file_url?: string;
  reply_to_id?: number;
}

class ChatService {
  async getChats(): Promise<Chat[]> {
    const response = await api.get('/chats');
    return response.data.data;
  }

  async getChat(chatId: number): Promise<Chat> {
    const response = await api.get(`/chats/${chatId}`);
    return response.data.data;
  }

  async createChat(name: string): Promise<Chat> {
    const response = await api.post('/chats', {
      type: 'group',
      name,
      participant_ids: []
    });
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

  async deleteMessage(messageId: number): Promise<any> {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }

  async forwardMessage(messageId: number, targetChatId: number): Promise<any> {
    const response = await api.post(`/messages/${messageId}/forward`, {
      target_chat_id: targetChatId
    });
    return response.data;
  }

  async searchMessages(query: string): Promise<Message[]> {
    const response = await api.get(`/messages/search?q=${encodeURIComponent(query)}`);
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
  async addReaction(messageId: number, emoji: string): Promise<any> {
    const response = await api.post(`/messages/${messageId}/reactions`, {
      emoji
    });
    return response.data;
  }

  async removeReaction(messageId: number, emoji: string): Promise<any> {
    const response = await api.delete(`/messages/${messageId}/reactions`, {
      data: { emoji }
    });
    return response.data;
  }

  async addReactionWithChat(messageId: number, chatId: number, emoji: string): Promise<any> {
    const response = await api.post(`/chats/${chatId}/messages/${messageId}/reactions`, {
      emoji
    });
    return response.data;
  }

  async removeReactionWithChat(messageId: number, chatId: number, emoji: string): Promise<any> {
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

const chatService = new ChatService();

// Export individual functions for easier testing
export const getChats = () => chatService.getChats();
export const getChat = (chatId: number) => chatService.getChat(chatId);
export const createChat = (name: string) => chatService.createChat(name);
export const getMessages = (chatId: number) => chatService.getMessages(chatId);
export const sendMessage = (chatId: number, data: SendMessageData) => chatService.sendMessage(chatId, data);
export const deleteMessage = (messageId: number) => chatService.deleteMessage(messageId);
export const forwardMessage = (messageId: number, targetChatId: number) => chatService.forwardMessage(messageId, targetChatId);
export const searchMessages = (query: string) => chatService.searchMessages(query);
export const archiveChat = (chatId: number) => chatService.archiveChat(chatId);
export const unarchiveChat = (chatId: number) => chatService.unarchiveChat(chatId);
export const muteChat = (chatId: number) => chatService.muteChat(chatId);
export const unmuteChat = (chatId: number) => chatService.unmuteChat(chatId);
export const pinChat = (chatId: number) => chatService.pinChat(chatId);
export const unpinChat = (chatId: number) => chatService.unpinChat(chatId);
export const exportChat = (chatId: number) => chatService.exportChat(chatId);
export const getArchivedChats = () => chatService.getArchivedChats();
export const addReaction = (messageId: number, emoji: string) => chatService.addReaction(messageId, emoji);
export const removeReaction = (messageId: number, emoji: string) => chatService.removeReaction(messageId, emoji);
export const getMessageReactions = (messageId: number, chatId: number) => chatService.getMessageReactions(messageId, chatId);
export const replyToMessage = (chatId: number, data: any) => chatService.replyToMessage(chatId, data);
export const getRepliesToMessage = (messageId: number, chatId: number) => chatService.getRepliesToMessage(messageId, chatId);

export default chatService; 