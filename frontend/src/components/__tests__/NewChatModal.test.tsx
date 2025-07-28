import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewChatModal from '../NewChatModal';
import { userService } from '../../services/api';
import type { User } from '../../types';

// Mock API services
jest.mock('../../services/api', () => ({
  userService: {
    getUsers: jest.fn(),
    searchUsers: jest.fn(),
  },
}));

describe('NewChatModal', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      is_online: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      is_online: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCreateChat: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (userService.getUsers as jest.Mock).mockResolvedValue(mockUsers);
    (userService.searchUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  describe('TDD: Modal Display', () => {
    it('should render modal when isOpen is true', () => {
      render(<NewChatModal {...defaultProps} />);
      
      expect(screen.getByText('New Chat')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<NewChatModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('New Chat')).not.toBeInTheDocument();
    });

    it('should show loading state while fetching users', async () => {
      (userService.getUsers as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<NewChatModal {...defaultProps} />);
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
      });
    });
  });

  describe('TDD: User Selection', () => {
    it('should display user list', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should allow selecting users', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        const userCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        fireEvent.click(userCheckbox);
      });

      expect(screen.getByText('Selected: 1')).toBeInTheDocument();
    });

    it('should allow deselecting users', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        const userCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        fireEvent.click(userCheckbox);
        fireEvent.click(userCheckbox);
      });

      await waitFor(() => {
        expect(screen.queryByText('Selected: 1')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('TDD: Chat Type Selection', () => {
    it('should default to private chat for single user', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        const userCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        fireEvent.click(userCheckbox);
      });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(defaultProps.onCreateChat).toHaveBeenCalledWith('private', [1], undefined);
    });

    it('should allow selecting multiple users', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      // Switch to group chat first
      const groupRadio = screen.getByRole('radio', { name: /Group Chat/i });
      fireEvent.click(groupRadio);
      
      await waitFor(() => {
        const johnCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        const janeCheckbox = screen.getByRole('checkbox', { name: /Jane Smith/i });
        fireEvent.click(johnCheckbox);
        fireEvent.click(janeCheckbox);
      });

      // Check that both users are selected (using more specific selectors)
      expect(screen.getByText('Selected: 2')).toBeInTheDocument();
      // Check selected user names in the selected users section only
      const selectedUsersSection = screen.getByText('Selected: 2').closest('div');
      expect(selectedUsersSection).toHaveTextContent('John Doe');
      expect(selectedUsersSection).toHaveTextContent('Jane Smith');
    });

    it('should require group name for multiple users', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      // Select group chat type
      const groupRadio = screen.getByRole('radio', { name: /Group Chat/i });
      fireEvent.click(groupRadio);
      
      await waitFor(() => {
        const johnCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        const janeCheckbox = screen.getByRole('checkbox', { name: /Jane Smith/i });
        fireEvent.click(johnCheckbox);
        fireEvent.click(janeCheckbox);
      });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(screen.getByText('Group name is required')).toBeInTheDocument();
    });
  });

  describe('TDD: User Search', () => {
    it('should filter users based on search input', async () => {
      (userService.searchUsers as jest.Mock).mockResolvedValue([mockUsers[0]]);
      
      render(<NewChatModal {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search returns empty', async () => {
      (userService.searchUsers as jest.Mock).mockResolvedValue([]);
      
      render(<NewChatModal {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentUser' } });

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should handle search errors gracefully', async () => {
      (userService.getUsers as jest.Mock).mockRejectedValue(new Error('Search failed'));
      
      render(<NewChatModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading users')).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Form Submission', () => {
    it('should create private chat successfully', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        const userCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        fireEvent.click(userCheckbox);
      });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(defaultProps.onCreateChat).toHaveBeenCalledWith('private', [1], undefined);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should create group chat successfully', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      // Select group chat type
      const groupRadio = screen.getByRole('radio', { name: /Group Chat/i });
      fireEvent.click(groupRadio);
      
      await waitFor(() => {
        const johnCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        const janeCheckbox = screen.getByRole('checkbox', { name: /Jane Smith/i });
        fireEvent.click(johnCheckbox);
        fireEvent.click(janeCheckbox);
      });

      const groupNameInput = screen.getByPlaceholderText('Enter group name');
      fireEvent.change(groupNameInput, { target: { value: 'Test Group' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(defaultProps.onCreateChat).toHaveBeenCalledWith('group', [1, 2], 'Test Group');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should validate minimum participants', async () => {
      render(<NewChatModal {...defaultProps} />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);
      });

      expect(screen.getByText('Select at least one user')).toBeInTheDocument();
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Failed to create chat');
      const mockOnCreateChat = jest.fn().mockRejectedValue(mockError);
      
      render(<NewChatModal {...defaultProps} onCreateChat={mockOnCreateChat} />);
      
      await waitFor(() => {
        const userCheckbox = screen.getByRole('checkbox', { name: /John Doe/i });
        fireEvent.click(userCheckbox);
      });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create chat')).toBeInTheDocument();
      });
    });
  });
});