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
    <div className={`rounded-lg border p-4 transition-all duration-200 ${
      setting.enabled
        ? 'border-border-light bg-success/10'
        : 'border-border-light bg-surface-secondary'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-move">
            <GripVertical className="h-5 w-5 text-text-tertiary" />
          </div>
          <div className="flex items-center gap-2">
            {setting.enabled ? (
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-text-tertiary" />
            )}
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
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                {localize('com_admin_admin_key')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
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
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{localize('com_admin_at_least_one_role')}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={editData.allowedRoles.length === 0}
              variant="submit"
              size="sm"
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <h3 className="font-semibold text-red-800 dark:text-red-200">{localize('com_admin_error_loading_endpoint_settings')}</h3>
        <p className="text-red-600 dark:text-red-400">{(error as any)?.message || 'Unknown error'}</p>
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
      {/* Header */}
      <div className="border-b border-border-light pb-4">
        <h2 className="text-2xl font-bold text-text-primary">
          {localize('com_admin_endpoint_management')}
        </h2>
        <p className="text-text-secondary">
          {localize('com_admin_endpoint_management_description')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-light bg-surface-primary p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">{localize('com_admin_total_endpoints')}</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <Info className="h-8 w-8 text-text-tertiary" />
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{localize('com_admin_endpoints_enabled')}</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.enabled}</p>
            </div>
            <Eye className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="rounded-lg border border-border-light bg-surface-secondary p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">{localize('com_admin_endpoints_disabled')}</p>
              <p className="text-2xl font-bold text-text-secondary">{stats.disabled}</p>
            </div>
            <EyeOff className="h-8 w-8 text-text-tertiary" />
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
            variant="submit"
            size="sm"
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
      <div className="space-y-3">
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-lg border border-border-light bg-surface-secondary p-8 text-center">
            <p className="text-text-secondary">
              {searchTerm ? `${localize('com_admin_no_endpoints_found')} "${searchTerm}"` : localize('com_admin_no_endpoints_configured')}
            </p>
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