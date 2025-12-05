import React, { useState, useCallback } from 'react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import {
  Loader2,
  Wrench,
  Eye,
  EyeOff,
  GripVertical,
  Users,
  Info,
  RotateCcw,
  Globe,
  FileSearch,
  ImageIcon,
  Code,
  Layers,
  Server,
} from 'lucide-react';
import { useGetToolSettings, type TToolSetting } from '~/data-provider/Admin/queries';
import {
  useToggleToolMutation,
  useUpdateToolSettingMutation,
  useBulkUpdateToolsMutation,
  useResetToolSettingsMutation,
} from '~/data-provider/Admin/mutations';
import { useToastContext, Button, Input } from '@librechat/client';

// Tool display configuration
const TOOL_CONFIGS: Record<
  string,
  {
    displayName: string;
    description: string;
    icon: React.ElementType;
  }
> = {
  web_search: {
    displayName: 'Web Search',
    description: 'Search the web for information',
    icon: Globe,
  },
  file_search: {
    displayName: 'File Search',
    description: 'Search through uploaded files',
    icon: FileSearch,
  },
  image_generation: {
    displayName: 'Image Generation',
    description: 'Generate images using AI',
    icon: ImageIcon,
  },
  code_interpreter: {
    displayName: 'Code Interpreter',
    description: 'Execute and analyze code',
    icon: Code,
  },
  artifacts: {
    displayName: 'Artifacts',
    description: 'Create and manage artifacts',
    icon: Layers,
  },
  mcp_servers: {
    displayName: 'MCP Servers',
    description: 'Model Context Protocol servers',
    icon: Server,
  },
};

interface ToolCardProps {
  setting: TToolSetting;
  onToggle: (toolId: string, enabled: boolean) => void;
  onUpdate: (toolId: string, data: Partial<TToolSetting>) => void;
  isLoading: boolean;
  localize: ReturnType<typeof useLocalize>;
}

const ToolCard: React.FC<ToolCardProps> = ({
  setting,
  onToggle,
  onUpdate,
  isLoading,
  localize,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: setting.description || '',
    allowedRoles: setting.allowedRoles,
  });

  const config = TOOL_CONFIGS[setting.toolId] || {
    displayName: setting.toolId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: '',
    icon: Wrench,
  };

  const Icon = config.icon;

  const handleSave = () => {
    onUpdate(setting.toolId, editData);
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
      ? editData.allowedRoles.filter((r) => r !== role)
      : [...editData.allowedRoles, role];

    // Ensure at least one role is selected
    if (newRoles.length > 0) {
      setEditData({ ...editData, allowedRoles: newRoles });
    }
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        setting.enabled
          ? 'border-border-light bg-surface-primary'
          : 'border-border-light bg-surface-secondary'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="cursor-move rounded-lg bg-surface-tertiary p-2">
            <GripVertical className="h-4 w-4 text-text-tertiary" />
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${
                setting.enabled ? 'bg-surface-tertiary' : 'bg-surface-secondary'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  setting.enabled ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{config.displayName}</h3>
              <p className="text-sm text-text-secondary">{config.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-text-secondary hover:text-text-primary"
          >
            <Users className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => onToggle(setting.toolId, !setting.enabled)}
            disabled={isLoading}
            variant={setting.enabled ? 'submit' : 'outline'}
            size="sm"
            className="min-w-[100px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : setting.enabled ? (
              <>
                <Eye className="mr-1.5 h-4 w-4" />
                {localize('com_admin_enabled') || 'Enabled'}
              </>
            ) : (
              <>
                <EyeOff className="mr-1.5 h-4 w-4" />
                {localize('com_admin_disabled') || 'Disabled'}
              </>
            )}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-4 border-t border-border-light pt-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              {localize('com_admin_description') || 'Description'}
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 w-full rounded border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
              rows={2}
              placeholder={localize('com_admin_optional_description') || 'Optional description'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary">
              <Users className="mr-1 inline h-4 w-4" />
              {localize('com_admin_allowed_roles') || 'Allowed Roles'}
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
              <p className="mt-1 text-sm text-destructive">
                {localize('com_admin_at_least_one_role') || 'At least one role must be selected'}
              </p>
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
              {localize('com_admin_save') || 'Save'}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              {localize('com_admin_cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
          <span>
            {localize('com_admin_order') || 'Order'}: {setting.order + 1}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {setting.allowedRoles.join(', ')}
          </span>
          {setting.updatedAt && (
            <span>
              {localize('com_admin_updated') || 'Updated'}:{' '}
              {new Date(setting.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ToolManagement: React.FC = () => {
  const { user } = useAuthContext();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: toolData, isLoading, error, refetch } = useGetToolSettings();

  // Mutations
  const toggleToolMutation = useToggleToolMutation();
  const updateToolMutation = useUpdateToolSettingMutation();
  const bulkUpdateMutation = useBulkUpdateToolsMutation();
  const resetMutation = useResetToolSettingsMutation();

  // Derived state
  const settings = toolData?.settings || [];
  const stats = toolData?.stats || { total: 0, enabled: 0, disabled: 0 };
  const filteredTools = settings.filter(
    (setting) =>
      setting.toolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (TOOL_CONFIGS[setting.toolId]?.displayName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const isMutating =
    toggleToolMutation.isLoading ||
    updateToolMutation.isLoading ||
    bulkUpdateMutation.isLoading ||
    resetMutation.isLoading;

  const handleToggleTool = useCallback(
    async (toolId: string, enabled: boolean) => {
      try {
        await toggleToolMutation.mutateAsync({ toolId, enabled });
        showToast({
          message: `Tool ${enabled ? 'enabled' : 'disabled'} successfully`,
          status: 'success',
        });
      } catch (error) {
        showToast({
          message: `Failed to ${enabled ? 'enable' : 'disable'} tool`,
          status: 'error',
        });
        console.error('Error toggling tool:', error);
      }
    },
    [toggleToolMutation, showToast],
  );

  const handleUpdateTool = useCallback(
    async (toolId: string, data: Partial<TToolSetting>) => {
      try {
        await updateToolMutation.mutateAsync({ toolId, ...data });
        showToast({
          message: localize('com_admin_tool_updated') || 'Tool settings updated successfully',
          status: 'success',
        });
      } catch (error) {
        showToast({
          message: localize('com_admin_tool_update_error') || 'Failed to update tool settings',
          status: 'error',
        });
        console.error('Error updating tool:', error);
      }
    },
    [updateToolMutation, showToast, localize],
  );

  const handleBulkToggle = useCallback(
    async (enabled: boolean) => {
      try {
        const updates =
          filteredTools?.map((setting) => ({
            toolId: setting.toolId,
            enabled,
          })) || [];

        await bulkUpdateMutation.mutateAsync({ updates });
        showToast({
          message: `All tools ${enabled ? 'enabled' : 'disabled'} successfully`,
          status: 'success',
        });
      } catch (error) {
        showToast({
          message: `Failed to ${enabled ? 'enable' : 'disable'} all tools`,
          status: 'error',
        });
        console.error('Error bulk updating tools:', error);
      }
    },
    [bulkUpdateMutation, showToast, filteredTools],
  );

  const handleReset = useCallback(async () => {
    try {
      await resetMutation.mutateAsync();
      showToast({
        message: localize('com_admin_tools_reset') || 'Tool settings reset to defaults',
        status: 'success',
      });
    } catch (error) {
      showToast({
        message: localize('com_admin_tools_reset_error') || 'Failed to reset tool settings',
        status: 'error',
      });
      console.error('Error resetting tools:', error);
    }
  }, [resetMutation, showToast, localize]);

  // Check if user is admin
  if (user?.role !== SystemRoles.ADMIN) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            {localize('com_admin_access_denied') || 'Access Denied'}
          </h2>
          <p className="text-text-secondary">
            {localize('com_admin_access_denied_description') ||
              'You do not have permission to access this page.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-destructive/10 rounded-lg border border-destructive/30 p-4">
        <h3 className="font-semibold text-destructive">
          {localize('com_admin_error_loading_tool_settings') || 'Error loading tool settings'}
        </h3>
        <p className="text-destructive/80">{(error as any)?.message || 'Unknown error'}</p>
        <Button onClick={() => refetch()} variant="destructive" size="sm" className="mt-2">
          {localize('com_admin_retry') || 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-tertiary">
              <Wrench className="h-6 w-6 text-text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {localize('com_admin_tool_management') || 'Tool Management'}
              </h1>
              <p className="text-sm text-text-secondary">
                {localize('com_admin_tool_management_description') ||
                  'Manage AI tools visibility and access control'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {localize('com_admin_total_tools') || 'Total Tools'}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats.total}
              </p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Info className="h-5 w-5 text-text-primary" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {localize('com_admin_tools_enabled') || 'Enabled'}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats.enabled}
              </p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Eye className="h-5 w-5 text-text-primary" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {localize('com_admin_tools_disabled') || 'Disabled'}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-secondary">
                {stats.disabled}
              </p>
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
            placeholder={localize('com_admin_search_tools') || 'Search tools...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkToggle(true)}
            disabled={isMutating}
            variant="default"
            size="sm"
            className="bg-text-primary text-surface-primary hover:opacity-90"
          >
            {localize('com_admin_enable_all') || 'Enable All'}
          </Button>
          <Button
            onClick={() => handleBulkToggle(false)}
            disabled={isMutating}
            variant="outline"
            size="sm"
          >
            {localize('com_admin_disable_all') || 'Disable All'}
          </Button>
          <Button
            onClick={handleReset}
            disabled={isMutating}
            variant="outline"
            size="sm"
            className="border-border-medium text-text-primary hover:bg-surface-hover"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            {localize('com_admin_reset_defaults') || 'Reset to Defaults'}
          </Button>
        </div>
      </div>

      {/* Tool List */}
      <div className="space-y-4">
        {filteredTools.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-surface-primary p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-surface-tertiary p-4">
                <Wrench className="h-8 w-8 text-text-tertiary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {searchTerm
                  ? localize('com_admin_no_tools_found') || 'No tools found'
                  : localize('com_admin_no_tools_configured') || 'No tools configured'}
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-text-secondary">
                {searchTerm ? `"${searchTerm}"` : ''}
              </p>
            </div>
          </div>
        ) : (
          filteredTools
            .sort((a, b) => a.order - b.order)
            .map((setting) => (
              <ToolCard
                key={setting.toolId}
                setting={setting}
                onToggle={handleToggleTool}
                onUpdate={handleUpdateTool}
                localize={localize}
                isLoading={isMutating}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default ToolManagement;
