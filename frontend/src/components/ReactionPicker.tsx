import React, { useEffect, useRef } from 'react';
import '../styles/ReactionPicker.css';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  targetElement?: HTMLElement | null;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose, targetElement }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '😀', '😍', '🤔', '👏', '🙏', '🔥'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the target element (menu button)
        if (targetElement && targetElement.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listeners immediately to prevent issues
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, targetElement]);

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
      className="reaction-picker-container"
      style={{ 
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        zIndex: 99999, // Very high z-index to ensure visibility
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        minWidth: 'max-content',
        pointerEvents: 'auto', // Ensure clicks are captured
      }}
    >
      {emojis.map((emoji, index) => (
        <button
          key={index}
          type="button"
          aria-label={`React with ${emoji}`}
          className="reaction-emoji-button"
          onClick={() => handleEmojiClick(emoji)}
          onKeyDown={(e) => handleKeyDown(e, emoji)}
          style={{ 
            minWidth: '40px',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.125rem',
            transition: 'background-color 0.15s ease',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;