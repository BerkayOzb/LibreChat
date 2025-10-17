import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { request } from 'librechat-data-provider';
import type { TAdminUser } from './queries';

// Mutation Types
export interface TCreateUserRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  isEnabled?: boolean;
}

export interface TUpdateUserRoleRequest {
  userId: string;
  role: string;
}

export interface TBanUserRequest {
  userId: string;
  isEnabled: boolean;
  reason?: string;
}

export interface TUpdateUserStatusRequest {
  userId: string;
  banned: boolean;
}

export interface TResetUserPasswordRequest {
  userId: string;
  password: string;
}

export interface TDeleteUserRequest {
  userId: string;
  reason?: string;
}

export interface TCreateUserResponse {
  user: TAdminUser;
  message: string;
}

export interface TMutationResponse {
  success: boolean;
  message: string;
  user?: TAdminUser;
}

// Mutation: Create New User
export const useCreateUserMutation = (): UseMutationResult<
  TCreateUserResponse,
  unknown,
  TCreateUserRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TCreateUserRequest) => request.post('/api/admin/users', payload),
    {
      onSuccess: () => {
        // Invalidate users list to refetch with new user
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'stats']);
      },
    },
  );
};

// Mutation: Update User Role
export const useUpdateUserRoleMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TUpdateUserRoleRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TUpdateUserRoleRequest) => 
      request.put(`/api/admin/users/${payload.userId}/role`, { role: payload.role }),
    {
      onSuccess: (_, variables) => {
        // Invalidate specific user and users list
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'user', variables.userId]);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'stats']);
      },
    },
  );
};

// Mutation: Update User Status (Ban/Activate Toggle)
export const useUpdateUserStatusMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TUpdateUserStatusRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TUpdateUserStatusRequest) => 
      request.put(`/api/admin/users/${payload.userId}/status`, {
        banned: payload.banned,
      }),
    {
      // Optimistic update for immediate UI feedback
      onMutate: async (newUserStatus) => {
        // Cancel ongoing queries to prevent overwriting optimistic update
        await queryClient.cancelQueries([QueryKeys.user, 'admin', 'users']);
        
        // Get all queries that match the pattern and update them
        const queryKeys = queryClient.getQueryCache().findAll([QueryKeys.user, 'admin', 'users']);
        let previousData: any[] = [];
        
        // Update all matching queries optimistically
        queryKeys.forEach((queryState) => {
          const currentData = queryClient.getQueryData(queryState.queryKey);
          if (currentData) {
            previousData.push({ key: queryState.queryKey, data: currentData });
            
            // Optimistically update this specific query
            queryClient.setQueryData(queryState.queryKey, (old: any) => {
              if (!old || !old.users) return old;
              
              const newUsersData = {
                ...old,
                users: old.users.map((user: any) => {
                  if (user._id === newUserStatus.userId) {
                    return { 
                      ...user, 
                      banned: newUserStatus.banned,
                      isEnabled: !newUserStatus.banned 
                    };
                  }
                  return user;
                })
              };
              
              return newUsersData;
            });
          }
        });
        
        // Return previous data for rollback if needed
        return { previousData };
      },
      
      onError: (err, newUserStatus, context) => {
        // Rollback on error
        if (context?.previousData) {
          context.previousData.forEach(({ key, data }) => {
            queryClient.setQueryData(key, data);
          });
        }
      },
      
      onSettled: () => {
        // Always refetch after mutation completes
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'stats']);
      },
    },
  );
};

// Mutation: Reset User Password
export const useResetUserPasswordMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TResetUserPasswordRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TResetUserPasswordRequest) => 
      request.put(`/api/admin/users/${payload.userId}/password`, {
        password: payload.password,
      }),
    {
      onSuccess: (_, variables) => {
        // Invalidate user queries
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'user', variables.userId]);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
      },
    },
  );
};

// Mutation: Ban/Unban User
export const useBanUserMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TBanUserRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TBanUserRequest) => 
      request.put(`/api/admin/users/${payload.userId}/ban`, {
        isEnabled: payload.isEnabled,
        reason: payload.reason,
      }),
    {
      onSuccess: (_, variables) => {
        // Invalidate specific user and users list
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'user', variables.userId]);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'stats']);
      },
    },
  );
};

// Mutation: Delete User
export const useAdminDeleteUserMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TDeleteUserRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TDeleteUserRequest) => 
      request.delete(`/api/admin/users/${payload.userId}`, {
        data: { reason: payload.reason },
      }),
    {
      onSuccess: (_, variables) => {
        // Remove user from cache and invalidate lists
        queryClient.removeQueries([QueryKeys.user, 'admin', 'user', variables.userId]);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'users']);
        queryClient.invalidateQueries([QueryKeys.user, 'admin', 'stats']);
      },
    },
  );
};

// Mutation: Bulk User Operations
export interface TBulkUserOperationRequest {
  userIds: string[];
  operation: 'ban' | 'unban' | 'delete' | 'role_update';
  data?: {
    role?: string;
    reason?: string;
    isEnabled?: boolean;
  };
}

export const useBulkUserOperationMutation = (): UseMutationResult<
  TMutationResponse,
  unknown,
  TBulkUserOperationRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TBulkUserOperationRequest) => 
      request.post('/api/admin/users/bulk', payload),
    {
      onSuccess: () => {
        // Invalidate all admin-related queries for bulk operations
        queryClient.invalidateQueries([QueryKeys.user, 'admin']);
      },
    },
  );
};