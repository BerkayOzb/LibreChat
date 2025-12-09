import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationResult, QueryObserverResult } from '@tanstack/react-query';
import { request } from 'librechat-data-provider';

// Types
export interface TOrganizationStats {
  organization: {
    _id: string;
    name: string;
    code: string;
    createdAt: string;
  };
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  adminCount: number;
  unlimitedUsers: number;
  expiringSoonUsers: number;
  membershipDistribution: {
    unlimited: number;
    active: number;
    expiringSoon: number;
    expired: number;
  };
  growth: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  activity: {
    totalConversations: number;
    conversationsToday: number;
    conversationsThisWeek: number;
  };
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    membershipExpiresAt?: string | null;
    role: string;
  }>;
  registrationsByDay: Array<{
    _id: string;
    count: number;
  }>;
  timestamp: string;
}

export interface TOrgUser {
  _id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
  membershipExpiresAt?: string | null;
  membershipVisible?: boolean;
  emailVerified?: boolean;
  lastActivity?: string;
}

export interface TOrgUsersResponse {
  users: TOrgUser[];
  page: number;
  pages: number;
  totalUsers: number;
}

export interface TCreateOrgUserRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
  membershipExpiresAt?: string;
}

export interface TUpdateOrgUserRequest {
  userId: string;
  name?: string;
  membershipExpiresAt?: string | null;
}

export interface TResetPasswordRequest {
  userId: string;
  password: string;
}

// Query Keys
const ORG_MGMT_KEYS = {
  all: ['organization', 'management'],
  stats: () => [...ORG_MGMT_KEYS.all, 'stats'],
  users: () => [...ORG_MGMT_KEYS.all, 'users'],
  userList: (params: Record<string, unknown>) => [...ORG_MGMT_KEYS.users(), 'list', params],
  user: (id: string) => [...ORG_MGMT_KEYS.users(), id],
};

// Queries

export const useOrgStatsQuery = (
  config?: UseQueryOptions<TOrganizationStats>,
): QueryObserverResult<TOrganizationStats> => {
  return useQuery<TOrganizationStats>(
    ORG_MGMT_KEYS.stats(),
    () => request.get('/api/organization/stats'),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...config,
    },
  );
};

export const useOrgUsersQuery = (
  params: { page?: number; limit?: number; search?: string } = {},
  config?: UseQueryOptions<TOrgUsersResponse>,
): QueryObserverResult<TOrgUsersResponse> => {
  return useQuery<TOrgUsersResponse>(
    ORG_MGMT_KEYS.userList(params),
    () => request.get('/api/admin/users', { params }),
    {
      keepPreviousData: true,
      ...config,
    },
  );
};

// Mutations

export const useCreateOrgUserMutation = (): UseMutationResult<
  { message: string; user: TOrgUser },
  unknown,
  TCreateOrgUserRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: TCreateOrgUserRequest) => request.post('/api/admin/users', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ORG_MGMT_KEYS.users());
        queryClient.invalidateQueries(ORG_MGMT_KEYS.stats());
      },
    },
  );
};

export const useUpdateOrgUserMutation = (): UseMutationResult<
  TOrgUser,
  unknown,
  TUpdateOrgUserRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ userId, ...data }: TUpdateOrgUserRequest) => request.put(`/api/admin/users/${userId}`, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(ORG_MGMT_KEYS.users());
        queryClient.invalidateQueries(ORG_MGMT_KEYS.user(variables.userId));
        queryClient.invalidateQueries(ORG_MGMT_KEYS.stats());
      },
    },
  );
};

export const useDeleteOrgUserMutation = (): UseMutationResult<
  { message: string },
  unknown,
  string,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (userId: string) => request.delete(`/api/admin/users/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ORG_MGMT_KEYS.users());
        queryClient.invalidateQueries(ORG_MGMT_KEYS.stats());
      },
    },
  );
};

export const useResetOrgUserPasswordMutation = (): UseMutationResult<
  { message: string },
  unknown,
  TResetPasswordRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ userId, password }: TResetPasswordRequest) =>
      request.put(`/api/admin/users/${userId}/password`, { password }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(ORG_MGMT_KEYS.user(variables.userId));
      },
    },
  );
};
