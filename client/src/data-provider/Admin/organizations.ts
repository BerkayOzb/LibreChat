import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationResult, QueryObserverResult } from '@tanstack/react-query';
import { request } from 'librechat-data-provider';

// Types
export interface TOrganization {
  _id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface TOrganizationUser {
  _id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  createdAt?: string;
  membershipExpiresAt?: string;
}

export interface TOrganizationDetail extends TOrganization {
  admins: TOrganizationUser[];
}

export interface TGetOrganizationsResponse {
  organizations: TOrganization[];
  total: number;
  page: number;
  pages: number;
}

export interface TCreateOrgRequest {
  name: string;
  code: string;
}

export interface TAssignAdminRequest {
  organizationId: string;
  userId: string;
}

export interface TRemoveAdminRequest {
  organizationId: string;
  userId: string;
}

export interface TGetOrganizationUsersResponse {
  users: TOrganizationUser[];
  total: number;
  page: number;
  pages: number;
}

// Keys
const ORG_KEYS = {
  all: ['admin', 'organizations'],
  lists: () => [...ORG_KEYS.all, 'list'],
  list: (params: Record<string, unknown>) => [...ORG_KEYS.lists(), params],
  details: () => [...ORG_KEYS.all, 'detail'],
  detail: (id: string) => [...ORG_KEYS.details(), id],
  users: (id: string, params?: Record<string, unknown>) =>
    params ? [...ORG_KEYS.detail(id), 'users', params] : [...ORG_KEYS.detail(id), 'users'],
};

// Queries

export const useGetOrganizationsQuery = (
  params: { page?: number; limit?: number; search?: string },
  config?: UseQueryOptions<TGetOrganizationsResponse>,
): QueryObserverResult<TGetOrganizationsResponse> => {
  return useQuery<TGetOrganizationsResponse>(
    ORG_KEYS.list(params),
    () => request.get('/api/admin/organizations', { params }),
    {
      keepPreviousData: true,
      ...config,
    },
  );
};

export const useGetOrganizationByIdQuery = (
  id: string,
  config?: UseQueryOptions<TOrganizationDetail>,
): QueryObserverResult<TOrganizationDetail> => {
  return useQuery<TOrganizationDetail>(
    ORG_KEYS.detail(id),
    () => request.get(`/api/admin/organizations/${id}`),
    {
      enabled: !!id,
      ...config,
    },
  );
};

export const useGetOrganizationUsersQuery = (
  id: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'email' | 'role' | 'membershipExpiresAt';
    sortOrder?: 'asc' | 'desc';
  } = {},
  config?: UseQueryOptions<TGetOrganizationUsersResponse>,
): QueryObserverResult<TGetOrganizationUsersResponse> => {
  return useQuery<TGetOrganizationUsersResponse>(
    ORG_KEYS.users(id, params),
    () => request.get(`/api/admin/organizations/${id}/users`, { params }),
    {
      enabled: !!id,
      keepPreviousData: true,
      ...config,
    },
  );
};

// Mutations

export const useCreateOrganizationMutation = (): UseMutationResult<
  TOrganization,
  unknown,
  TCreateOrgRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: TCreateOrgRequest) => request.post('/api/admin/organizations', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ORG_KEYS.lists());
      },
      onError: (error) => {
        console.error('Create Org Error', error);
      },
    },
  );
};

export const useDeleteOrganizationMutation = (): UseMutationResult<void, unknown, string, unknown> => {
  const queryClient = useQueryClient();
  return useMutation(
    (id: string) => request.delete(`/api/admin/organizations/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ORG_KEYS.lists());
      },
    },
  );
};

export const useAssignOrgAdminMutation = (): UseMutationResult<
  void,
  unknown,
  TAssignAdminRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ organizationId, userId }: TAssignAdminRequest) =>
      request.post(`/api/admin/organizations/${organizationId}/assign-admin`, { userId }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(ORG_KEYS.detail(variables.organizationId));
        queryClient.invalidateQueries(ORG_KEYS.users(variables.organizationId));
      },
    },
  );
};

export const useRemoveOrgAdminMutation = (): UseMutationResult<
  void,
  unknown,
  TRemoveAdminRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ organizationId, userId }: TRemoveAdminRequest) =>
      request.delete(`/api/admin/organizations/${organizationId}/admins/${userId}`),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(ORG_KEYS.detail(variables.organizationId));
        queryClient.invalidateQueries(ORG_KEYS.users(variables.organizationId));
      },
    },
  );
};
