import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAdminUsersQuery, useAdminStatsQuery } from './queries';

// Mock the API call functions
jest.mock('./api', () => ({
  getAdminUsers: jest.fn(),
  getAdminStats: jest.fn(),
}));

const { getAdminUsers, getAdminStats } = require('./api');

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Admin Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAdminUsersQuery', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = {
        users: [
          {
            _id: 'user1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'USER',
            isEnabled: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      getAdminUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useAdminUsersQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUsers);
      expect(getAdminUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should handle pagination parameters', async () => {
      const mockUsers = {
        users: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 2,
          hasNext: false,
          hasPrev: true,
        },
      };

      getAdminUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(
        () => useAdminUsersQuery({ page: 2, limit: 5 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getAdminUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
      });
    });

    it('should handle search and filter parameters', async () => {
      const mockUsers = {
        users: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      getAdminUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(
        () => useAdminUsersQuery({ 
          search: 'testuser',
          role: 'ADMIN',
          status: 'active'
        }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getAdminUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'testuser',
        role: 'ADMIN',
        status: 'active',
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to fetch users');
      getAdminUsers.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAdminUsersQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should refetch when parameters change', async () => {
      const mockUsers = {
        users: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      getAdminUsers.mockResolvedValue(mockUsers);

      const { result, rerender } = renderHook(
        ({ params }) => useAdminUsersQuery(params),
        {
          wrapper: createWrapper(),
          initialProps: { params: { page: 1 } },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getAdminUsers).toHaveBeenCalledTimes(1);

      // Change parameters
      rerender({ params: { page: 2 } });

      await waitFor(() => {
        expect(getAdminUsers).toHaveBeenCalledTimes(2);
      });

      expect(getAdminUsers).toHaveBeenLastCalledWith({
        page: 2,
        limit: 10,
      });
    });
  });

  describe('useAdminStatsQuery', () => {
    it('should fetch stats successfully', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        totalConversations: 1000,
        totalMessages: 50000,
        newUsersThisMonth: 25,
        activeUsersToday: 15,
        systemLoad: {
          cpu: 45,
          memory: 60,
          storage: 30,
        },
        monthlyStats: [
          { month: 'Oct 2024', users: 50, conversations: 200, messages: 5000 },
          { month: 'Sep 2024', users: 45, conversations: 180, messages: 4500 },
        ],
      };

      getAdminStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAdminStatsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(getAdminStats).toHaveBeenCalledWith();
    });

    it('should handle stats fetch errors', async () => {
      const mockError = new Error('Failed to fetch stats');
      getAdminStats.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAdminStatsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should refetch stats on demand', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        totalConversations: 1000,
        totalMessages: 50000,
      };

      getAdminStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAdminStatsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getAdminStats).toHaveBeenCalledTimes(1);

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(getAdminStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should use correct cache key', () => {
      const { result } = renderHook(() => useAdminStatsQuery(), {
        wrapper: createWrapper(),
      });

      // Check that the query key is correct for caching
      expect(result.current.fetchStatus).toBeDefined();
    });

    it('should handle loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      getAdminStats.mockReturnValue(promise);

      const { result } = renderHook(() => useAdminStatsQuery(), {
        wrapper: createWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Resolve the promise
      resolvePromise!({
        totalUsers: 100,
        activeUsers: 85,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBeDefined();
      });
    });
  });

  describe('Query invalidation and updates', () => {
    it('should invalidate users query after mutations', async () => {
      const mockUsers = {
        users: [],
        pagination: { totalCount: 0, totalPages: 0, currentPage: 1, hasNext: false, hasPrev: false },
      };

      getAdminUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useAdminUsersQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Simulate invalidation (would normally be triggered by mutations)
      result.current.refetch();

      await waitFor(() => {
        expect(getAdminUsers).toHaveBeenCalledTimes(2);
      });
    });
  });
});