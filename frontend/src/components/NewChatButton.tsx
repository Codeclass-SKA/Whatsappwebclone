import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 bg-white"
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">New Chat</h3>
          <p className="text-sm text-gray-500">Start a new conversation</p>
        </div>
      </div>
    </button>
  );
};

export default NewChatButton; 