import { useState, useCallback } from 'react';
import { Chat, Message } from '../types';
import { 
  archiveChat, 
  unarchiveChat, 
  muteChat, 
  unmuteChat, 
  pinChat, 
  unpinChat, 
  exportChat, 
  getArchivedChats,
  getChats,
  getChat,
  sendMessage,
  createChat,
  deleteMessage,
  forwardMessage,
  addReaction,
  removeReaction,
  searchMessages
} from '../services/chatService';
import { useAuthStore } from '../store/authStore';

export const useChatManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuthStore();

  const loadChats = useCallback(async () => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const chatList = await getChats();
      setChats(chatList);
      return { success: true, data: chatList };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chats';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const selectChat = useCallback(async (chatId: number) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const chat = await getChat(chatId);
      setSelectedChat(chat);
      return { success: true, data: chat };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const sendMessageHandler = useCallback(async (chatId: number, content: string) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const message = await sendMessage(chatId, content);
      return { success: true, data: message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const createChatHandler = useCallback(async (name: string) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const chat = await createChat(name);
      setChats(prev => [...prev, chat]);
      return { success: true, data: chat };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const archiveChatHandler = useCallback(async (chatId: number) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await archiveChat(chatId);
      // Refresh archived chats list
      const updatedArchivedChats = await getArchivedChats();
      setArchivedChats(updatedArchivedChats);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const muteChatHandler = useCallback(async (chatId: number, mute: boolean) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (mute) {
        await muteChat(chatId);
      } else {
        await unmuteChat(chatId);
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mute chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const pinChatHandler = useCallback(async (chatId: number, pin: boolean) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (pin) {
        await pinChat(chatId);
      } else {
        await unpinChat(chatId);
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pin chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const deleteMessageHandler = useCallback(async (messageId: number) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await deleteMessage(messageId);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const forwardMessageHandler = useCallback(async (messageId: number, targetChatId: number) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await forwardMessage(messageId, targetChatId);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forward message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const addReactionHandler = useCallback(async (messageId: number, emoji: string) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const reaction = await addReaction(messageId, emoji);
      return { success: true, data: reaction };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const removeReactionHandler = useCallback(async (messageId: number, emoji: string) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await removeReaction(messageId, emoji);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove reaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const searchMessagesHandler = useCallback(async (query: string) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const messages = await searchMessages(query);
      return { success: true, data: messages };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search messages';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const handleExport = useCallback(async (chatId: number) => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await exportChat(chatId);
      
      // If there's a download URL, trigger download
      if (result.download_url && typeof document !== 'undefined') {
        try {
          const link = document.createElement('a');
          link.href = result.download_url;
          link.download = `chat-export-${chatId}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (downloadError) {
          console.warn('Failed to trigger download:', downloadError);
        }
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const loadArchivedChats = useCallback(async () => {
    if (!token || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const chatList = await getArchivedChats();
      setArchivedChats(chatList);
      return { success: true, data: chatList };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load archived chats';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const handleUnarchive = useCallback(async (chatId: number) => {
    return archiveChatHandler(chatId);
  }, [archiveChatHandler]);

  return {
    // State
    isLoading,
    error,
    chats,
    selectedChat,
    archivedChats,
    
    // Chat management functions
    loadChats,
    selectChat,
    sendMessage: sendMessageHandler,
    createChat: createChatHandler,
    archiveChat: archiveChatHandler,
    muteChat: muteChatHandler,
    pinChat: pinChatHandler,
    deleteMessage: deleteMessageHandler,
    forwardMessage: forwardMessageHandler,
    addReaction: addReactionHandler,
    removeReaction: removeReactionHandler,
    searchMessages: searchMessagesHandler,
    
    // Legacy functions for backward compatibility
    handleArchive: archiveChatHandler,
    handleMute: muteChatHandler,
    handlePin: pinChatHandler,
    handleExport,
    handleUnarchive,
    loadArchivedChats,
  };
}; 