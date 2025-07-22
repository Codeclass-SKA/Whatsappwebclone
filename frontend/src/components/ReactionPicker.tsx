import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  targetElement?: HTMLElement | null;
}

const ReactionPicker: React.FC<ReactionPickerProps> = memo(({ onSelect, onClose, targetElement }) => {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯'];
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [isVisible, setIsVisible] = useState(true);

  // Calculate position with debouncing
  const calculatePosition = useCallback(() => {
    if (targetElement && pickerRef.current) {
      const targetRect = targetElement.getBoundingClientRect();
      const pickerHeight = pickerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Check if there's enough space below
      const spaceBelow = windowHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      
      // If not enough space below but enough above, show above
      if (spaceBelow < pickerHeight && spaceAbove > pickerHeight) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
  }, [targetElement]);

  useEffect(() => {
    calculatePosition();
    
    // Debounced position calculation
    const timeoutId = setTimeout(calculatePosition, 100);
    return () => clearTimeout(timeoutId);
  }, [calculatePosition]);

  // Prevent closing when clicking inside picker
  const handlePickerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Optimized reaction click handler
  const handleReactionClick = useCallback((emoji: string) => {
    onSelect(emoji);
    setIsVisible(false);
  }, [onSelect]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Add small delay to prevent immediate closing
        setTimeout(() => {
          if (isVisible) {
            handleClose();
          }
        }, 50);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={pickerRef}
      onClick={handlePickerClick}
      className={`bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-48 absolute ${
        position === 'top' 
          ? 'bottom-full mb-2' 
          : 'top-full mt-2'
      }`}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        maxHeight: '200px',
        overflowY: 'auto',
        pointerEvents: 'auto'
      }}
    >
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
          onClick={handleClose}
          className="w-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

export default ReactionPicker; 