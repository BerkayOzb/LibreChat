import React, { useState, useCallback } from 'react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { Loader2, Settings, Eye, EyeOff, GripVertical, Users, Info, Key, CheckCircle, XCircle } from 'lucide-react';
import { useGetEndpointSettings, useCheckAdminApiKeyExists, type TEndpointSetting } from '~/data-provider/Admin/queries';
import {
  useToggleEndpointMutation,
  useUpdateEndpointSettingMutation,
  useReorderEndpointsMutation,
  useBulkUpdateEndpointsMutation,
  useClearEndpointCacheMutation,
} from '~/data-provider/Admin/mutations';
import { request } from 'librechat-data-provider';
import { Button, Input } from '@librechat/client';

// Use the type from queries
type EndpointSetting = TEndpointSetting;

const EndpointCard: React.FC<{
  setting: EndpointSetting;
  onToggle: (endpoint: string, enabled: boolean) => void;
  onUpdate: (endpoint: string, data: Partial<EndpointSetting>) => void;
  isLoading: boolean;
  localize: ReturnType<typeof useLocalize>;
}> = ({ setting, onToggle, onUpdate, isLoading, localize }) => {
  // Check if admin API key exists for this endpoint
  const { data: keyExists } = useCheckAdminApiKeyExists(setting.endpoint);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: setting.description || '',
    allowedRoles: setting.allowedRoles,
  });

  const handleSave = () => {
    onUpdate(setting.endpoint, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      description: setting.description || '',
      allowedRoles: setting.allowedRoles,
    });
    setIsEditing(false);
  };

  const toggleRole = (role: string) => {
    const newRoles = editData.allowedRoles.includes(role)
      ? editData.allowedRoles.filter(r => r !== role)
      : [...editData.allowedRoles, role];
    
    // Ensure at least one role is selected
    if (newRoles.length > 0) {
      setEditData({ ...editData, allowedRoles: newRoles });
    }
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
      setting.enabled
        ? 'border-border-light bg-surface-primary'
        : 'border-border-light bg-surface-secondary'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="cursor-move rounded-lg bg-surface-tertiary p-2">
            <GripVertical className="h-4 w-4 text-text-tertiary" />
          </div>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${setting.enabled ? 'bg-surface-tertiary' : 'bg-surface-secondary'}`}>
              {setting.enabled ? (
                <Eye className="h-4 w-4 text-text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-text-tertiary" />
              )}
            </div>
            <h3 className="font-semibold capitalize text-text-primary">
              {setting.endpoint}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* API Key Status Indicator */}
          <div className="flex items-center gap-1 text-xs">
            <Key className="h-3 w-3 text-text-tertiary" />
            {keyExists?.exists ? (
              <span className="flex items-center gap-1 text-text-primary">
                <CheckCircle className="h-3 w-3" />
                {localize('com_admin_admin_key')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" />
                {localize('com_admin_no_key')}
              </span>
            )}
          </div>

          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="icon"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4 text-text-secondary hover:text-text-primary" />
          </Button>
          
          <Button
            onClick={() => onToggle(setting.endpoint, !setting.enabled)}
            disabled={isLoading}
            variant={setting.enabled ? 'submit' : 'outline'}
            size="sm"
            className="min-w-[80px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              setting.enabled ? localize('com_admin_enabled') : localize('com_admin_disabled')
            )}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-4 border-t border-border-light pt-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              {localize('com_admin_description')}
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 w-full rounded border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
              rows={2}
              placeholder={localize('com_admin_optional_description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary">
              <Users className="mr-1 inline h-4 w-4" />
              {localize('com_admin_allowed_roles')}
            </label>
            <div className="mt-2 flex gap-2">
              {Object.values(SystemRoles).map((role) => (
                <Button
                  key={role}
                  onClick={() => toggleRole(role)}
                  variant={editData.allowedRoles.includes(role) ? 'submit' : 'outline'}
                  size="sm"
                >
                  {role}
                </Button>
              ))}
            </div>
            {editData.allowedRoles.length === 0 && (
              <p className="mt-1 text-sm text-destructive">{localize('com_admin_at_least_one_role')}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={editData.allowedRoles.length === 0}
              variant="default"
              size="sm"
              className="bg-text-primary text-surface-primary hover:opacity-90"
            >
              {localize('com_admin_save')}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
            >
              {localize('com_admin_cancel')}
            </Button>
          </div>
        </div>
      )}

      {!isEditing && setting.description && (
        <div className="mt-2 text-sm text-text-secondary">
          {setting.description}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
        <span>{localize('com_admin_order')}: {setting.order}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {setting.allowedRoles.join(', ')}
        </span>
        {setting.updatedAt && (
          <span>{localize('com_admin_updated')}: {new Date(setting.updatedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

const EndpointManagement: React.FC = () => {
  const { user } = useAuthContext();
  const localize = useLocalize();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Queries and mutations
  const { data: endpointData, isLoading, error, refetch } = useGetEndpointSettings();
  const toggleEndpointMutation = useToggleEndpointMutation();
  const updateEndpointMutation = useUpdateEndpointSettingMutation();
  const reorderMutation = useReorderEndpointsMutation();
  const bulkUpdateMutation = useBulkUpdateEndpointsMutation();
  const clearCacheMutation = useClearEndpointCacheMutation();

  // Check if user is admin
  if (user?.role !== SystemRoles.ADMIN) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary">{localize('com_admin_access_denied')}</h2>
          <p className="text-text-secondary">{localize('com_admin_access_denied_description')}</p>
        </div>
      </div>
    );
  }

  const handleToggleEndpoint = useCallback(async (endpoint: string, enabled: boolean) => {
    try {
      await toggleEndpointMutation.mutateAsync({ endpoint, enabled });
    } catch (error) {
      console.error('Error toggling endpoint:', error);
    }
  }, [toggleEndpointMutation]);

  const handleUpdateEndpoint = useCallback(async (endpoint: string, data: Partial<EndpointSetting>) => {
    try {
      await updateEndpointMutation.mutateAsync({ endpoint, ...data });
    } catch (error) {
      console.error('Error updating endpoint:', error);
    }
  }, [updateEndpointMutation]);

  const handleBulkToggle = useCallback(async (enabled: boolean) => {
    try {
      const filteredSettings = filteredEndpoints?.map(setting => ({
        endpoint: setting.endpoint,
        enabled,
      })) || [];
      
      await bulkUpdateMutation.mutateAsync({ updates: filteredSettings });
    } catch (error) {
      console.error('Error bulk updating endpoints:', error);
    }
  }, [bulkUpdateMutation]);

  const handleCleanupDuplicates = useCallback(async () => {
    try {
      const data = await request.post('/api/admin/endpoints/cleanup');
      console.log('Cleanup successful:', data);
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-surface-destructive/10 p-4">
        <h3 className="font-semibold text-destructive">{localize('com_admin_error_loading_endpoint_settings')}</h3>
        <p className="text-destructive/80">{(error as any)?.message || 'Unknown error'}</p>
        <Button
          onClick={() => refetch()}
          variant="destructive"
          size="sm"
          className="mt-2"
        >
          {localize('com_admin_retry')}
        </Button>
      </div>
    );
  }

  const settings = endpointData?.settings || [];
  const stats = endpointData?.stats || { total: 0, enabled: 0, disabled: 0 };

  const filteredEndpoints = settings.filter(setting =>
    setting.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-primary dark:bg-admin-primary p-6 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {localize('com_admin_endpoint_management')}
              </h1>
              <p className="text-blue-100 mt-1">
                {localize('com_admin_endpoint_management_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{localize('com_admin_total_endpoints')}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Info className="h-5 w-5 text-text-primary" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{localize('com_admin_endpoints_enabled')}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">{stats.enabled}</p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Eye className="h-5 w-5 text-text-primary" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{localize('com_admin_endpoints_disabled')}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-secondary">{stats.disabled}</p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <EyeOff className="h-5 w-5 text-text-tertiary" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={localize('com_admin_search_endpoints')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkToggle(true)}
            disabled={bulkUpdateMutation.isLoading}
            variant="default"
            size="sm"
            className="bg-text-primary text-surface-primary hover:opacity-90"
          >
            {localize('com_admin_enable_all')}
          </Button>
          <Button
            onClick={() => handleBulkToggle(false)}
            disabled={bulkUpdateMutation.isLoading}
            variant="outline"
            size="sm"
          >
            {localize('com_admin_disable_all')}
          </Button>
          <Button
            onClick={handleCleanupDuplicates}
            variant="outline"
            size="sm"
            className="border-border-medium text-text-primary hover:bg-surface-hover"
          >
            {localize('com_admin_fix_duplicates')}
          </Button>
        </div>
      </div>

      {/* Endpoint List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-surface-primary p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-surface-tertiary p-4">
                <Settings className="h-8 w-8 text-text-tertiary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {searchTerm ? localize('com_admin_no_endpoints_found') : localize('com_admin_no_endpoints_configured')}
              </h3>
              <p className="mt-2 text-center text-sm text-text-secondary max-w-sm">
                {searchTerm ? `"${searchTerm}"` : ''}
              </p>
            </div>
          </div>
        ) : (
          filteredEndpoints.map((setting) => (
            <EndpointCard
              key={setting.endpoint}
              setting={setting}
              onToggle={handleToggleEndpoint}
              onUpdate={handleUpdateEndpoint}
              localize={localize}
              isLoading={
                toggleEndpointMutation.isLoading || 
                updateEndpointMutation.isLoading ||
                bulkUpdateMutation.isLoading
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EndpointManagement;