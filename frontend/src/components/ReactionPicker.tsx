import React from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯'];

  const handleReactionClick = (emoji: string) => {
    console.log('[ReactionPicker] Selected emoji:', emoji);
    onSelect(emoji);
  };

  console.log('[ReactionPicker] Rendering with', reactions.length, 'reactions');

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-48">
      <div className="text-xs text-gray-500 mb-2 text-center">Choose reaction</div>
      <div className="grid grid-cols-5 gap-2">
        {reactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-100"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReactionPicker; 