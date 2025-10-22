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
  banned?: boolean;
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

// Admin Endpoint Settings Query Types
export interface TEndpointSetting {
  _id?: string;
  endpoint: string;
  enabled: boolean;
  allowedRoles: string[];
  order: number;
  description?: string;
  metadata?: Record<string, any>;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TEndpointSettingsResponse {
  settings: TEndpointSetting[];
  stats: {
    total: number;
    enabled: number;
    disabled: number;
  };
  message: string;
}

// Query Hook: Get Admin Endpoint Settings
export const useGetEndpointSettings = (
  config?: UseQueryOptions<TEndpointSettingsResponse>,
): QueryObserverResult<TEndpointSettingsResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TEndpointSettingsResponse>(
    ['admin', 'endpoints'],
    () => request.get('/api/admin/endpoints'),
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

// Admin API Keys Query Types
export interface TAdminApiKeyResponse {
  _id: string;
  endpoint: string;
  apiKey: string; // Masked for security
  baseURL?: string;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TAdminApiKeyStats {
  total: number;
  active: number;
  inactive: number;
  endpoints: string[];
}

export interface TAdminApiKeysResponse {
  keys: TAdminApiKeyResponse[];
  stats: TAdminApiKeyStats;
  message: string;
}

export interface TAdminApiKeyExistsResponse {
  exists: boolean;
  endpoint: string;
  message: string;
}

// Query Hook: Get All Admin API Keys
export const useGetAdminApiKeys = (
  config?: UseQueryOptions<TAdminApiKeysResponse>,
): QueryObserverResult<TAdminApiKeysResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminApiKeysResponse>(
    ['admin', 'api-keys'],
    () => request.get('/api/admin/api-keys'),
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

// Query Hook: Get Admin API Key by Endpoint
export const useGetAdminApiKey = (
  endpoint: string,
  config?: UseQueryOptions<TAdminApiKeyResponse>,
): QueryObserverResult<TAdminApiKeyResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminApiKeyResponse>(
    ['admin', 'api-keys', endpoint],
    () => request.get(`/api/admin/api-keys/${endpoint}`),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...config,
      enabled: !!(endpoint && (config?.enabled ?? true) === true && queriesEnabled),
    },
  );
};

// Query Hook: Check if Admin API Key Exists for Endpoint
export const useCheckAdminApiKeyExists = (
  endpoint: string,
  config?: UseQueryOptions<TAdminApiKeyExistsResponse>,
): QueryObserverResult<TAdminApiKeyExistsResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<TAdminApiKeyExistsResponse>(
    ['admin', 'api-keys', endpoint, 'exists'],
    () => request.get(`/api/admin/api-keys/${endpoint}/exists`),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 30 * 1000, // 30 seconds
      ...config,
      enabled: !!(endpoint && (config?.enabled ?? true) === true && queriesEnabled),
    },
  );
};

// Query Hook: Get Admin API Key Statistics
export const useGetAdminApiKeyStats = (
  config?: UseQueryOptions<{ stats: TAdminApiKeyStats; message: string }>,
): QueryObserverResult<{ stats: TAdminApiKeyStats; message: string }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  
  return useQuery<{ stats: TAdminApiKeyStats; message: string }>(
    ['admin', 'api-keys', 'stats'],
    () => request.get('/api/admin/api-keys/stats'),
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