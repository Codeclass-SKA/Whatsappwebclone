import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Avatar from './Avatar';
import MessageReactions from './MessageReactions';
import MessageActions from './MessageActions';
import ReplyMessage from './ReplyMessage';
import { addReaction, removeReaction, updateReaction, getMessageReactions } from '../services/api';
import type { Message, MessageReaction } from '../types';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onScrollToBottom?: () => void;
  onReactionAdded?: (reaction: any) => void;
  onReactionRemoved?: (reactionData: any) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  loading = false,
  onReply,
  onForward,
  onScrollToBottom,
  onReactionAdded,
  onReactionRemoved
}) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useState<Record<number, MessageReaction[]>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    } else if (containerRef.current) {
      // Fallback to scroll container directly
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const isNearBottomThreshold = 100; // pixels from bottom

  const checkIfNearBottom = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < isNearBottomThreshold;
    
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom);
    
    // Auto-scroll if user is near bottom and new message arrives
    if (nearBottom && autoScroll) {
      scrollToBottom('smooth');
    }
    
    // Call callback when user reaches bottom
    if (nearBottom && onScrollToBottom) {
      onScrollToBottom();
    }
  };

  const handleScroll = () => {
    checkIfNearBottom();
  };

  // Handle message tap/click
  const handleMessageTap = (messageId: number) => {
    setActiveMessageId(activeMessageId === messageId ? null : messageId);
  };

  // Close active message when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Do not close if the click is inside a message container or a reaction picker
      if (
        !target.closest('.message-container') &&
        !target.closest('.reaction-picker-container') // Add a class to the picker's container
      ) {
        setActiveMessageId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on first load or when new messages arrive
    if (messages.length > 0) {
      // Always scroll to bottom when messages change and user is near bottom
      if (isNearBottom) {
        scrollToBottom('smooth');
      } else if (autoScroll) {
        // Also scroll if autoScroll is explicitly enabled
        scrollToBottom('smooth');
      } else {
        // Show scroll button if user is not near bottom
        setShowScrollButton(true);
      }
    }
  }, [messages, isNearBottom, autoScroll]);

  // Auto-scroll on initial load and when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Load reactions for all messages with debouncing and caching
  useEffect(() => {
    const loadReactions = async () => {
      if (messages.length === 0) return;
      
      // Only load reactions for messages that don't have reactions loaded yet
      const messagesNeedingReactions = messages.filter(
        message => !reactions[message.id] && message.id
      );
      
      if (messagesNeedingReactions.length === 0) return;
      
      const reactionsMap: { [key: number]: any[] } = {};
      
      // Load reactions in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < messagesNeedingReactions.length; i += batchSize) {
        const batch = messagesNeedingReactions.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (message) => {
            try {
              const messageReactions = await getMessageReactions(message.id);
              reactionsMap[message.id] = messageReactions;
            } catch (error) {
              console.error(`Failed to load reactions for message ${message.id}:`, error);
              reactionsMap[message.id] = [];
            }
          })
        );
        
        // Small delay between batches to prevent server overload
        if (i + batchSize < messagesNeedingReactions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setReactions(prev => ({ ...prev, ...reactionsMap }));
    };

    // Debounce the reaction loading to prevent excessive API calls
    const timeoutId = setTimeout(loadReactions, 500);
    
    return () => clearTimeout(timeoutId);
  }, [messages, reactions]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      const newReaction = await addReaction(messageId, emoji);
      
      // Update local state
      setReactions(prev => {
        const updated = {
          ...prev,
          [messageId]: [...(prev[messageId] || []), newReaction]
        };
        return updated;
      });
    } catch (error) {
      console.error('[MessageList] Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: number, reactionId: number) => {
    try {
      await removeReaction(messageId, reactionId);
      setReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter(r => r.id !== reactionId)
      }));
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleUpdateReaction = async (messageId: number, reactionId: number, emoji: string) => {
    try {
      const updatedReaction = await updateReaction(messageId, reactionId, emoji);
      setReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] || []).map(r => 
          r.id === reactionId ? updatedReaction : r
        )
      }));
    } catch (error) {
      console.error('Failed to update reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number, deleteType: 'for_me' | 'for_everyone') => {
    try {
      // The message will be updated via WebSocket or polling
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleScrollToBottom = () => {
    scrollToBottom('smooth');
    setAutoScroll(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-sm">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-white">
      {/* Messages Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
        onScroll={handleScroll}
      >
        {messages.map((message, index) => {
          const isOwn = isOwnMessage(message);
          const messageReactions = reactions[message.id] || [];
          const isActive = activeMessageId === message.id;
          
          return (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} message-container`}
            >
              <div className="relative group">
                {/* Message Bubble */}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handleMessageTap(message.id)}
                >
                  {/* Reply Preview */}
                  {message.reply_to && (
                    <div className={`text-xs mb-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                      <div className="font-medium">Replying to:</div>
                      <div className="truncate">{message.reply_to.content}</div>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="break-words">{message.content}</div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>

                {/* Message Actions */}
                <MessageActions
                  message={message}
                  isActive={isActive}
                  onReply={onReply || (() => {})}
                  onForward={onForward || (() => {})}
                  onDelete={handleDeleteMessage}
                  onReact={handleAddReaction}
                />

                {/* Reactions */}
                {messageReactions.length > 0 && (
                  <MessageReactions
                    reactions={messageReactions}
                    onRemoveReaction={handleRemoveReaction}
                    onUpdateReaction={handleUpdateReaction}
                    messageId={message.id}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll to Bottom Button */}
      {!autoScroll && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageList;