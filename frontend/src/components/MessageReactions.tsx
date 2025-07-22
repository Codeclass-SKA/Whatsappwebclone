import React from 'react';
import { useAuthStore } from '../store/authStore';
import type { MessageReaction } from '../types';

interface MessageReactionsProps {
  messageId: number;
  reactions: MessageReaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (reactionId: number) => void;
  onUpdateReaction: (reactionId: number, emoji: string) => void;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  onUpdateReaction,
}) => {
  const { user } = useAuthStore();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const handleReactionClick = (emoji: string) => {
    const userReaction = reactions.find(r => r.user_id === user?.id && r.emoji === emoji);
    
    if (userReaction) {
      // User already has this reaction, remove it
      onRemoveReaction(userReaction.id);
    } else {
      // User doesn't have this reaction, add it
      onAddReaction(emoji);
    }
  };

  // Only show reactions if there are any
  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userHasReaction = reactionList.some(r => r.user_id === user?.id);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              userHasReaction
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
            title={`${emoji} ${reactionList.length} ${reactionList.length === 1 ? 'reaction' : 'reactions'}`}
          >
            <span className="text-sm">{emoji}</span>
            <span className="font-medium">{reactionList.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions; 