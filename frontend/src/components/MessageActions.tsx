import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import ReactionPicker from './ReactionPicker'; // Import the actual component
import type { Message } from '../types';

interface MessageActionsProps {
  message: Message;
  isActive: boolean; // Add isActive prop
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onDelete: (messageId: number, deleteType: 'for_me' | 'for_everyone') => void;
  onReact: (emoji: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isActive,
  onReply,
  onForward,
  onDelete,
  onReact,
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = message.sender_id === user?.id;

  // This effect ensures that the menu and picker close when the message is no longer active
  useEffect(() => {
    if (!isActive) {
      setShowMenu(false);
      setShowDeleteConfirm(false);
      setShowReactionPicker(false);
    }
  }, [isActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowDeleteConfirm(false);
        setShowReactionPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = (deleteType: 'for_me' | 'for_everyone') => {
    onDelete(message.id, deleteType);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleReactionSelect = (emoji: string) => {
    onReact(emoji);
    setShowReactionPicker(false);
    setShowMenu(false);
  };

  const handleReactClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up and closing the menu immediately
    setShowMenu(false);
    setShowReactionPicker(true);
  };

  // Only show the action button if the message is active
  if (!isActive) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* More actions button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent click from bubbling up to MessageList's listener
          setShowMenu(!showMenu);
        }}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="More actions"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Main container for popups (menu, delete confirm, reaction picker) */}
      <div className="absolute bottom-full right-0 mb-2 z-10">
        {/* Actions menu */}
        {showMenu && !showDeleteConfirm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-max">
            <button
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              Reply
            </button>

            <button
              onClick={() => {
                onForward(message);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Forward
            </button>

            <button
              onClick={handleReactClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              React
            </button>

            {isOwnMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            )}
          </div>
        )}

        {/* Delete confirmation */}
        {showMenu && showDeleteConfirm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-max">
            <p className="text-sm text-gray-700 mb-3">Delete message?</p>
            <div className="flex gap-2 justify-between">
              <button onClick={() => handleDelete('for_me')} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">For me</button>
              <button onClick={() => handleDelete('for_everyone')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">For everyone</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Reaction picker - Renders separately */}
      {showReactionPicker && (
         <div className="absolute bottom-full right-0 mb-2 z-50 reaction-picker-container">
          <ReactionPicker
            onSelect={handleReactionSelect}
            onClose={() => setShowReactionPicker(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MessageActions; 