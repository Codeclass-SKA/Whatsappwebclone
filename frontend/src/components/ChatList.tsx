import React from 'react';
import { useAuthStore } from '../store/authStore';
import Avatar from './Avatar';
import type { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onChatSelect }) => {
  const { user } = useAuthStore();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    if (chat.type === 'private') {
      return chat.participants.find(p => p.id !== user?.id);
    }
    return null;
  };

  const getOnlineParticipants = (chat: Chat) => {
    return chat.participants.filter(p => p.is_online && p.id !== user?.id).length;
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold mb-2">No chats yet</h3>
        <p className="text-sm">Start a conversation with someone</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white">
        {chats.map((chat) => {
          const otherParticipant = getOtherParticipant(chat);
          const onlineCount = getOnlineParticipants(chat);
          
          return (
            <div
              key={chat.id}
              role="button"
              onClick={() => onChatSelect(chat)}
              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors bg-white"
            >
              <div className="relative mr-3">
                <Avatar
                  src={chat.type === 'private' ? otherParticipant?.avatar : chat.avatar}
                  alt={chat.name}
                  size="lg"
                />
                {chat.type === 'private' && otherParticipant && (
                  <div
                    data-testid="status-indicator"
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      otherParticipant.is_online ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {chat.name}
                  </h3>
                  {chat.last_message && (
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.last_message.created_at)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {chat.last_message ? (
                      <>
                        <span className="font-medium">
                          {chat.last_message.user?.name === user?.name ? 'You' : chat.last_message.user?.name || 'Unknown User'}
                        </span>
                        : {chat.last_message.content}
                      </>
                    ) : (
                      <span className="text-gray-400">No messages yet</span>
                    )}
                  </p>
                  
                  {chat.type === 'group' && (
                    <span className="text-xs text-gray-500 ml-2">
                      {chat.participants.length} participants
                    </span>
                  )}
                </div>
                
                {chat.type === 'group' && onlineCount > 0 && (
                  <div className="flex items-center mt-1">
                    <div className="flex -space-x-1 mr-2">
                      {chat.participants
                        .filter(p => p.is_online && p.id !== user?.id)
                        .slice(0, 3)
                        .map((participant, index) => (
                          <Avatar
                            key={participant.id}
                            src={participant.avatar}
                            alt={participant.name}
                            size="sm"
                            className="border border-white"
                          />
                        ))}
                    </div>
                    <span className="text-xs text-green-600">
                      {onlineCount} online
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList; 