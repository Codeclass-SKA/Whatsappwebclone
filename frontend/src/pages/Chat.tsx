import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import ChatList from '../components/ChatList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ReplyPreview from '../components/ReplyPreview'; // Import the new component
import NewChatButton from '../components/NewChatButton';
import NewChatModal from '../components/NewChatModal';
import ForwardMessageModal from '../components/ForwardMessageModal';
import MessageSearch from '../components/MessageSearch';
import LogoutButton from '../components/LogoutButton';
import EchoErrorBoundary from '../components/EchoErrorBoundary';
import { useEcho } from '../hooks/useEcho';
import { useMessagePolling } from '../hooks/useMessagePolling';
import { addReaction, removeReaction, updateReaction, getMessageReactions, forwardMessage, deleteMessage } from '../services/api';
import chatService from '../services/chatService';
import type { Chat, Message } from '../types';

const Chat: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null); // State for the message being replied to
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(null);

  const handleNewMessage = (newMessage: Message) => {
    if (newMessage.chat_id === selectedChat?.id) {
      setMessages(prev => [...prev, newMessage]);
      setChats(prev => prev.map(chat => 
        chat.id === newMessage.chat_id 
          ? { 
              ...chat, 
              last_message: {
                id: newMessage.id,
                content: newMessage.content,
                type: newMessage.message_type,
                created_at: newMessage.created_at,
                user: newMessage.user
              }
            }
          : chat
      ));
    }
  };

  // Handle real-time reaction updates
  const handleReactionAdded = (reaction: any) => {
    // Trigger a re-load of reactions for the specific message
    // This will be handled by the existing loadReactions logic in MessageList
  };

  const handleReactionRemoved = (reactionData: any) => {
    // Trigger a re-load of reactions for the specific message
    // This will be handled by the existing loadReactions logic in MessageList
  };

  // Function to jump to latest messages
  const jumpToLatest = () => {
    setUnreadCount(0);
    if (messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
    }
    // This will trigger scroll to bottom in MessageList
  };

  // Mark messages as read when user scrolls to bottom
  const handleMessagesRead = () => {
    if (messages.length > 0) {
      const latestMessageId = messages[messages.length - 1].id;
      if (latestMessageId !== lastReadMessageId) {
        setLastReadMessageId(latestMessageId);
        setUnreadCount(0);
      }
    }
  };

  // Laravel Echo hook (primary method) - wrapped in error boundary
  const EchoHookWrapper = () => {
    useEcho({
      chatId: selectedChat?.id,
      onMessageReceived: handleNewMessage,
      onReactionAdded: handleReactionAdded,
      onReactionRemoved: handleReactionRemoved
    });
    return null;
  };

  // Polling hook (fallback method)
  useMessagePolling({
    chatId: selectedChat?.id,
    onMessageReceived: handleNewMessage,
    pollingInterval: 3000 // Poll every 3 seconds to reduce server load
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Down arrow to jump to latest
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowDown') {
        event.preventDefault();
        jumpToLatest();
      }
      
      // Ctrl/Cmd + F to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        if (selectedChat) {
          handleOpenMessageSearch();
        }
      }
      
      // Escape to clear reply
      if (event.key === 'Escape' && replyingTo) {
        setReplyingTo(null);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [replyingTo, selectedChat]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadChats();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatList = await chatService.getChats();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      setLoading(true);
      const messageList = await chatService.getMessages(chatId);
      setMessages(messageList);
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setReplyingTo(null); // Clear reply when switching chats
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedChat || sending) return;

    setSending(true);

    try {
      // Create payload with only necessary fields
      const payload: any = {
        content,
        type: 'text' // Backend expects 'type' not 'message_type'
      };

      // Only add reply_to_id if we're actually replying to a message
      if (replyingTo && replyingTo.id) {
        payload.reply_to_id = replyingTo.id;
      }

      const newMessage: Message = await chatService.sendMessage(selectedChat.id, payload);
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Reset reply state after sending
      if (replyingTo) {
        setReplyingTo(null);
      }
      
      // Update the last message in the chat list on the sidebar
      setChats(prevChats =>
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                last_message: { 
                  id: newMessage.id,
                  content, 
                  type: newMessage.message_type,
                  created_at: newMessage.created_at,
                  user: newMessage.user
                } 
              }
            : chat
        )
      );
    } catch (error: any) {
      console.error('[Chat] Failed to send message:', error);
      alert(`Failed to send message: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleCreateChat = async (type: 'private' | 'group', participantIds: number[], name?: string) => {
    try {
      const newChat = await chatService.createChat({ type, participant_ids: participantIds, name });
      
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('[Chat] Failed to create chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleForward = (message: Message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  const handleForwardMessage = async (targetChatId: number) => {
    if (!messageToForward) return;

    try {
      await forwardMessage(messageToForward.id, targetChatId);
      alert('Message forwarded successfully!');
    } catch (error) {
      console.error('Failed to forward message:', error);
      alert('Failed to forward message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: number, deleteType: 'for_me' | 'for_everyone') => {
    try {
      await deleteMessage(messageId, deleteType);
      // Update messages list to reflect deletion
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          if (deleteType === 'for_everyone') {
            return { ...msg, deleted_for_all: true };
          } else {
            return { ...msg, is_deleted: true };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleStartReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleOpenMessageSearch = () => {
    setShowMessageSearch(true);
  };

  const handleMessageSelect = (message: Message) => {
    setShowMessageSearch(false);
    // TODO: Scroll to the selected message in MessageList
    console.log('Selected message:', message);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Echo Error Boundary */}
      <EchoErrorBoundary>
        <EchoHookWrapper />
      </EchoErrorBoundary>
      
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  size="md"
                  className="mr-3"
                />
                <div>
                  <h2 className="font-semibold">{user?.name}</h2>
                  <p className="text-sm text-green-100">Online</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>

          {/* New Chat Button */}
          <div className="bg-white">
            <NewChatButton onClick={() => setShowNewChatModal(true)} />
          </div>

          {/* Chat List */}
          <div className="flex-1 bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-white">
                <div className="spinner"></div>
              </div>
            ) : (
              <ChatList chats={chats} onChatSelect={handleChatSelect} />
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar
                      src={selectedChat.avatar}
                      alt={selectedChat.name}
                      size="md"
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedChat.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedChat.type === 'group' 
                          ? `${selectedChat.participants.length} participants`
                          : selectedChat.participants.find(p => p.id !== user?.id)?.is_online 
                            ? 'Online' 
                            : 'Offline'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Chat Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Jump to Latest Button */}
                    {unreadCount > 0 && (
                      <button
                        onClick={jumpToLatest}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors flex items-center gap-1"
                        title={`${unreadCount} new message${unreadCount > 1 ? 's' : ''} (Ctrl+↓ to jump)`}
                      >
                        <span>{unreadCount}</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      onClick={handleOpenMessageSearch}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Search messages"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="More options"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 bg-white">
                <MessageList 
                  messages={messages.filter(msg => !msg.is_deleted && !msg.deleted_for_all)} 
                  loading={loading}
                  onReply={handleStartReply}
                  onForward={handleForward}
                  onScrollToBottom={handleMessagesRead}
                  onReactionAdded={handleReactionAdded}
                  onReactionRemoved={handleReactionRemoved}
                />
                {replyingTo && (
                  <ReplyPreview 
                    replyTo={replyingTo} 
                    isOwnMessage={replyingTo.sender_id === user?.id}
                    onCancelReply={handleCancelReply}
                  />
                )}
              </div>

              {/* Message Input */}
              <MessageInput 
                onSendMessage={handleSendMessage} 
                disabled={sending}
                placeholder={`Message ${selectedChat.name}...`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
                <p className="text-sm">Choose a conversation to start messaging</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleCreateChat}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setMessageToForward(null);
        }}
        message={messageToForward}
        onForward={handleForwardMessage}
      />

      {/* Message Search Modal */}
      <MessageSearch
        chatId={selectedChat?.id || 0}
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        onMessageSelect={handleMessageSelect}
      />
    </div>
  );
};

export default Chat;