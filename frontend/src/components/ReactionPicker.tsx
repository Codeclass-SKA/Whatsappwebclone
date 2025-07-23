import React, { useEffect, useRef } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '😀', '😍', '🤔', '👏', '🙏', '🔥'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listeners immediately
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent, emoji: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleEmojiClick(emoji);
    }
  };

  return (
    <div
      ref={pickerRef}
      role="dialog"
      aria-label="Reaction picker"
      className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 z-50"
    >
      {emojis.map((emoji, index) => (
        <button
          key={index}
          type="button"
          aria-label={`React with ${emoji}`}
          className="hover:bg-gray-100 rounded-full p-2 text-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => handleEmojiClick(emoji)}
          onKeyDown={(e) => handleKeyDown(e, emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker; 