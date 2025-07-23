import React from 'react';
import { Chat } from '../types';
import Avatar from './Avatar';

interface ArchivedChatsListProps {
  chats: Chat[];
  onUnarchive: (chatId: number) => void;
  onSelectChat: (chat: Chat) => void;
  isLoading?: boolean;
}

const ArchivedChatsList: React.FC<ArchivedChatsListProps> = ({
  chats,
  onUnarchive,
  onSelectChat,
  isLoading = false,
}) => {
  const handleUnarchive = (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    onUnarchive(chatId);
  };

  const formatLastMessage = (chat: Chat) => {
    if (!chat.last_message) {
      return 'No messages yet';
    }

    const { content, type, user } = chat.last_message;
    
    switch (type) {
      case 'image':
        return `${user.name}: 📷 Image`;
      case 'file':
        return `${user.name}: 📎 File`;
      case 'voice':
        return `${user.name}: 🎤 Voice message`;
      case 'document':
        return `${user.name}: 📄 Document`;
      case 'audio':
        return `${user.name}: 🎵 Audio`;
      default:
        return `${user.name}: ${content}`;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="text-center text-gray-500">Loading archived chats...</div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="text-center text-gray-500">No archived chats</div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Archived Chats</h3>
        <p className="text-sm text-gray-500 mt-1">
          {chats.length} chat{chats.length !== 1 ? 's' : ''} archived
        </p>
      </div>
      
      <div className="divide-y">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar
                  src={chat.avatar}
                  alt={chat.name}
                  size="md"
                  className="flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </h4>
                    {chat.type === 'group' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        group
                      </span>
                    )}
                    {chat.is_muted && (
                      <span className="text-lg" title="Muted">🔇</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {formatLastMessage(chat)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-3">
                <span className="text-xs text-gray-400">
                  {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
                </span>
                
                <button
                  onClick={(e) => handleUnarchive(e, chat.id)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Unarchive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchivedChatsList; 