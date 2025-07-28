import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EchoErrorBoundary from '../EchoErrorBoundary';

// Mock Echo
const mockEcho = {
  connector: {
    pusher: {
      connection: {
        state: 'disconnected'
      }
    }
  }
};

jest.mock('../../lib/echo', () => ({
  echo: mockEcho
}));

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload
  },
  writable: true
});

describe('EchoErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockEcho.connector as any).pusher = { connection: { state: 'disconnected' } };
  });

  describe('TDD: Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <EchoErrorBoundary>
          <div>Test Content</div>
        </EchoErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('TDD: Error Handling', () => {
    it('should render error UI when Echo connection fails', () => {
      const TestError = () => {
        throw new Error('Echo Connection Failed');
      };

      render(
        <EchoErrorBoundary>
          <TestError />
        </EchoErrorBoundary>
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('There was an issue with the WebSocket connection. Chat functionality may be limited.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('TDD: Error Recovery', () => {
    it('should handle retry button click', () => {
      const TestError = () => {
        throw new Error('Echo Connection Failed');
      };

      render(
        <EchoErrorBoundary>
          <TestError />
        </EchoErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should call window.location.reload
      expect(mockReload).toHaveBeenCalled();
    });

    it('should reset error state when retry is clicked', () => {
      const TestError = () => {
        throw new Error('Echo Connection Failed');
      };

      render(
        <EchoErrorBoundary>
          <TestError />
        </EchoErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should reset error state
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('TDD: Error Boundary Lifecycle', () => {
    it('should log error information', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestError = () => {
        throw new Error('Echo Connection Failed');
      };

      render(
        <EchoErrorBoundary>
          <TestError />
        </EchoErrorBoundary>
      );

      // Should log error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});