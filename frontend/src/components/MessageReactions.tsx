import React, { useState, useCallback, useEffect } from 'react';
import { addReaction, removeReaction } from '../services/chatService';
import ReactionPicker from './ReactionPicker';

interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
  user: {
    name: string;
  };
}

interface MessageReactionsProps {
  messageId: number;
  chatId: number;
  reactions: Reaction[];
  currentUserId: number;
  onReactionUpdate: () => void;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  users: string[];
  hasUserReaction: boolean;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  chatId,
  reactions,
  currentUserId,
  onReactionUpdate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: GroupedReaction[], reaction) => {
    const existing = acc.find(group => group.emoji === reaction.emoji);
    
    if (existing) {
      existing.count++;
      existing.users.push(reaction.user.name);
      if (reaction.user_id === currentUserId) {
        existing.hasUserReaction = true;
      }
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user.name],
        hasUserReaction: reaction.user_id === currentUserId,
      });
    }
    
    return acc;
  }, []);

  const handleReactionClick = useCallback(async (emoji: string) => {
    try {
      const hasReaction = groupedReactions.find(
        group => group.emoji === emoji && group.hasUserReaction
      );

      if (hasReaction) {
        await removeReaction(messageId, chatId, emoji);
      } else {
        await addReaction(messageId, chatId, emoji);
      }
      
      onReactionUpdate();
    } catch (error) {
      console.error('Failed to handle reaction:', error);
    }
  }, [messageId, chatId, groupedReactions, onReactionUpdate]);

  const handleAddReaction = useCallback(async (emoji: string) => {
    try {
      await addReaction(messageId, chatId, emoji);
      onReactionUpdate();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [messageId, chatId, onReactionUpdate]);

  const handlePickerClose = useCallback(() => {
    setShowPicker(false);
  }, []);

  // Handle click outside for picker
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (showPicker) {
      setShowPicker(false);
    }
  }, [showPicker]);

  useEffect(() => {
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPicker, handleClickOutside]);

  if (groupedReactions.length === 0 && !showPicker) {
    return (
      <div className="flex items-center space-x-1 mt-1">
        <button
          type="button"
          aria-label="Add reaction"
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => setShowPicker(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {showPicker && (
          <div className="relative">
            <ReactionPicker
              onSelect={handleAddReaction}
              onClose={handlePickerClose}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 mt-1 relative">
      {groupedReactions.map((group) => (
        <button
          key={group.emoji}
          type="button"
          className={`px-2 py-1 rounded-full text-sm transition-colors ${
            group.hasUserReaction
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleReactionClick(group.emoji)}
          title={group.users.join(', ')}
        >
          <span className="mr-1">{group.emoji}</span>
          <span className="text-xs font-medium">{group.count}</span>
        </button>
      ))}
      
      <button
        type="button"
        aria-label="Add reaction"
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setShowPicker(true)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {showPicker && (
        <div className="relative">
          <ReactionPicker
            onSelect={handleAddReaction}
            onClose={handlePickerClose}
          />
        </div>
      )}
    </div>
  );
};

export default MessageReactions; 