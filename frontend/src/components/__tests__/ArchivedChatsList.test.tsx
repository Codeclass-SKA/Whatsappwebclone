import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArchivedChatsList from '../ArchivedChatsList';
import { Chat } from '../../types';

// Mock API service
jest.mock('../../services/api', () => ({
  getArchivedChats: jest.fn(),
  unarchiveChat: jest.fn(),
}));

const mockArchivedChats: Chat[] = [
  {
    id: 1,
    name: 'Archived Chat 1',
    type: 'private',
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_archived: true,
    is_muted: false,
    is_pinned: false,
    participants: [],
    last_message: {
      id: 1,
      content: 'Last message',
      type: 'text',
      created_at: '2024-01-01T00:00:00Z',
      user: {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        avatar: null,
        status: 'online',
        bio: null,
        is_online: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  },
  {
    id: 2,
    name: 'Archived Chat 2',
    type: 'group',
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_archived: true,
    is_muted: true,
    is_pinned: false,
    participants: [],
    last_message: null,
  },
];

describe('ArchivedChatsList', () => {
  const mockOnUnarchive = jest.fn();
  const mockOnSelectChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render archived chats list', () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    expect(screen.getByText('Archived Chats')).toBeInTheDocument();
    expect(screen.getByText('Archived Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Archived Chat 2')).toBeInTheDocument();
  });

  it('should show empty state when no archived chats', () => {
    render(
      <ArchivedChatsList
        chats={[]}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    expect(screen.getByText('No archived chats')).toBeInTheDocument();
  });

  it('should call onSelectChat when chat is clicked', async () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    fireEvent.click(screen.getByText('Archived Chat 1'));
    
    await waitFor(() => {
      expect(mockOnSelectChat).toHaveBeenCalledWith(mockArchivedChats[0]);
    });
  });

  it('should call onUnarchive when unarchive button is clicked', async () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    const unarchiveButtons = screen.getAllByText('Unarchive');
    fireEvent.click(unarchiveButtons[0]);
    
    await waitFor(() => {
      expect(mockOnUnarchive).toHaveBeenCalledWith(mockArchivedChats[0].id);
    });
  });

  it('should show chat type indicator', () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    // Should show group indicator for group chat
    expect(screen.getByText('group')).toBeInTheDocument();
  });

  it('should show last message preview', () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    expect(screen.getByText('User 1: Last message')).toBeInTheDocument();
  });

  it('should show muted indicator for muted chats', () => {
    render(
      <ArchivedChatsList
        chats={mockArchivedChats}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
      />
    );

    // Should show muted indicator for the second chat
    expect(screen.getByText('🔇')).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    render(
      <ArchivedChatsList
        chats={[]}
        onUnarchive={mockOnUnarchive}
        onSelectChat={mockOnSelectChat}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading archived chats...')).toBeInTheDocument();
  });
}); 