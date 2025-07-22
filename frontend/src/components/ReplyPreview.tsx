import React from 'react';
import type { Message } from '../types';

interface ReplyPreviewProps {
  message: Message;
  onCancelReply: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onCancelReply }) => {
  const getMessagePreview = (content: string) => {
    return content.length > 80 ? `${content.substring(0, 80)}...` : content;
  };

  return (
    <div className="p-4 border-t border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <div className="w-1 h-full bg-green-500 rounded-full mr-3" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-600">
                Replying to {message.user?.name || '...'}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {getMessagePreview(message.content)}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onCancelReply}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          title="Cancel reply"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview; 