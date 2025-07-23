import React from 'react';
import { Chat } from '../types';

interface ChatManagementProps {
  chat: Chat;
  onArchive: (chatId: number, archive: boolean) => void;
  onMute: (chatId: number, mute: boolean) => void;
  onPin: (chatId: number, pin: boolean) => void;
  onExport: (chatId: number) => void;
  isLoading?: boolean;
}

const ChatManagement: React.FC<ChatManagementProps> = ({
  chat,
  onArchive,
  onMute,
  onPin,
  onExport,
  isLoading = false,
}) => {
  const handleArchive = () => {
    onArchive(chat.id, !chat.is_archived);
  };

  const handleMute = () => {
    onMute(chat.id, !chat.is_muted);
  };

  const handlePin = () => {
    onPin(chat.id, !chat.is_pinned);
  };

  const handleExport = () => {
    onExport(chat.id);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Chat Management</h3>
      
      <div className="space-y-3">
        {/* Archive/Unarchive Button */}
        <button
          onClick={handleArchive}
          className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="flex items-center">
            <span className="mr-3">📁</span>
            {chat.is_archived ? 'Unarchive Chat' : 'Archive Chat'}
          </span>
          <span className="text-sm text-gray-500">
            {chat.is_archived ? 'Restore to chat list' : 'Hide from chat list'}
          </span>
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={handleMute}
          className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="flex items-center">
            <span className="mr-3">{chat.is_muted ? '🔊' : '🔇'}</span>
            {chat.is_muted ? 'Unmute Chat' : 'Mute Chat'}
          </span>
          <span className="text-sm text-gray-500">
            {chat.is_muted ? 'Enable notifications' : 'Disable notifications'}
          </span>
        </button>

        {/* Pin/Unpin Button */}
        <button
          onClick={handlePin}
          className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="flex items-center">
            <span className="mr-3">{chat.is_pinned ? '📌' : '📍'}</span>
            {chat.is_pinned ? 'Unpin Chat' : 'Pin Chat'}
          </span>
          <span className="text-sm text-gray-500">
            {chat.is_pinned ? 'Remove from top' : 'Pin to top of list'}
          </span>
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="flex items-center">
            <span className="mr-3">📤</span>
            Export Chat
          </span>
          <span className="text-sm text-gray-500">
            Download chat history
          </span>
        </button>
      </div>
    </div>
  );
};

export default ChatManagement; 