import React from 'react';
import type { Message } from '../types';

interface ReplyMessageProps {
  replyTo: Message;
  isOwnMessage: boolean;
}

const ReplyMessage: React.FC<ReplyMessageProps> = ({ replyTo, isOwnMessage }) => {
  const getMessagePreview = (content: string) => {
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content;
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return '🖼️';
      case 'file':
      case 'document':
        return '📎';
      case 'voice':
      case 'audio':
        return '🎵';
      default:
        return null;
    }
  };

  return (
    <div className={`mb-1 p-2 rounded-lg border-l-4 ${
      isOwnMessage 
        ? 'bg-green-50 border-green-300' 
        : 'bg-gray-50 border-gray-300'
    }`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${
            isOwnMessage ? 'bg-green-500' : 'bg-gray-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium text-gray-600">
              {replyTo.user.name}
            </span>
            {getMessageTypeIcon(replyTo.message_type) && (
              <span className="text-xs">{getMessageTypeIcon(replyTo.message_type)}</span>
            )}
          </div>
          <p className={`text-xs ${
            isOwnMessage ? 'text-green-700' : 'text-gray-600'
          }`}>
            {getMessagePreview(replyTo.content)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplyMessage; 