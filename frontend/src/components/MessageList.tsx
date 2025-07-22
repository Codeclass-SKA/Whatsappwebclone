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
    messagesEndRef.current?.scrollIntoView({ behavior });
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
    console.log('[MessageList] Messages changed:', messages);
    
    // Auto-scroll to bottom on first load or when user is near bottom
    if (messages.length > 0) {
      if (isNearBottom || autoScroll) {
        scrollToBottom('smooth');
      } else {
        // Show scroll button if user is not near bottom
        setShowScrollButton(true);
      }
    }
  }, [messages, isNearBottom, autoScroll]);

  // Load reactions for messages
  useEffect(() => {
    const loadReactions = async () => {
      console.log('[MessageList] Loading reactions for', messages.length, 'messages');
      const reactionsMap: Record<number, MessageReaction[]> = {};
      
      for (const message of messages) {
        try {
          console.log('[MessageList] Loading reactions for message ID:', message.id);
          const messageReactions = await getMessageReactions(message.id);
          console.log('[MessageList] Reactions for message', message.id, ':', messageReactions);
          reactionsMap[message.id] = messageReactions;
        } catch (error) {
          console.error(`Failed to load reactions for message ${message.id}:`, error);
          reactionsMap[message.id] = [];
        }
      }
      
      console.log('[MessageList] Final reactions map:', reactionsMap);
      setReactions(reactionsMap);
    };

    if (messages.length > 0) {
      loadReactions();
      
      // Set up periodic refresh of reactions every 1 second for real-time feel
      const interval = setInterval(loadReactions, 1000);
      return () => clearInterval(interval);
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      console.log('[MessageList] Adding reaction:', emoji, 'to message:', messageId);
      const newReaction = await addReaction(messageId, emoji);
      console.log('[MessageList] Reaction added successfully:', newReaction);
      
      // Update local state
      setReactions(prev => {
        const updated = {
          ...prev,
          [messageId]: [...(prev[messageId] || []), newReaction]
        };
        console.log('[MessageList] Updated reactions state:', updated);
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

  console.log('[MessageList] Rendering with messages:', messages.length, 'loading:', loading);

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
        {messages.map((message) => {
          console.log('[MessageList] Rendering message:', message);
          const isOwn = isOwnMessage(message);
          const messageReactions = reactions[message.id] || [];
          const isActive = activeMessageId === message.id;
          
          console.log('[MessageList] Message', message.id, 'reactions:', messageReactions);
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} message-container`}
            >
              <div className="max-w-xs lg:max-w-md">
                {/* Reply message */}
                {message.reply_to && (
                  <ReplyMessage 
                    replyTo={message.reply_to} 
                    isOwnMessage={isOwn}
                  />
                )}
                
                {/* Main message */}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 ${
                    isOwn
                      ? `bg-gradient-to-r from-green-500 to-green-600 text-white ${
                          isActive ? 'ring-2 ring-green-300 ring-opacity-50' : ''
                        }`
                      : `bg-white text-gray-800 ${
                          isActive ? 'ring-2 ring-gray-300 ring-opacity-50' : ''
                        }`
                  }`}
                  onClick={() => handleMessageTap(message.id)}
                >
                  {!isOwn && (
                    <div className="flex items-center mb-1">
                      <Avatar
                        src={message.user.avatar}
                        alt={message.user.name}
                        size="sm"
                        className="mr-2"
                      />
                      <span className="text-xs font-medium text-gray-600">
                        {message.user.name}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm break-words">{message.content}</p>
                  
                  <div className={`text-xs mt-1 ${
                    isOwn ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>

                {/* Message reactions - always visible if exists */}
                {(() => {
                  console.log('[MessageList] Checking reactions for message', message.id, ':', messageReactions.length, 'reactions');
                  return messageReactions.length > 0;
                })() && (
                  <div className="mt-1">
                    <MessageReactions
                      messageId={message.id}
                      reactions={messageReactions}
                      onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                      onRemoveReaction={(reactionId) => handleRemoveReaction(message.id, reactionId)}
                      onUpdateReaction={(reactionId, emoji) => handleUpdateReaction(message.id, reactionId, emoji)}
                    />
                  </div>
                )}

                {/* Message actions - always rendered, visibility controlled internally */}
                <div className="mt-1 transition-opacity duration-200">
                  <MessageActions
                    message={message}
                    isActive={isActive}
                    onReply={onReply || (() => {})}
                    onForward={onForward || (() => {})}
                    onDelete={handleDeleteMessage}
                    onReact={(emoji) => handleAddReaction(message.id, emoji)}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-4 right-4 w-12 h-12 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110 z-10 flex items-center justify-center"
          title="Scroll to bottom"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* New Message Indicator */}
      {!isNearBottom && messages.length > 0 && (
        <div className="absolute bottom-16 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-lg z-10 animate-pulse">
          New messages
        </div>
      )}
    </div>
  );
};

export default MessageList;