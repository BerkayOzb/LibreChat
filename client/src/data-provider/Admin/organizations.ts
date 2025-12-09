import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationResult } from '@tanstack/react-query';
import { request, QueryKeys } from 'librechat-data-provider';

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
    role: string;
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

// Keys
const ORG_KEYS = {
    all: [QueryKeys.admin, 'organizations'],
    lists: () => [...ORG_KEYS.all, 'list'],
    list: (params: any) => [...ORG_KEYS.lists(), params],
    details: () => [...ORG_KEYS.all, 'detail'],
    detail: (id: string) => [...ORG_KEYS.details(), id],
    users: (id: string) => [...ORG_KEYS.detail(id), 'users']
};

// Queries

export const useGetOrganizationsQuery = (
    params: { page?: number; limit?: number; search?: string },
    config?: UseQueryOptions<TGetOrganizationsResponse, unknown, TGetOrganizationsResponse, any[]>
) => {
    return useQuery<TGetOrganizationsResponse, unknown, TGetOrganizationsResponse, any[]>(
        ORG_KEYS.list(params),
        () => request.get('/api/admin/organizations', { params }),
        {
            keepPreviousData: true,
            ...(config as any)
        }
    );
};

export const useGetOrganizationByIdQuery = (
    id: string,
    config?: UseQueryOptions<TOrganizationDetail, unknown, TOrganizationDetail, any[]>
) => {
    return useQuery<TOrganizationDetail, unknown, TOrganizationDetail, any[]>(
        ORG_KEYS.detail(id),
        () => request.get(`/api/admin/organizations/${id}`),
        {
            enabled: !!id,
            ...(config as any)
        }
    )
}

export const useGetOrganizationUsersQuery = (
    id: string,
    params: { page?: number; limit?: number } = {},
    config?: UseQueryOptions<any, unknown, any, any[]>
) => {
    return useQuery<any, unknown, any, any[]>(
        [...ORG_KEYS.users(id), params],
        () => request.get(`/api/admin/organizations/${id}/users`, { params }),
        {
            enabled: !!id,
            keepPreviousData: true,
            ...(config as any)
        }
    )
}


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
                console.error("Create Org Error", error);
            }
        }
    );
};

export const useDeleteOrganizationMutation = (): UseMutationResult<
    void,
    unknown,
    string,
    unknown
> => {
    const queryClient = useQueryClient();
    return useMutation(
        (id: string) => request.delete(`/api/admin/organizations/${id}`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(ORG_KEYS.lists());
            }
        }
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
            }
        }
    )
}
