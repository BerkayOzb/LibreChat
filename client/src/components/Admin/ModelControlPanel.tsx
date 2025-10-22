import React, { useState, useCallback, useMemo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { 
  Loader2, 
  Brain, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  RefreshCw,
  Settings,
  Save,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  useGetEndpointModels,
  useGetAdminModelStats,
  type TModelWithAdminStatus,
  type TEndpointModelsResponse,
} from '~/data-provider/Admin/queries';
import {
  useToggleModelMutation,
  useBulkUpdateModelsMutation,
  useResetModelSettingMutation,
  useClearModelCacheMutation,
  type TBulkUpdateModelsRequest,
} from '~/data-provider/Admin/mutations';
import { useToastContext } from '@librechat/client';
import { Button, Input, Textarea } from '@librechat/client';

// Endpoint configuration for display
const ENDPOINT_CONFIGS = {
  [EModelEndpoint.openAI]: {
    displayName: 'OpenAI',
    description: 'GPT models and embeddings',
    color: 'bg-green-100 text-green-800',
  },
  [EModelEndpoint.anthropic]: {
    displayName: 'Anthropic',
    description: 'Claude models',
    color: 'bg-orange-100 text-orange-800',
  },
  [EModelEndpoint.google]: {
    displayName: 'Google',
    description: 'Gemini models',
    color: 'bg-blue-100 text-blue-800',
  },
  [EModelEndpoint.azureOpenAI]: {
    displayName: 'Azure OpenAI',
    description: 'Azure-hosted OpenAI models',
    color: 'bg-cyan-100 text-cyan-800',
  },
  [EModelEndpoint.assistants]: {
    displayName: 'OpenAI Assistants',
    description: 'OpenAI Assistants API',
    color: 'bg-purple-100 text-purple-800',
  },
  [EModelEndpoint.azureAssistants]: {
    displayName: 'Azure Assistants',
    description: 'Azure OpenAI Assistants API',
    color: 'bg-indigo-100 text-indigo-800',
  },
  [EModelEndpoint.bedrock]: {
    displayName: 'AWS Bedrock',
    description: 'AWS Bedrock models',
    color: 'bg-yellow-100 text-yellow-800',
  },
};

interface ModelRowProps {
  model: TModelWithAdminStatus;
  onToggle: (modelName: string, isEnabled: boolean, reason?: string) => void;
  onReset: (modelName: string) => void;
  isLoading: boolean;
}

const ModelRow: React.FC<ModelRowProps> = ({ model, onToggle, onReset, isLoading }) => {
  const localize = useLocalize();
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState(model.reason || '');

  const handleToggle = useCallback(() => {
    if (model.isEnabled) {
      // When disabling, show reason dialog
      setShowReasonDialog(true);
    } else {
      // When enabling, no reason needed
      onToggle(model.modelName, true);
    }
  }, [model.isEnabled, model.modelName, onToggle]);

  const handleSubmitReason = useCallback(() => {
    onToggle(model.modelName, false, reason);
    setShowReasonDialog(false);
  }, [model.modelName, onToggle, reason]);

  const handleReset = useCallback(() => {
    onReset(model.modelName);
  }, [model.modelName, onReset]);

  const statusColor = model.isEnabled ? 'text-green-600' : 'text-red-600';
  const statusIcon = model.isEnabled ? CheckCircle : EyeOff;
  const StatusIcon = statusIcon;

  return (
    <>
      <tr className="border-b border-border-light hover:bg-surface-hover dark:hover:bg-surface-hover">
        <td className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Brain className="h-4 w-4 text-text-secondary" />
            <span className="font-medium text-text-primary">{model.modelName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
            <span className={`text-sm font-medium ${statusColor}`}>
              {model.isEnabled ? localize('com_admin_enabled') : localize('com_admin_disabled')}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          {model.reason && (
            <div className="max-w-xs">
              <p className="text-sm text-text-secondary truncate" title={model.reason}>
                {model.reason}
              </p>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          {model.disabledAt && (
            <span className="text-sm text-text-secondary">
              {new Date(model.disabledAt).toLocaleDateString()}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`p-1 rounded-md transition-colors ${
                model.isEnabled
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              } disabled:opacity-50`}
              title={model.isEnabled ? localize('com_admin_disable') : localize('com_admin_enable')}
            >
              {model.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="p-1 text-text-secondary hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
              title={localize('com_admin_reset')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Reason Dialog */}
      {showReasonDialog && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-surface-secondary">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-text-primary">
                  {localize('com_admin_disable_reason_title')}
                </span>
              </div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={localize('com_admin_disable_reason_placeholder')}
                className="w-full"
                rows={2}
              />
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSubmitReason}
                  variant="outline"
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {localize('com_admin_disable')}
                </Button>
                <Button
                  onClick={() => setShowReasonDialog(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-3 w-3 mr-1" />
                  {localize('com_admin_cancel')}
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

interface EndpointSectionProps {
  endpoint: string;
  data: TEndpointModelsResponse;
  searchTerm: string;
  filterStatus: string;
  onBulkUpdate: (endpoint: string, updates: TBulkUpdateModelsRequest['updates']) => void;
  onToggle: (endpoint: string, modelName: string, isEnabled: boolean, reason?: string) => void;
  onReset: (endpoint: string, modelName: string) => void;
  isLoading: boolean;
}

const EndpointSection: React.FC<EndpointSectionProps> = ({
  endpoint,
  data,
  searchTerm,
  filterStatus,
  onBulkUpdate,
  onToggle,
  onReset,
  isLoading,
}) => {
  const localize = useLocalize();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const config = ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS] || {
    displayName: endpoint,
    description: '',
    color: 'bg-surface-secondary text-text-primary',
  };

  const filteredModels = useMemo(() => {
    return data.models.filter((model) => {
      const matchesSearch = model.modelName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'enabled' && model.isEnabled) ||
        (filterStatus === 'disabled' && !model.isEnabled);
      return matchesSearch && matchesFilter;
    });
  }, [data.models, searchTerm, filterStatus]);

  const enabledCount = filteredModels.filter((m) => m.isEnabled).length;
  const disabledCount = filteredModels.filter((m) => !m.isEnabled).length;

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedModels(new Set(filteredModels.map((m) => m.modelName)));
    } else {
      setSelectedModels(new Set());
    }
  }, [filteredModels]);

  const handleSelectModel = useCallback((modelName: string, checked: boolean) => {
    setSelectedModels((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(modelName);
      } else {
        newSet.delete(modelName);
      }
      return newSet;
    });
  }, []);

  const handleBulkEnable = useCallback(() => {
    const updates = Array.from(selectedModels).map((modelName) => ({
      modelName,
      isEnabled: true,
    }));
    onBulkUpdate(endpoint, updates);
    setSelectedModels(new Set());
    setShowBulkActions(false);
  }, [selectedModels, onBulkUpdate, endpoint]);

  const handleBulkDisable = useCallback(() => {
    const updates = Array.from(selectedModels).map((modelName) => ({
      modelName,
      isEnabled: false,
      reason: localize('com_admin_bulk_disabled_reason'),
    }));
    onBulkUpdate(endpoint, updates);
    setSelectedModels(new Set());
    setShowBulkActions(false);
  }, [selectedModels, onBulkUpdate, endpoint]);

  if (filteredModels.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border-light bg-surface-primary p-6 shadow-sm mb-6">
      <div className="pb-4">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-surface-hover rounded-lg p-2 -m-2 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.displayName}
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              {config.description}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-text-secondary">
              <span className="text-green-600 font-medium">{enabledCount}</span> {localize('com_admin_enabled').toLowerCase()}, 
              <span className="text-red-600 font-medium ml-1">{disabledCount}</span> {localize('com_admin_disabled').toLowerCase()}
            </div>
            {selectedModels.size > 0 && isExpanded && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBulkActions(!showBulkActions);
                }}
                variant="outline"
                size="sm"
              >
                <Settings className="h-3 w-3 mr-1" />
                {localize('com_admin_bulk_actions')} ({selectedModels.size})
              </Button>
            )}
          </div>
        </div>

        {showBulkActions && selectedModels.size > 0 && isExpanded && (
          <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-text-primary">
                {localize('com_admin_bulk_actions_for_models').replace('{{count}}', selectedModels.size.toString())}
              </span>
              <Button
                onClick={handleBulkEnable}
                variant="outline"
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isLoading}
              >
                <Eye className="h-3 w-3 mr-1" />
                {localize('com_admin_enable_all')}
              </Button>
              <Button
                onClick={handleBulkDisable}
                variant="outline"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isLoading}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                {localize('com_admin_disable_all')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedModels.size === filteredModels.length && filteredModels.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-border-light"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {localize('com_admin_model_name')}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_status')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_reason')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_disabled_at')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => (
                <React.Fragment key={model.modelName}>
                  <tr>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedModels.has(model.modelName)}
                          onChange={(e) => handleSelectModel(model.modelName, e.target.checked)}
                          className="rounded border-border-light"
                        />
                      </div>
                    </td>
                    <td colSpan={4} className="p-0">
                      <ModelRow
                        model={model}
                        onToggle={(modelName, isEnabled, reason) => onToggle(endpoint, modelName, isEnabled, reason)}
                        onReset={(modelName) => onReset(endpoint, modelName)}
                        isLoading={isLoading}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
};

const ModelControlPanel: React.FC = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Queries
  const { data: statsData } = useGetAdminModelStats();
  
  // Get endpoint models data for all endpoints
  const endpointQueries = Object.keys(ENDPOINT_CONFIGS).map(endpoint => ({
    endpoint,
    query: useGetEndpointModels(endpoint, { enabled: selectedEndpoint === 'all' || selectedEndpoint === endpoint })
  }));

  // Mutations
  const toggleModelMutation = useToggleModelMutation();
  const bulkUpdateMutation = useBulkUpdateModelsMutation();
  const resetModelMutation = useResetModelSettingMutation();
  const clearCacheMutation = useClearModelCacheMutation();

  const isLoading = toggleModelMutation.isLoading || bulkUpdateMutation.isLoading || resetModelMutation.isLoading;

  const handleToggleModel = useCallback(async (endpoint: string, modelName: string, isEnabled: boolean, reason?: string) => {
    try {
      await toggleModelMutation.mutateAsync({
        endpoint,
        modelName,
        isEnabled,
        reason,
      });
      
      showToast({
        message: localize('com_admin_model_toggle_success').replace('{{modelName}}', modelName).replace('{{action}}', isEnabled ? localize('com_admin_enabled').toLowerCase() : localize('com_admin_disabled').toLowerCase()),
        status: 'success',
      });
    } catch (error) {
      showToast({
        message: `${localize('com_admin_model_toggle_error').replace('{{action}}', isEnabled ? localize('com_admin_enable').toLowerCase() : localize('com_admin_disable').toLowerCase())}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  }, [toggleModelMutation, showToast]);

  const handleBulkUpdate = useCallback(async (endpoint: string, updates: TBulkUpdateModelsRequest['updates']) => {
    try {
      const result = await bulkUpdateMutation.mutateAsync({
        endpoint,
        updates,
      });
      
      showToast({
        message: localize('com_admin_bulk_update_success').replace('{{successful}}', result.result.successful.toString()).replace('{{failed}}', result.result.failed.toString()),
        status: result.result.failed > 0 ? 'warning' : 'success',
      });
    } catch (error) {
      showToast({
        message: `${localize('com_admin_bulk_update_error')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  }, [bulkUpdateMutation, showToast]);

  const handleResetModel = useCallback(async (endpoint: string, modelName: string) => {
    try {
      await resetModelMutation.mutateAsync({
        endpoint,
        modelName,
      });
      
      showToast({
        message: localize('com_admin_model_reset_success').replace('{{modelName}}', modelName),
        status: 'success',
      });
    } catch (error) {
      showToast({
        message: `${localize('com_admin_model_reset_error')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  }, [resetModelMutation, showToast]);

  const handleClearCache = useCallback(async () => {
    try {
      await clearCacheMutation.mutateAsync({});
      
      showToast({
        message: localize('com_admin_cache_cleared_success'),
        status: 'success',
      });
    } catch (error) {
      showToast({
        message: `${localize('com_admin_cache_clear_error')}: ${(error as any)?.message || localize('com_admin_unknown_error')}`,
        status: 'error',
      });
    }
  }, [clearCacheMutation, showToast]);

  const endpointsToShow = selectedEndpoint === 'all' 
    ? Object.keys(ENDPOINT_CONFIGS)
    : [selectedEndpoint];

  const relevantQueries = endpointQueries.filter(({ endpoint, query }) => 
    endpointsToShow.includes(endpoint) && !query.isLoading
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {localize('com_admin_model_control')}
          </h1>
          <p className="text-text-secondary mt-1">
            {localize('com_admin_model_control_description')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleClearCache}
            variant="outline"
            disabled={clearCacheMutation.isLoading}
          >
            {clearCacheMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {localize('com_admin_clear_cache')}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {statsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{localize('com_admin_total_models')}</p>
                  <p className="text-2xl font-bold text-text-primary">{statsData.stats.totalModels}</p>
                </div>
              </div>
          </div>
          <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{localize('com_admin_enabled')}</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.stats.totalEnabled}</p>
                </div>
              </div>
          </div>
          <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <EyeOff className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{localize('com_admin_disabled')}</p>
                  <p className="text-2xl font-bold text-red-600">{statsData.stats.totalDisabled}</p>
                </div>
              </div>
          </div>
          <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-surface-secondary rounded-lg">
                  <Settings className="h-5 w-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{localize('com_admin_endpoints')}</p>
                  <p className="text-2xl font-bold text-text-primary">{statsData.stats.totalEndpoints}</p>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border-light bg-surface-primary p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <Input
                  placeholder={localize('com_admin_search_models')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-md bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{localize('com_admin_all_models')}</option>
                <option value="enabled">{localize('com_admin_enabled_models')}</option>
                <option value="disabled">{localize('com_admin_disabled_models')}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-md bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{localize('com_admin_all_endpoints')}</option>
                {Object.entries(ENDPOINT_CONFIGS).map(([endpoint, config]) => (
                  <option key={endpoint} value={endpoint}>
                    {config.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
      </div>

      {/* Model Lists by Endpoint */}
      <div className="space-y-6">
        {relevantQueries.length === 0 ? (
          <div className="rounded-lg border border-border-light bg-surface-primary shadow-sm">
            <div className="p-8 text-center">
              <Brain className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {localize('com_admin_no_models')}
              </h3>
              <p className="text-text-secondary">
                {localize('com_admin_no_models_description')}
              </p>
            </div>
          </div>
        ) : (
          relevantQueries.map(({ endpoint, query }) => {
            if (query.isLoading) {
              return (
                <div key={endpoint} className="rounded-lg border border-border-light bg-surface-primary shadow-sm">
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">
                      {localize('com_admin_loading_models').replace('{{endpoint}}', ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS]?.displayName || endpoint)}
                    </p>
                  </div>
                </div>
              );
            }

            if (query.error) {
              return (
                <div key={endpoint} className="rounded-lg border border-border-light bg-surface-primary shadow-sm">
                  <div className="p-8 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600">
                      {localize('com_admin_failed_load_models').replace('{{endpoint}}', ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS]?.displayName || endpoint)}
                    </p>
                  </div>
                </div>
              );
            }

            if (query.data) {
              return (
                <EndpointSection
                  key={endpoint}
                  endpoint={endpoint}
                  data={query.data}
                  searchTerm={searchTerm}
                  filterStatus={filterStatus}
                  onBulkUpdate={handleBulkUpdate}
                  onToggle={handleToggleModel}
                  onReset={handleResetModel}
                  isLoading={isLoading}
                />
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
};

export default ModelControlPanel;