import React, { useState, useCallback } from 'react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';
import { Loader2, Settings, Eye, EyeOff, GripVertical, Users, Info } from 'lucide-react';
import { useGetEndpointSettings, type TEndpointSetting } from '~/data-provider/Admin/queries';
import {
  useToggleEndpointMutation,
  useUpdateEndpointSettingMutation,
  useReorderEndpointsMutation,
  useBulkUpdateEndpointsMutation,
  useClearEndpointCacheMutation,
} from '~/data-provider/Admin/mutations';
import { request } from 'librechat-data-provider';

// Use the type from queries
type EndpointSetting = TEndpointSetting;

const EndpointCard: React.FC<{
  setting: EndpointSetting;
  onToggle: (endpoint: string, enabled: boolean) => void;
  onUpdate: (endpoint: string, data: Partial<EndpointSetting>) => void;
  isLoading: boolean;
}> = ({ setting, onToggle, onUpdate, isLoading }) => {
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
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-move">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            {setting.enabled ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <h3 className="font-semibold capitalize text-gray-900 dark:text-gray-100">
              {setting.endpoint}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onToggle(setting.endpoint, !setting.enabled)}
            disabled={isLoading}
            className={`min-w-[80px] rounded px-3 py-1 text-sm font-medium transition-colors ${
              setting.enabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              setting.enabled ? 'Enabled' : 'Disabled'
            )}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Optional description for this endpoint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Users className="mr-1 inline h-4 w-4" />
              Allowed Roles
            </label>
            <div className="mt-2 flex gap-2">
              {Object.values(SystemRoles).map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`rounded px-3 py-1 text-sm transition-colors ${
                    editData.allowedRoles.includes(role)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {editData.allowedRoles.length === 0 && (
              <p className="mt-1 text-sm text-red-600">At least one role must be selected</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={editData.allowedRoles.length === 0}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isEditing && setting.description && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {setting.description}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>Order: {setting.order}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {setting.allowedRoles.join(', ')}
        </span>
        {setting.updatedAt && (
          <span>Updated: {new Date(setting.updatedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

const EndpointManagement: React.FC = () => {
  const { user } = useAuthContext();
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <h3 className="font-semibold text-red-800 dark:text-red-200">Error loading endpoint settings</h3>
        <p className="text-red-600 dark:text-red-400">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
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
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Endpoint Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Control which AI model endpoints are available to users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Endpoints</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <Info className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Enabled</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.enabled}</p>
            </div>
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disabled</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.disabled}</p>
            </div>
            <EyeOff className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleBulkToggle(true)}
            disabled={bulkUpdateMutation.isLoading}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Enable All
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            disabled={bulkUpdateMutation.isLoading}
            className="rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Disable All
          </button>
          <button
            onClick={handleCleanupDuplicates}
            className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
          >
            Fix Duplicates
          </button>
        </div>
      </div>

      {/* Endpoint List */}
      <div className="space-y-3">
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? `No endpoints found matching "${searchTerm}"` : 'No endpoints configured'}
            </p>
          </div>
        ) : (
          filteredEndpoints.map((setting) => (
            <EndpointCard
              key={setting.endpoint}
              setting={setting}
              onToggle={handleToggleEndpoint}
              onUpdate={handleUpdateEndpoint}
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