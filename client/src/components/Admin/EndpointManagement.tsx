import React, { useState, useCallback } from 'react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { Loader2, Settings, Eye, EyeOff, GripVertical, Users, Info, Key, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
    <div className={`admin-card p-5 transition-all duration-200 hover:shadow-md ${
      !setting.enabled ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="cursor-move rounded-lg bg-[var(--admin-bg-elevated)] p-2">
            <GripVertical className="h-4 w-4 admin-text-muted" />
          </div>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${setting.enabled ? 'stat-icon' : 'bg-[var(--admin-bg-elevated)]'}`}>
              {setting.enabled ? (
                <Eye className="h-4 w-4 admin-text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 admin-text-muted" />
              )}
            </div>
            <h3 className="font-semibold capitalize admin-text-primary">
              {setting.endpoint}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* API Key Status Indicator */}
          <div className="flex items-center gap-1 text-xs">
            <Key className="h-3 w-3 admin-text-muted" />
            {keyExists?.exists ? (
              <span className="flex items-center gap-1 admin-success">
                <CheckCircle className="h-3 w-3" />
                {localize('com_admin_admin_key')}
              </span>
            ) : (
              <span className="flex items-center gap-1 admin-danger">
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
            <Settings className="h-4 w-4 admin-text-secondary hover:admin-text-primary" />
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
        <div className="mt-4 space-y-4 border-t border-[var(--admin-border-subtle)] pt-4">
          <div>
            <label className="block text-sm font-medium admin-text-secondary">
              {localize('com_admin_description')}
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 w-full rounded border border-[var(--admin-border-muted)] bg-[var(--admin-bg-surface)] px-3 py-2 text-sm admin-text-primary focus:border-[var(--admin-border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-border-active)]"
              rows={2}
              placeholder={localize('com_admin_optional_description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium admin-text-secondary">
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
              <p className="mt-1 text-sm admin-danger">{localize('com_admin_at_least_one_role')}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={editData.allowedRoles.length === 0}
              variant="default"
              size="sm"
              className="admin-btn-primary"
            >
              {localize('com_admin_save')}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="admin-btn-secondary"
            >
              {localize('com_admin_cancel')}
            </Button>
          </div>
        </div>
      )}

      {!isEditing && setting.description && (
        <div className="mt-2 text-sm admin-text-secondary">
          {setting.description}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs admin-text-muted">
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
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">{localize('com_admin_loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <h3 className="admin-alert-title">{localize('com_admin_error_loading_endpoint_settings')}</h3>
          <p className="admin-alert-description">{(error as any)?.message || 'Unknown error'}</p>
          <button
            onClick={() => refetch()}
            className="admin-btn-destructive mt-2"
          >
            {localize('com_admin_retry')}
          </button>
        </div>
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
      <div className="admin-header-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="admin-header-icon">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="admin-header-title">
                {localize('com_admin_endpoint_management')}
              </h1>
              <p className="admin-header-description mt-1">
                {localize('com_admin_endpoint_management_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">{localize('com_admin_total_endpoints')}</p>
              <p className="stat-value mt-2">{stats.total}</p>
            </div>
            <div className="stat-icon">
              <Info className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">{localize('com_admin_endpoints_enabled')}</p>
              <p className="stat-value mt-2">{stats.enabled}</p>
            </div>
            <div className="stat-icon">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">{localize('com_admin_endpoints_disabled')}</p>
              <p className="stat-value mt-2 admin-text-secondary">{stats.disabled}</p>
            </div>
            <div className="stat-icon">
              <EyeOff className="h-5 w-5 admin-text-muted" />
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
          <button
            onClick={() => handleBulkToggle(true)}
            disabled={bulkUpdateMutation.isLoading}
            className="admin-btn-primary"
          >
            {localize('com_admin_enable_all')}
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            disabled={bulkUpdateMutation.isLoading}
            className="admin-btn-secondary"
          >
            {localize('com_admin_disable_all')}
          </button>
          <button
            onClick={handleCleanupDuplicates}
            className="admin-btn-secondary"
          >
            {localize('com_admin_fix_duplicates')}
          </button>
        </div>
      </div>

      {/* Endpoint List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty-state">
              <div className="admin-empty-state-icon">
                <Settings />
              </div>
              <h3 className="admin-empty-state-title">
                {searchTerm ? localize('com_admin_no_endpoints_found') : localize('com_admin_no_endpoints_configured')}
              </h3>
              <p className="admin-empty-state-description">
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