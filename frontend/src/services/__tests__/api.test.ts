import axios from 'axios';

// Mock axios before any imports
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Import after mocking
import { authService } from '../api';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('TDD: Authentication Service', () => {
    describe('register', () => {
      it('should register user successfully', async () => {
        const mockUser = {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          avatar: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };
        const mockResponse = {
          data: {
            user: mockUser,
            token: 'mock-token',
            message: 'User registered successfully',
          },
        };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
        const result = await authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123',
        });
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123',
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle registration errors', async () => {
        const errorResponse = {
          response: {
            status: 422,
            data: {
              message: 'Validation failed',
              errors: {
                email: ['The email has already been taken.'],
              },
            },
          },
        };
        mockAxiosInstance.post.mockRejectedValueOnce(errorResponse);

        await expect(
          authService.register({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            password_confirmation: 'password123',
          })
        ).rejects.toEqual(errorResponse);
      });
    });

    describe('login', () => {
      it('should login user successfully', async () => {
        const mockUser = {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          avatar: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };
        const mockResponse = {
          data: {
            user: mockUser,
            token: 'mock-token',
            message: 'User logged in successfully',
          },
        };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
        const result = await authService.login({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle login errors', async () => {
        const errorResponse = {
          response: {
            status: 401,
            data: {
              message: 'Invalid credentials',
            },
          },
        };
        mockAxiosInstance.post.mockRejectedValueOnce(errorResponse);

        await expect(
          authService.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        ).rejects.toEqual(errorResponse);
      });
    });

    describe('logout', () => {
      it('should logout user successfully', async () => {
        const mockResponse = {
          data: {
            message: 'User logged out successfully',
          },
        };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
        await authService.logout();
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      });
    });

    describe('getProfile', () => {
      it('should get user profile successfully', async () => {
        const mockUser = {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          avatar: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };
        const mockResponse = {
          data: {
            user: mockUser,
          },
        };
        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
        const result = await authService.getProfile();
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile');
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle unauthorized access', async () => {
        const errorResponse = {
          response: {
            status: 401,
            data: {
              message: 'Unauthorized',
            },
          },
        };
        mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);

        await expect(authService.getProfile()).rejects.toEqual(errorResponse);
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const mockUser = {
          id: 1,
          name: 'Updated User',
          email: 'updated@example.com',
          avatar: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };
        const mockResponse = {
          data: {
            message: 'Profile updated successfully',
            user: mockUser,
          },
        };
        mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);
        const result = await authService.updateProfile({
          name: 'Updated User',
          email: 'updated@example.com',
        });
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', {
          name: 'Updated User',
          email: 'updated@example.com',
        });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('TDD: Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.post.mockRejectedValueOnce(networkError);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network Error');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toEqual(errorResponse);
    });

    it('should handle validation errors', async () => {
      const errorResponse = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              email: ['The email field is required.'],
              password: ['The password field is required.'],
            },
          },
        },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      await expect(
        authService.register({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
        })
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('TDD: Performance Monitoring', () => {
    it('should handle requests within acceptable time', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      const mockResponse = {
        data: {
          user: mockUser,
          token: 'mock-token',
          message: 'User logged in successfully',
        },
      };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
      
      const startTime = Date.now();
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });
      const endTime = Date.now();
      
      expect(result).toEqual(mockResponse.data);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 