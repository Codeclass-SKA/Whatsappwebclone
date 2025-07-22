import React from 'react';
import type { MessageReaction } from '../types';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onRemoveReaction: (messageId: number, reactionId: number) => void;
  onUpdateReaction: (messageId: number, reactionId: number, emoji: string) => void;
  messageId: number;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onRemoveReaction,
  onUpdateReaction,
  messageId
}) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, reactionGroup]) => (
        <div
          key={emoji}
          className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-xs"
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-gray-600">{reactionGroup.length}</span>
        </div>
      ))}
    </div>
  );
};

export default MessageReactions; 