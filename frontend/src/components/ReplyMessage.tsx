import React from 'react';

interface User {
  id: number;
  name: string;
  avatar?: string | null;
}

interface ReplyToMessage {
  id: number;
  content: string | null;
  user: User;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
  created_at: string;
  deleted_at?: string | null;
}

interface ReplyMessageProps {
  replyTo: ReplyToMessage;
  onCancel: () => void;
}

const ReplyMessage: React.FC<ReplyMessageProps> = ({ replyTo, onCancel }) => {
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '📷';
      case 'file':
      case 'document':
        return '📎';
      case 'audio':
      case 'voice':
        return '🎵';
      default:
        return '';
    }
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  const getDisplayContent = () => {
    if (replyTo.deleted_at) {
      return '🗑️ This message was deleted';
    }

    if (!replyTo.content) {
      return 'Empty message';
    }

    const icon = getMessageIcon(replyTo.message_type);
    const content = replyTo.message_type === 'text' 
      ? truncateContent(replyTo.content)
      : replyTo.content;
    
    return icon ? `${icon} ${content}` : content;
  };

  const getAvatarSrc = () => {
    return replyTo.user.avatar || '/default-avatar.png';
  };

  return (
    <div className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded-r-lg mb-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          <img
            src={getAvatarSrc()}
            alt={replyTo.user.name}
            className="w-6 h-6 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-blue-600">
              Replying to {replyTo.user.name}
            </div>
            <div 
              className="text-sm text-gray-600 truncate"
              role="button"
              tabIndex={0}
            >
              {getDisplayContent()}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel reply"
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReplyMessage; 