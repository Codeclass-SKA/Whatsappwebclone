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

interface ReplyPreviewProps {
  replyTo: ReplyToMessage;
  isOwnMessage: boolean;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, isOwnMessage }) => {
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

  const truncateContent = (content: string, maxLength: number = 30) => {
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

  const getContainerClasses = () => {
    const baseClasses = 'mb-1 p-2 rounded-lg border-l-4';
    return isOwnMessage 
      ? `${baseClasses} bg-green-50 border-green-300` 
      : `${baseClasses} bg-gray-50 border-gray-300`;
  };

  const getIndicatorClasses = () => {
    const baseClasses = 'w-2 h-2 rounded-full';
    return isOwnMessage 
      ? `${baseClasses} bg-green-500` 
      : `${baseClasses} bg-gray-500`;
  };

  const getTextClasses = () => {
    return isOwnMessage ? 'text-green-700' : 'text-gray-600';
  };

  return (
    <div className={getContainerClasses()}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <div className={getIndicatorClasses()} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium text-gray-600">
              {replyTo.user.name}
            </span>
            {getMessageIcon(replyTo.message_type) && (
              <span className="text-xs">{getMessageIcon(replyTo.message_type)}</span>
            )}
          </div>
          <p 
            className={`text-xs ${getTextClasses()}`}
            role="button"
            tabIndex={0}
          >
            {getDisplayContent()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplyPreview; 