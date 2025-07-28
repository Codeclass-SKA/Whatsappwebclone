import axios from 'axios';

// Mock axios before any imports
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Import after mocking
import { authService } from '../api';

const mockedAxios = axios as jest.Mocked<typeof axios>;

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
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const result = await authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123',
        });
        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
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
        mockedAxios.post.mockRejectedValueOnce(errorResponse);

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
            message: 'Login successful',
          },
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const result = await authService.login({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
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
        mockedAxios.post.mockRejectedValueOnce(errorResponse);

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
            message: 'Logout successful',
          },
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const result = await authService.logout();

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
        expect(result).toEqual(mockResponse.data);
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
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await authService.getProfile();

        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
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
        mockedAxios.get.mockRejectedValueOnce(errorResponse);

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
            user: mockUser,
            message: 'Profile updated successfully',
          },
        };
        mockedAxios.put.mockResolvedValueOnce(mockResponse);

        const result = await authService.updateProfile({
          name: 'Updated User',
          email: 'updated@example.com',
        });

        expect(mockedAxios.put).toHaveBeenCalledWith('/auth/profile', {
          name: 'Updated User',
          email: 'updated@example.com',
        });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('TDD: Error Handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
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
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

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
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

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
        },
      };

      const startTime = Date.now();
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete within 100ms in test environment
      expect(responseTime).toBeLessThan(100);
    });
  });
}); 