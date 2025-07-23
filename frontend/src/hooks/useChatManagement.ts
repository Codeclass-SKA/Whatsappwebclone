import { useState, useCallback } from 'react';
import { Chat } from '../types';
import { 
  archiveChat, 
  unarchiveChat, 
  muteChat, 
  unmuteChat, 
  pinChat, 
  unpinChat, 
  exportChat, 
  getArchivedChats 
} from '../services/chatService';

export const useChatManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = useCallback(async (chatId: number, archive: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (archive) {
        await archiveChat(chatId);
      } else {
        await unarchiveChat(chatId);
      }
      
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
  }, []);

  const handleMute = useCallback(async (chatId: number, mute: boolean) => {
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
  }, []);

  const handlePin = useCallback(async (chatId: number, pin: boolean) => {
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
  }, []);

  const handleExport = useCallback(async (chatId: number) => {
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
  }, []);

  const loadArchivedChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const chats = await getArchivedChats();
      setArchivedChats(chats);
      return { success: true, data: chats };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load archived chats';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnarchive = useCallback(async (chatId: number) => {
    return handleArchive(chatId, false);
  }, [handleArchive]);

  return {
    isLoading,
    error,
    archivedChats,
    handleArchive,
    handleMute,
    handlePin,
    handleExport,
    handleUnarchive,
    loadArchivedChats,
  };
}; 