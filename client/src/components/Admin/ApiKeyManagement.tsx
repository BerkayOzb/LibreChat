import React, { useState, useCallback } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { 
  Loader2, 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  useSetAdminApiKeyMutation,
  useUpdateAdminApiKeySettingsMutation,
  useToggleAdminApiKeyMutation,
  useDeleteAdminApiKeyMutation,
} from '~/data-provider/Admin/mutations';
import {
  useGetAdminApiKeys,
  type TAdminApiKeyResponse,
  type TAdminApiKeyStats,
} from '~/data-provider/Admin/queries';
import { useToastContext, Button, Input } from '@librechat/client';

// Endpoint configuration for the UI
const ENDPOINT_CONFIGS = {
  [EModelEndpoint.openAI]: {
    displayName: 'OpenAI',
    requiresBaseURL: false,
    placeholder: 'sk-...',
    description: 'OpenAI API key for GPT models'
  },
  [EModelEndpoint.anthropic]: {
    displayName: 'Anthropic',
    requiresBaseURL: false,
    placeholder: 'sk-ant-...',
    description: 'Anthropic API key for Claude models'
  },
  [EModelEndpoint.google]: {
    displayName: 'Google',
    requiresBaseURL: false,
    placeholder: 'AIza...',
    description: 'Google API key for Gemini models'
  },
  [EModelEndpoint.azureOpenAI]: {
    displayName: 'Azure OpenAI',
    requiresBaseURL: true,
    placeholder: 'sk-...',
    description: 'Azure OpenAI API key'
  },
  [EModelEndpoint.gptPlugins]: {
    displayName: 'GPT Plugins',
    requiresBaseURL: false,
    placeholder: 'sk-...',
    description: 'API key for GPT Plugins'
  },
  [EModelEndpoint.assistants]: {
    displayName: 'OpenAI Assistants',
    requiresBaseURL: false,
    placeholder: 'sk-...',
    description: 'OpenAI Assistants API key'
  },
  [EModelEndpoint.bedrock]: {
    displayName: 'AWS Bedrock',
    requiresBaseURL: false,
    placeholder: 'AKIA...',
    description: 'AWS Bedrock access key'
  },
  'GroqAI': {
    displayName: 'Groq',
    requiresBaseURL: false,
    placeholder: 'gsk_...',
    description: 'Groq API key for LLaMA and Mixtral models'
  },
  'OpenRouter': {
    displayName: 'OpenRouter',
    requiresBaseURL: false,
    placeholder: 'sk-or-...',
    description: 'OpenRouter API key for access to multiple AI models'
  },
};

const ApiKeyCard: React.FC<{
  apiKey: TAdminApiKeyResponse;
  onEdit: (apiKey: TAdminApiKeyResponse) => void;
  onDelete: (endpoint: string) => void;
  onToggle: (endpoint: string, isActive: boolean) => void;
  isLoading: boolean;
  localize: ReturnType<typeof useLocalize>;
}> = ({ apiKey, onEdit, onDelete, onToggle, isLoading, localize }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const endpointConfig = ENDPOINT_CONFIGS[apiKey.endpoint as EModelEndpoint];

  const handleDelete = () => {
    onDelete(apiKey.endpoint);
    setShowConfirmDelete(false);
  };

  return (
    <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-text-secondary" />
            <h3 className="font-semibold text-text-primary">
              {endpointConfig?.displayName || apiKey.endpoint}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              apiKey.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {apiKey.isActive ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {localize('com_admin_active')}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {localize('com_admin_inactive')}
                </>
              )}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="font-medium">{localize('com_admin_api_key')}:</span>
              <code className="px-2 py-1 bg-surface-secondary rounded text-xs">
                {apiKey.apiKey}
              </code>
            </div>
            
            {apiKey.baseURL && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{localize('com_admin_base_url')}:</span>
                <code className="px-2 py-1 bg-surface-secondary rounded text-xs">
                  {apiKey.baseURL}
                </code>
              </div>
            )}
            
            {apiKey.description && (
              <div className="flex items-start gap-2">
                <span className="font-medium">{localize('com_admin_description')}:</span>
                <span>{apiKey.description}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <span>{localize('com_admin_created')}: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
              {apiKey.lastUsed && (
                <span>{localize('com_admin_last_used')}: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={() => onToggle(apiKey.endpoint, !apiKey.isActive)}
            disabled={isLoading}
            variant={apiKey.isActive ? 'outline' : 'submit'}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : apiKey.isActive ? (
              localize('com_admin_deactivate')
            ) : (
              localize('com_admin_activate')
            )}
          </Button>

          <Button
            onClick={() => onEdit(apiKey)}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary"
            title={localize('com_admin_edit_api_key')}
          >
            <Edit3 className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setShowConfirmDelete(true)}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive/80"
            title={localize('com_admin_delete_api_key')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showConfirmDelete && (
        <div className="mt-4 p-3 bg-destructive/10 border border-border-medium rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">
              {localize('com_admin_confirm_deletion')}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            {localize('com_admin_delete_api_key_confirmation')} {endpointConfig?.displayName || apiKey.endpoint}?
            {localize('com_admin_delete_api_key_warning')}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : localize('com_admin_delete')}
            </Button>
            <Button
              onClick={() => setShowConfirmDelete(false)}
              variant="outline"
              size="sm"
            >
              {localize('com_admin_cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ApiKeyForm: React.FC<{
  apiKey?: TAdminApiKeyResponse;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  localize: ReturnType<typeof useLocalize>;
}> = ({ apiKey, onSave, onCancel, isLoading, localize }) => {
  const [formData, setFormData] = useState({
    endpoint: apiKey?.endpoint || '',
    apiKey: '',
    baseURL: apiKey?.baseURL || '',
    description: apiKey?.description || '',
    isActive: apiKey?.isActive ?? true,
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const endpointConfig = ENDPOINT_CONFIGS[formData.endpoint as EModelEndpoint];
  const isEditing = !!apiKey;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.endpoint) {
      newErrors.endpoint = localize('com_admin_endpoint_required');
    }
    
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = localize('com_admin_api_key_required');
    }
    
    if (endpointConfig?.requiresBaseURL && !formData.baseURL.trim()) {
      newErrors.baseURL = localize('com_admin_base_url_required');
    }
    
    if (formData.baseURL && formData.baseURL.trim()) {
      try {
        new URL(formData.baseURL);
      } catch {
        newErrors.baseURL = localize('com_admin_invalid_url_format');
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? localize('com_admin_edit_api_key_title') : localize('com_admin_add_api_key_title')}
            </h2>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {localize('com_admin_endpoint')}
              </label>
              <select
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-border-medium rounded-md bg-surface-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-border-heavy"
              >
                <option value="">{localize('com_admin_select_endpoint')}</option>
                {Object.entries(ENDPOINT_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.displayName}
                  </option>
                ))}
              </select>
              {errors.endpoint && (
                <p className="text-destructive text-xs mt-1">{errors.endpoint}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {localize('com_admin_api_key')}
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={endpointConfig?.placeholder || localize('com_admin_enter_api_key')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 text-text-secondary hover:text-text-primary"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.apiKey && (
                <p className="text-destructive text-xs mt-1">{errors.apiKey}</p>
              )}
            </div>
            
            {endpointConfig?.requiresBaseURL && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {localize('com_admin_base_url')}
                </label>
                <Input
                  type="url"
                  value={formData.baseURL}
                  onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
                  placeholder={localize('com_admin_base_url_placeholder')}
                />
                {errors.baseURL && (
                  <p className="text-destructive text-xs mt-1">{errors.baseURL}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {localize('com_admin_description')} (Optional)
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={localize('com_admin_optional_description_placeholder')}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-text-primary">
                {localize('com_admin_active_checkbox')}
              </label>
            </div>
            
            {endpointConfig && (
              <div className="p-3 bg-surface-secondary border border-border-medium rounded">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-text-secondary mt-0.5" />
                  <div className="text-sm text-text-secondary">
                    <p className="font-medium mb-1 text-text-primary">{endpointConfig.displayName}</p>
                    <p>{endpointConfig.description}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                variant="submit"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? localize('com_admin_update') : localize('com_admin_save')}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
              >
                {localize('com_admin_cancel')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ApiKeyManagement: React.FC = () => {
  const { user } = useAuthContext();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<TAdminApiKeyResponse | undefined>();
  
  // React Query hooks
  const { data: apiKeysData, isLoading: isLoadingKeys, error } = useGetAdminApiKeys();
  const setApiKeyMutation = useSetAdminApiKeyMutation();
  const updateApiKeyMutation = useUpdateAdminApiKeySettingsMutation();
  const toggleApiKeyMutation = useToggleAdminApiKeyMutation();
  const deleteApiKeyMutation = useDeleteAdminApiKeyMutation();
  
  const apiKeys = apiKeysData?.keys || [];
  const stats = apiKeysData?.stats || { total: 0, active: 0, inactive: 0, endpoints: [] };
  const isLoading = isLoadingKeys || setApiKeyMutation.isLoading || updateApiKeyMutation.isLoading || 
                    toggleApiKeyMutation.isLoading || deleteApiKeyMutation.isLoading;
  
  // Check if user is admin
  if (user?.role !== SystemRoles.ADMIN) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">{localize('com_admin_access_denied')}</h2>
          <p className="text-text-secondary">{localize('com_admin_api_key_access_denied')}</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">{localize('com_admin_error_loading_api_keys')}</h2>
          <p className="text-text-secondary">{(error as any)?.message || localize('com_admin_failed_load_api_keys')}</p>
        </div>
      </div>
    );
  }

  const handleAddKey = () => {
    setEditingKey(undefined);
    setShowForm(true);
  };

  const handleEditKey = (apiKey: TAdminApiKeyResponse) => {
    setEditingKey(apiKey);
    setShowForm(true);
  };

  const handleSaveKey = async (formData: any) => {
    try {
      if (editingKey) {
        // Update existing key settings
        await updateApiKeyMutation.mutateAsync({
          endpoint: formData.endpoint,
          baseURL: formData.baseURL,
          description: formData.description,
          isActive: formData.isActive,
        });
        showToast({
          message: localize('com_admin_api_key_updated'),
          status: 'success',
        });
      } else {
        // Create new key
        await setApiKeyMutation.mutateAsync({
          endpoint: formData.endpoint,
          apiKey: formData.apiKey,
          baseURL: formData.baseURL,
          description: formData.description,
          isActive: formData.isActive,
        });
        showToast({
          message: localize('com_admin_api_key_created'),
          status: 'success',
        });
      }
      
      setShowForm(false);
      setEditingKey(undefined);
    } catch (error) {
      console.error('Error saving API key:', error);
      showToast({
        message: `${localize('com_admin_error_saving_api_key')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  };

  const handleDeleteKey = async (endpoint: string) => {
    try {
      await deleteApiKeyMutation.mutateAsync({ endpoint });
      showToast({
        message: localize('com_admin_api_key_deleted'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      showToast({
        message: `${localize('com_admin_error_deleting_api_key')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  };

  const handleToggleKey = async (endpoint: string, isActive: boolean) => {
    try {
      await toggleApiKeyMutation.mutateAsync({ endpoint, isActive });
      showToast({
        message: isActive ? localize('com_admin_api_key_activated') : localize('com_admin_api_key_deactivated'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error toggling API key:', error);
      showToast({
        message: `${localize('com_admin_error_toggling_api_key')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{localize('com_admin_api_key_management')}</h1>
          <p className="text-text-secondary mt-1">
            {localize('com_admin_api_key_management_long_description')}
          </p>
        </div>
        <Button
          onClick={handleAddKey}
          variant="submit"
        >
          <Plus className="h-4 w-4" />
          {localize('com_admin_add_api_key')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-primary border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">{localize('com_admin_total_keys')}</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <Key className="h-8 w-8 text-text-secondary" />
          </div>
        </div>
        
        <div className="bg-surface-primary border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">{localize('com_admin_active_keys')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-surface-primary border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">{localize('com_admin_inactive_keys')}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.inactive}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">{localize('com_admin_no_api_keys')}</h3>
            <p className="text-text-secondary mb-4">
              {localize('com_admin_no_api_keys_description')}
            </p>
            <Button
              onClick={handleAddKey}
              variant="submit"
              className="mx-auto"
            >
              <Plus className="h-4 w-4" />
              {localize('com_admin_add_first_api_key')}
            </Button>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey._id}
              apiKey={apiKey}
              onEdit={handleEditKey}
              onDelete={handleDeleteKey}
              onToggle={handleToggleKey}
              isLoading={isLoading}
              localize={localize}
            />
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ApiKeyForm
          apiKey={editingKey}
          onSave={handleSaveKey}
          onCancel={() => {
            setShowForm(false);
            setEditingKey(undefined);
          }}
          isLoading={isLoading}
          localize={localize}
        />
      )}
    </div>
  );
};

export default ApiKeyManagement;