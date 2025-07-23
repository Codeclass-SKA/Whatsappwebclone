import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatManagement from '../ChatManagement';
import { Chat } from '../../types';

// Mock API service
jest.mock('../../services/api', () => ({
  archiveChat: jest.fn(),
  unarchiveChat: jest.fn(),
  muteChat: jest.fn(),
  unmuteChat: jest.fn(),
  pinChat: jest.fn(),
  unpinChat: jest.fn(),
  exportChat: jest.fn(),
  getArchivedChats: jest.fn(),
}));

const mockChat: Chat = {
  id: 1,
  name: 'Test Chat',
  type: 'private',
  created_by: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_archived: false,
  is_muted: false,
  is_pinned: false,
  participants: [],
  last_message: null,
};

describe('ChatManagement', () => {
  const mockOnArchive = jest.fn();
  const mockOnMute = jest.fn();
  const mockOnPin = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Archive Chat', () => {
    it('should render archive button when chat is not archived', () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Archive Chat')).toBeInTheDocument();
    });

    it('should render unarchive button when chat is archived', () => {
      const archivedChat = { ...mockChat, is_archived: true };
      
      render(
        <ChatManagement
          chat={archivedChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Unarchive Chat')).toBeInTheDocument();
    });

    it('should call onArchive when archive button is clicked', async () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      fireEvent.click(screen.getByText('Archive Chat'));
      
      await waitFor(() => {
        expect(mockOnArchive).toHaveBeenCalledWith(mockChat.id, true);
      });
    });
  });

  describe('Mute Chat', () => {
    it('should render mute button when chat is not muted', () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Mute Chat')).toBeInTheDocument();
    });

    it('should render unmute button when chat is muted', () => {
      const mutedChat = { ...mockChat, is_muted: true };
      
      render(
        <ChatManagement
          chat={mutedChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Unmute Chat')).toBeInTheDocument();
    });

    it('should call onMute when mute button is clicked', async () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      fireEvent.click(screen.getByText('Mute Chat'));
      
      await waitFor(() => {
        expect(mockOnMute).toHaveBeenCalledWith(mockChat.id, true);
      });
    });
  });

  describe('Pin Chat', () => {
    it('should render pin button when chat is not pinned', () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Pin Chat')).toBeInTheDocument();
    });

    it('should render unpin button when chat is pinned', () => {
      const pinnedChat = { ...mockChat, is_pinned: true };
      
      render(
        <ChatManagement
          chat={pinnedChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Unpin Chat')).toBeInTheDocument();
    });

    it('should call onPin when pin button is clicked', async () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      fireEvent.click(screen.getByText('Pin Chat'));
      
      await waitFor(() => {
        expect(mockOnPin).toHaveBeenCalledWith(mockChat.id, true);
      });
    });
  });

  describe('Export Chat', () => {
    it('should render export button', () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Export Chat')).toBeInTheDocument();
    });

    it('should call onExport when export button is clicked', async () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
        />
      );

      fireEvent.click(screen.getByText('Export Chat'));
      
      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(mockChat.id);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when action is in progress', () => {
      render(
        <ChatManagement
          chat={mockChat}
          onArchive={mockOnArchive}
          onMute={mockOnMute}
          onPin={mockOnPin}
          onExport={mockOnExport}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
}); 