import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import Avatar from './Avatar';
import type { User } from '../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (type: 'private' | 'group', participantIds: number[], name?: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const userList = await userService.getUsers();
      setUsers(userList || []);
    } catch (error) {
      console.error('[NewChatModal] Failed to load users:', error);
      setError('Error loading users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show error message when search fails
  const showSearchError = searchQuery && filteredUsers.length === 0 && !loading && !error;

  const handleUserSelect = (user: User) => {
    setError('');
    if (chatType === 'private') {
      const isSelected = selectedUsers.find(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers([user]);
      }
    } else {
      const isSelected = selectedUsers.find(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleChatTypeChange = (type: 'private' | 'group') => {
    setError('');
    setChatType(type);
    if (type === 'private' && selectedUsers.length > 1) {
      setSelectedUsers(selectedUsers.slice(0, 1));
    }
  };

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setGroupName(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSearchQuery(e.target.value);
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      setError('Select at least one user');
      return;
    }
    
    if (chatType === 'group' && !groupName.trim()) {
      setError('Group name is required');
      return;
    }
    
    setError('');
    const participantIds = selectedUsers.map(user => user.id);
    const name = chatType === 'group' ? groupName : undefined;
    
    try {
      await onCreateChat(chatType, participantIds, name);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create chat');
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setChatType('private');
    setGroupName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Chat</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected: {selectedUsers.length}</h3>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                  <span>{user.name}</span>
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {loading ? (
            <div className="p-4 text-center">
              Loading users...
            </div>
          ) : error ? null : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleUserSelect(user)}
                        className="mr-3"
                        aria-label={user.name}
                      />
                      <Avatar
                        src={user.avatar}
                        alt={user.name}
                        size="md"
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Type Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="private"
                checked={chatType === 'private'}
                onChange={() => handleChatTypeChange('private')}
                className="mr-2"
              />
              <span className="text-sm">Private Chat</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="group"
                checked={chatType === 'group'}
                onChange={() => handleChatTypeChange('group')}
                className="mr-2"
              />
              <span className="text-sm">Group Chat</span>
            </label>
          </div>
        </div>

        {/* Group Name Input */}
        {chatType === 'group' && (
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName || ''}
              onChange={handleGroupNameChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 