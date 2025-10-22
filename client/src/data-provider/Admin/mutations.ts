import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { request } from 'librechat-data-provider';
import type { TAdminUser, TEndpointSetting, TEndpointSettingsResponse, TAdminApiKeyResponse, TAdminApiKeysResponse } from './queries';

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

// Endpoint Management Request Types

export interface TToggleEndpointRequest {
  endpoint: string;
  enabled: boolean;
}

export interface TUpdateEndpointSettingRequest {
  endpoint: string;
  enabled?: boolean;
  allowedRoles?: string[];
  order?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TReorderEndpointsRequest {
  updates: Array<{
    endpoint: string;
    order: number;
  }>;
}

export interface TBulkUpdateEndpointsRequest {
  updates: Array<{
    endpoint: string;
    enabled?: boolean;
    allowedRoles?: string[];
    order?: number;
    description?: string;
    metadata?: Record<string, any>;
  }>;
}

export interface TEndpointMutationResponse {
  setting?: TEndpointSetting;
  message: string;
  success?: boolean;
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

// Endpoint Management Mutations

// Mutation: Toggle Endpoint Status
export const useToggleEndpointMutation = (): UseMutationResult<
  TEndpointMutationResponse,
  unknown,
  TToggleEndpointRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TToggleEndpointRequest) => 
      request.post(`/api/admin/endpoints/${payload.endpoint}/toggle`, {
        enabled: payload.enabled,
      }),
    {
      // Optimistic update for immediate feedback
      onMutate: async (newEndpointData) => {
        await queryClient.cancelQueries(['admin', 'endpoints']);
        
        const previousData = queryClient.getQueryData(['admin', 'endpoints']);
        
        // Optimistically update endpoint in cache
        queryClient.setQueryData(['admin', 'endpoints'], (old: any) => {
          if (!old || !old.settings) return old;
          
          return {
            ...old,
            settings: old.settings.map((setting: TEndpointSetting) => {
              if (setting.endpoint === newEndpointData.endpoint) {
                return { ...setting, enabled: newEndpointData.enabled };
              }
              return setting;
            }),
            stats: {
              ...old.stats,
              enabled: old.settings.filter((s: TEndpointSetting) => 
                s.endpoint === newEndpointData.endpoint ? newEndpointData.enabled : s.enabled
              ).length,
              disabled: old.settings.filter((s: TEndpointSetting) => 
                s.endpoint === newEndpointData.endpoint ? !newEndpointData.enabled : !s.enabled
              ).length,
            }
          };
        });
        
        return { previousData };
      },
      
      onError: (err, newData, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(['admin', 'endpoints'], context.previousData);
        }
      },
      
      onSettled: () => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        // Invalidate endpoint config to update ModelSelector
        queryClient.invalidateQueries([QueryKeys.endpoints]);
        // Force refetch startupConfig as well
        queryClient.invalidateQueries([QueryKeys.startupConfig]);
        // Clear all endpoint-related cache
        queryClient.removeQueries([QueryKeys.endpoints]);
        queryClient.refetchQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Update Endpoint Setting
export const useUpdateEndpointSettingMutation = (): UseMutationResult<
  TEndpointMutationResponse,
  unknown,
  TUpdateEndpointSettingRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TUpdateEndpointSettingRequest) => {
      const { endpoint, ...data } = payload;
      return request.put(`/api/admin/endpoints/${endpoint}`, data);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Reorder Endpoints
export const useReorderEndpointsMutation = (): UseMutationResult<
  { updatedCount: number; message: string },
  unknown,
  TReorderEndpointsRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TReorderEndpointsRequest) => 
      request.post('/api/admin/endpoints/reorder', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Bulk Update Endpoints
export const useBulkUpdateEndpointsMutation = (): UseMutationResult<
  {
    results: Array<{ endpoint: string; status: string; setting?: TEndpointSetting }>;
    errors: Array<{ endpoint: string; error: string }>;
    successCount: number;
    errorCount: number;
    message: string;
  },
  unknown,
  TBulkUpdateEndpointsRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TBulkUpdateEndpointsRequest) => 
      request.post('/api/admin/endpoints/bulk', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Initialize Default Endpoints
export const useInitializeEndpointsMutation = (): UseMutationResult<
  { initializedCount: number; message: string },
  unknown,
  { defaultEndpoints: string[] },
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: { defaultEndpoints: string[] }) => 
      request.post('/api/admin/endpoints/initialize', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Clear Endpoint Cache
export const useClearEndpointCacheMutation = (): UseMutationResult<
  { cleared: boolean; message: string },
  unknown,
  void,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => request.post('/api/admin/endpoints/cache/clear'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'endpoints']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Admin API Keys Mutation Types

export interface TSetAdminApiKeyRequest {
  endpoint: string;
  apiKey: string;
  baseURL?: string;
  description?: string;
  isActive?: boolean;
}

export interface TUpdateAdminApiKeySettingsRequest {
  endpoint: string;
  baseURL?: string;
  description?: string;
  isActive?: boolean;
}

export interface TToggleAdminApiKeyRequest {
  endpoint: string;
  isActive: boolean;
}

export interface TAdminApiKeyMutationResponse {
  key?: TAdminApiKeyResponse;
  message: string;
  success?: boolean;
}

// Admin API Keys Mutations

// Mutation: Set/Create Admin API Key
export const useSetAdminApiKeyMutation = (): UseMutationResult<
  TAdminApiKeyMutationResponse,
  unknown,
  TSetAdminApiKeyRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TSetAdminApiKeyRequest) => {
      const { endpoint, ...data } = payload;
      return request.post(`/api/admin/api-keys/${endpoint}`, data);
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate all admin API key queries
        queryClient.invalidateQueries(['admin', 'api-keys']);
        queryClient.invalidateQueries(['admin', 'api-keys', variables.endpoint]);
        queryClient.invalidateQueries(['admin', 'api-keys', variables.endpoint, 'exists']);
        queryClient.invalidateQueries(['admin', 'api-keys', 'stats']);
        
        // Invalidate endpoint config to update userProvide setting
        queryClient.invalidateQueries([QueryKeys.endpoints]);
        queryClient.invalidateQueries([QueryKeys.startupConfig]);
        
        // Clear endpoint config cache to force refresh
        queryClient.removeQueries([QueryKeys.endpoints]);
        queryClient.refetchQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Update Admin API Key Settings (without changing the key)
export const useUpdateAdminApiKeySettingsMutation = (): UseMutationResult<
  TAdminApiKeyMutationResponse,
  unknown,
  TUpdateAdminApiKeySettingsRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TUpdateAdminApiKeySettingsRequest) => {
      const { endpoint, ...data } = payload;
      return request.put(`/api/admin/api-keys/${endpoint}`, data);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['admin', 'api-keys']);
        queryClient.invalidateQueries(['admin', 'api-keys', variables.endpoint]);
        queryClient.invalidateQueries(['admin', 'api-keys', 'stats']);
        
        // Invalidate endpoint config if isActive changed
        queryClient.invalidateQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Toggle Admin API Key Status
export const useToggleAdminApiKeyMutation = (): UseMutationResult<
  TAdminApiKeyMutationResponse,
  unknown,
  TToggleAdminApiKeyRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: TToggleAdminApiKeyRequest) => 
      request.patch(`/api/admin/api-keys/${payload.endpoint}/toggle`, {
        isActive: payload.isActive,
      }),
    {
      // Optimistic update for immediate feedback
      onMutate: async (newData) => {
        await queryClient.cancelQueries(['admin', 'api-keys']);
        
        const previousData = queryClient.getQueryData(['admin', 'api-keys']);
        
        // Optimistically update API key in cache
        queryClient.setQueryData(['admin', 'api-keys'], (old: any) => {
          if (!old || !old.keys) return old;
          
          return {
            ...old,
            keys: old.keys.map((key: TAdminApiKeyResponse) => {
              if (key.endpoint === newData.endpoint) {
                return { ...key, isActive: newData.isActive };
              }
              return key;
            }),
            stats: {
              ...old.stats,
              active: old.keys.filter((k: TAdminApiKeyResponse) => 
                k.endpoint === newData.endpoint ? newData.isActive : k.isActive
              ).length,
              inactive: old.keys.filter((k: TAdminApiKeyResponse) => 
                k.endpoint === newData.endpoint ? !newData.isActive : !k.isActive
              ).length,
            }
          };
        });
        
        return { previousData };
      },
      
      onError: (err, newData, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(['admin', 'api-keys'], context.previousData);
        }
      },
      
      onSettled: (_, __, variables) => {
        queryClient.invalidateQueries(['admin', 'api-keys']);
        queryClient.invalidateQueries(['admin', 'api-keys', variables.endpoint]);
        queryClient.invalidateQueries(['admin', 'api-keys', variables.endpoint, 'exists']);
        
        // Invalidate endpoint config to update userProvide setting
        queryClient.invalidateQueries([QueryKeys.endpoints]);
        queryClient.invalidateQueries([QueryKeys.startupConfig]);
        
        // Clear endpoint config cache to force refresh
        queryClient.removeQueries([QueryKeys.endpoints]);
        queryClient.refetchQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Delete Admin API Key
export const useDeleteAdminApiKeyMutation = (): UseMutationResult<
  { message: string },
  unknown,
  { endpoint: string },
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (payload: { endpoint: string }) => 
      request.delete(`/api/admin/api-keys/${payload.endpoint}`),
    {
      onSuccess: (_, variables) => {
        // Remove specific key from cache
        queryClient.removeQueries(['admin', 'api-keys', variables.endpoint]);
        queryClient.removeQueries(['admin', 'api-keys', variables.endpoint, 'exists']);
        
        // Invalidate list and stats
        queryClient.invalidateQueries(['admin', 'api-keys']);
        queryClient.invalidateQueries(['admin', 'api-keys', 'stats']);
        
        // Invalidate endpoint config to update userProvide setting
        queryClient.invalidateQueries([QueryKeys.endpoints]);
        queryClient.invalidateQueries([QueryKeys.startupConfig]);
        
        // Clear endpoint config cache to force refresh
        queryClient.removeQueries([QueryKeys.endpoints]);
        queryClient.refetchQueries([QueryKeys.endpoints]);
      },
    },
  );
};

// Mutation: Clear Admin API Keys Cache
export const useClearAdminApiKeysCacheMutation = (): UseMutationResult<
  { message: string },
  unknown,
  void,
  unknown
> => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => request.post('/api/admin/api-keys/cache/clear'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'api-keys']);
        queryClient.invalidateQueries([QueryKeys.endpoints]);
        queryClient.invalidateQueries([QueryKeys.startupConfig]);
      },
    },
  );
};