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
  onReact: (messageId: number, emoji: string) => void;
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
  const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('bottom');
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
        // Add delay for reaction picker to prevent immediate closing
        if (showReactionPicker) {
          setTimeout(() => {
            setShowReactionPicker(false);
          }, 200); // Increased delay
        } else {
          setShowMenu(false);
          setShowDeleteConfirm(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);

  const handleDelete = (deleteType: 'for_me' | 'for_everyone') => {
    onDelete(message.id, deleteType);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleReactionSelect = (emoji: string) => {
    onReact(message.id, emoji);
    // Add delay before closing to prevent immediate closure
    setTimeout(() => {
      setShowReactionPicker(false);
      setShowMenu(false);
    }, 100);
  };

  const handleReactClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up and closing the menu immediately
    setShowMenu(false);
    
    // Add small delay to prevent immediate opening/closing
    setTimeout(() => {
      // Calculate position for reaction picker using menuRef
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // If not enough space below but enough above, show above
        if (spaceBelow < 200 && spaceAbove > 200) {
          setPickerPosition('top');
        } else {
          setPickerPosition('bottom');
        }
      } else {
        setPickerPosition('bottom');
      }
      
      setShowReactionPicker(true);
    }, 50);
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
        <span className="text-lg">&#8942;</span>
      </button>

      {/* Main container for popups (menu, delete confirm) */}
      <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-10`}>
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
              <span className="text-lg">↩️</span>
              Reply
            </button>

            <button
              onClick={() => {
                onForward(message);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-lg">↪️</span>
              Forward
            </button>

            <button
              onClick={handleReactClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-lg">😊</span>
              React
            </button>

            {isOwnMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <span className="text-lg">🗑️</span>
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

      {/* Separate container for reaction picker */}
      {showReactionPicker && (
        <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-20`}>
          <ReactionPicker
            onSelect={handleReactionSelect}
            onClose={() => setShowReactionPicker(false)}
            targetElement={menuRef.current}
          />
        </div>
      )}
    </div>
  );
};

export default MessageActions;