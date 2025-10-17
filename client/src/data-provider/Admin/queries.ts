import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { request } from 'librechat-data-provider';
import store from '~/store';

// Admin Users Query Types
export interface TAdminUser {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  isEnabled: boolean;
  createdAt: string;
  lastActivity?: string;
  conversationCount?: number;
}

export interface TAdminUsersResponse {
  users: TAdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface TAdminUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'lastActivity' | 'username' | 'email';
  sortOrder?: 'asc' | 'desc';
  role?: string;
  isEnabled?: boolean;
}

// Admin Stats Query Types
export interface TAdminStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  monthlyStats: {
    month: string;
    users: number;
    conversations: number;
    messages: number;
  }[];
}

// Query Hook: Get All Users for Admin
export const useAdminUsersQuery = (
  params: TAdminUsersQueryParams = {},
  config?: UseQueryOptions<TAdminUsersResponse>,
): QueryObserverResult<TAdminUsersResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminUsersResponse>(
    [QueryKeys.user, 'admin', 'users', params],
    () => request.get('/api/admin/users', { params }),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

// Query Hook: Get Admin Statistics
export const useAdminStatsQuery = (
  config?: UseQueryOptions<TAdminStats>,
): QueryObserverResult<TAdminStats> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminStats>(
    [QueryKeys.user, 'admin', 'stats'],
    () => request.get('/api/admin/stats'),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

// Query Hook: Get Single User Details for Admin
export const useAdminUserQuery = (
  userId: string,
  config?: UseQueryOptions<TAdminUser>,
): QueryObserverResult<TAdminUser> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminUser>(
    [QueryKeys.user, 'admin', 'user', userId],
    () => request.get(`/api/admin/users/${userId}`),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 30 * 1000, // 30 seconds
      ...config,
      enabled: !!(userId && (config?.enabled ?? true) === true && queriesEnabled),
    },
  );
};