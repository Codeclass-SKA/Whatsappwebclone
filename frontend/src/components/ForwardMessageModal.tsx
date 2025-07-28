import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import type { Chat, Message } from '../types';
import chatService from '../services/chatService';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onForward: (targetChatId: number) => void;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  onForward,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatList = await chatService.getChats();
      // Filter out the current chat
      const filteredChats = chatList.filter(chat => chat.id !== message?.chat_id);
      setChats(filteredChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = () => {
    if (selectedChatId) {
      onForward(selectedChatId);
      onClose();
      setSelectedChatId(null);
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Forward Message</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Message to forward:</p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-800">{message.content}</p>
          </div>
        </div>

        {/* Chat Selection */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">Select chat to forward to:</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="spinner"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No other chats available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                    selectedChatId === chat.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Avatar
                    src={chat.avatar}
                    alt={chat.name}
                    size="md"
                    className="mr-3"
                  />
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{chat.name}</h4>
                    <p className="text-sm text-gray-500">
                      {chat.type === 'group' 
                        ? `${chat.participants.length} participants`
                        : chat.participants.find(p => p.id !== message.sender_id)?.name || 'Unknown'
                      }
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedChatId}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal; 