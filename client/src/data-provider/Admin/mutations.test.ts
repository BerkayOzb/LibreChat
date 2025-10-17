import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useBanUserMutation,
  useAdminDeleteUserMutation,
} from './mutations';

// Mock the API call functions
jest.mock('./api', () => ({
  createUser: jest.fn(),
  updateUserRole: jest.fn(),
  banUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const { createUser, updateUserRole, banUser, deleteUser } = require('./api');
const toast = require('react-hot-toast').toast;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Admin Mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCreateUserMutation', () => {
    it('should create user successfully', async () => {
      const mockCreatedUser = {
        user: {
          _id: 'newuser123',
          username: 'newuser',
          email: 'newuser@test.com',
          role: 'USER',
          isEnabled: true,
        },
        message: 'User created successfully',
      };

      createUser.mockResolvedValue(mockCreatedUser);

      const { result } = renderHook(() => useCreateUserMutation(), {
        wrapper: createWrapper(),
      });

      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'USER',
      };

      await act(async () => {
        result.current.mutate(userData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createUser).toHaveBeenCalledWith(userData);
      expect(result.current.data).toEqual(mockCreatedUser);
      expect(toast.success).toHaveBeenCalledWith('User created successfully');
    });

    it('should handle create user errors', async () => {
      const mockError = new Error('Username already exists');
      createUser.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateUserMutation(), {
        wrapper: createWrapper(),
      });

      const userData = {
        username: 'existing',
        email: 'existing@test.com',
        password: 'password123',
      };

      await act(async () => {
        result.current.mutate(userData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith('Failed to create user: Username already exists');
    });

    it('should invalidate users query after successful creation', async () => {
      const mockCreatedUser = {
        user: { _id: 'newuser123', username: 'newuser' },
        message: 'User created successfully',
      };

      createUser.mockResolvedValue(mockCreatedUser);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useCreateUserMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith(['admin', 'users']);
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(['admin', 'stats']);
    });
  });

  describe('useUpdateUserRoleMutation', () => {
    it('should update user role successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User role updated successfully',
      };

      updateUserRole.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateUserRoleMutation(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        userId: 'user123',
        role: 'ADMIN',
      };

      await act(async () => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updateUserRole).toHaveBeenCalledWith(updateData);
      expect(result.current.data).toEqual(mockResponse);
      expect(toast.success).toHaveBeenCalledWith('User role updated successfully');
    });

    it('should handle role update errors', async () => {
      const mockError = new Error('Invalid role specified');
      updateUserRole.mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdateUserRoleMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          userId: 'user123',
          role: 'INVALID_ROLE',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith('Failed to update user role: Invalid role specified');
    });
  });

  describe('useBanUserMutation', () => {
    it('should ban user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User banned successfully',
      };

      banUser.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBanUserMutation(), {
        wrapper: createWrapper(),
      });

      const banData = {
        userId: 'user123',
        isEnabled: false,
        reason: 'Violation of terms',
      };

      await act(async () => {
        result.current.mutate(banData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(banUser).toHaveBeenCalledWith(banData);
      expect(result.current.data).toEqual(mockResponse);
      expect(toast.success).toHaveBeenCalledWith('User banned successfully');
    });

    it('should unban user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User unbanned successfully',
      };

      banUser.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBanUserMutation(), {
        wrapper: createWrapper(),
      });

      const unbanData = {
        userId: 'user123',
        isEnabled: true,
        reason: 'Appeal approved',
      };

      await act(async () => {
        result.current.mutate(unbanData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(banUser).toHaveBeenCalledWith(unbanData);
      expect(toast.success).toHaveBeenCalledWith('User unbanned successfully');
    });

    it('should handle ban user errors', async () => {
      const mockError = new Error('Cannot ban admin users');
      banUser.mockRejectedValue(mockError);

      const { result } = renderHook(() => useBanUserMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          userId: 'admin123',
          isEnabled: false,
          reason: 'Test ban',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith('Failed to update user status: Cannot ban admin users');
    });
  });

  describe('useAdminDeleteUserMutation', () => {
    it('should delete user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User deleted successfully',
      };

      deleteUser.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminDeleteUserMutation(), {
        wrapper: createWrapper(),
      });

      const deleteData = {
        userId: 'user123',
        reason: 'Data cleanup',
      };

      await act(async () => {
        result.current.mutate(deleteData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deleteUser).toHaveBeenCalledWith(deleteData);
      expect(result.current.data).toEqual(mockResponse);
      expect(toast.success).toHaveBeenCalledWith('User deleted successfully');
    });

    it('should handle delete user errors', async () => {
      const mockError = new Error('Cannot delete admin users');
      deleteUser.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAdminDeleteUserMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          userId: 'admin123',
          reason: 'Test deletion',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith('Failed to delete user: Cannot delete admin users');
    });

    it('should show confirmation before deletion', async () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      const { result } = renderHook(() => useAdminDeleteUserMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          userId: 'user123',
          reason: 'Test deletion',
        });
      });

      // Should not call the API if user cancels confirmation
      expect(deleteUser).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Optimistic updates', () => {
    it('should perform optimistic updates for user role changes', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      updateUserRole.mockResolvedValue({
        success: true,
        message: 'User role updated successfully',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateUserRoleMutation(), { wrapper });

      await act(async () => {
        result.current.mutate({
          userId: 'user123',
          role: 'ADMIN',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should perform optimistic update
      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it('should handle loading states correctly for mutations', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      createUser.mockReturnValue(promise);

      const { result } = renderHook(() => useCreateUserMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123',
        });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        user: { _id: 'newuser123', username: 'newuser' },
        message: 'User created successfully',
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});