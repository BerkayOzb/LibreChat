import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
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
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  MODEL: 'model',
};

// Helper to extract provider from model name (e.g., "openai/gpt-4" -> "openai")
const getProviderFromModel = (modelName: string): string => {
  const slashIndex = modelName.indexOf('/');
  if (slashIndex > 0) {
    return modelName.substring(0, slashIndex);
  }
  return 'other';
};

// Helper to group models by provider
const groupModelsByProvider = (models: TModelWithAdminStatus[]): Record<string, TModelWithAdminStatus[]> => {
  const groups: Record<string, TModelWithAdminStatus[]> = {};

  models.forEach(model => {
    const provider = getProviderFromModel(model.modelName);
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
  });

  return groups;
};

// Check if endpoint should use provider grouping
const shouldGroupByProvider = (endpoint: string): boolean => {
  return endpoint === 'AI Models' || endpoint === 'OpenRouter';
};

// Endpoint configuration for display
const ENDPOINT_CONFIGS = {
  [EModelEndpoint.openAI]: {
    displayName: 'OpenAI',
    description: 'GPT models and embeddings',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.anthropic]: {
    displayName: 'Anthropic',
    description: 'Claude models',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.google]: {
    displayName: 'Google',
    description: 'Gemini models',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.azureOpenAI]: {
    displayName: 'Azure OpenAI',
    description: 'Azure-hosted OpenAI models',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.assistants]: {
    displayName: 'OpenAI Assistants',
    description: 'OpenAI Assistants API',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.azureAssistants]: {
    displayName: 'Azure Assistants',
    description: 'Azure OpenAI Assistants API',
    color: 'bg-surface-tertiary text-text-primary',
  },
  [EModelEndpoint.bedrock]: {
    displayName: 'AWS Bedrock',
    description: 'AWS Bedrock models',
    color: 'bg-surface-tertiary text-text-primary',
  },
  'GroqAI': {
    displayName: 'Groq',
    description: 'Fast inference with LLaMA and Mixtral models',
    color: 'bg-surface-tertiary text-text-primary',
  },
  'AI Models': {
    displayName: 'AI Models',
    description: 'Access to multiple AI models',
    color: 'bg-surface-tertiary text-text-primary',
  },
};

type SortColumn = 'modelName' | 'status' | 'disabledAt' | 'position';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

interface PositionInputProps {
  currentPosition: number;
  totalModels: number;
  modelName: string;
  onPositionChange: (modelName: string, newPosition: number) => void;
  disabled?: boolean;
}

const PositionInput: React.FC<PositionInputProps> = ({
  currentPosition,
  totalModels,
  modelName,
  onPositionChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState((currentPosition ?? 0).toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue((currentPosition ?? 0).toString());
    }
  }, [currentPosition, isEditing]);

  const handleMoveUp = useCallback(() => {
    if (currentPosition > 1 && !disabled) {
      onPositionChange(modelName, currentPosition - 1);
    }
  }, [currentPosition, disabled, modelName, onPositionChange]);

  const handleMoveDown = useCallback(() => {
    if (currentPosition < totalModels && !disabled) {
      onPositionChange(modelName, currentPosition + 1);
    }
  }, [currentPosition, totalModels, disabled, modelName, onPositionChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    const newPosition = parseInt(inputValue, 10);
    if (!isNaN(newPosition) && newPosition >= 1 && newPosition <= totalModels && newPosition !== currentPosition) {
      onPositionChange(modelName, newPosition);
    } else {
      setInputValue(currentPosition.toString());
    }
  }, [inputValue, currentPosition, totalModels, modelName, onPositionChange]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputValue(currentPosition.toString());
      setIsEditing(false);
      e.currentTarget.blur();
    }
  }, [currentPosition]);

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={handleMoveUp}
        disabled={disabled || currentPosition === 1}
        className="p-1 rounded hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Move up"
        type="button"
      >
        <ArrowUp className="h-3 w-3 text-text-secondary" />
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsEditing(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        className="w-12 px-2 py-1 text-center text-sm border border-border-light rounded bg-surface-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Position (1-${totalModels})`}
      />
      <button
        onClick={handleMoveDown}
        disabled={disabled || currentPosition === totalModels}
        className="p-1 rounded hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Move down"
        type="button"
      >
        <ArrowDown className="h-3 w-3 text-text-secondary" />
      </button>
    </div>
  );
};

interface ModelRowProps {
  model: TModelWithAdminStatus;
  position: number;
  totalModels: number;
  onPositionChange: (modelName: string, newPosition: number) => void;
  onToggle: (modelName: string, isEnabled: boolean, reason?: string) => void;
  onReset: (modelName: string) => void;
  onSetDefault: (modelName: string) => void;
  isLoading: boolean;
}

const ModelRow: React.FC<ModelRowProps> = ({
  model,
  position,
  totalModels,
  onPositionChange,
  onToggle,
  onReset,
  onSetDefault,
  isLoading
}) => {
  const localize = useLocalize();
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState(model.reason || '');

  const handleToggle = useCallback(() => {
    if (model.isEnabled) {
      setShowReasonDialog(true);
    } else {
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

  const statusColor = model.isEnabled ? 'text-text-primary' : 'text-destructive';
  const StatusIcon = model.isEnabled ? CheckCircle : EyeOff;

  return (
    <>
      <tr className="border-b border-border-light hover:bg-surface-hover dark:hover:bg-surface-hover">
        <td className="px-4 py-3">
          <PositionInput
            currentPosition={position}
            totalModels={totalModels}
            modelName={model.modelName}
            onPositionChange={onPositionChange}
            disabled={isLoading}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Brain className="h-4 w-4 text-text-secondary" />
            <span className="font-medium text-text-primary">{model.modelName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center">
            <input
              type="radio"
              name={`default-model-${model.modelName}`}
              checked={!!model.isDefault}
              onChange={() => onSetDefault(model.modelName)}
              disabled={isLoading || !model.isEnabled}
              className="h-4 w-4 text-primary border-border-light focus:ring-primary cursor-pointer"
              title={localize('com_admin_set_default')}
            />
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
              <p className="text-sm text-text-primary truncate" title={model.reason}>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={isLoading}
              className={model.isEnabled ? 'text-destructive hover:text-destructive/80' : 'text-text-primary hover:text-text-primary/80'}
              title={model.isEnabled ? localize('com_admin_disable') : localize('com_admin_enable')}
            >
              {model.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={isLoading}
              className="text-text-secondary hover:text-text-secondary/80"
              title={localize('com_admin_reset')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      {showReasonDialog && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-surface-secondary">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
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
                  variant="destructive"
                  size="sm"
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

// Provider Group Component - for rendering models within a specific provider
interface ProviderGroupProps {
  endpoint: string;
  provider: string;
  models: TModelWithAdminStatus[];
  onBulkUpdate: (endpoint: string, updates: TBulkUpdateModelsRequest['updates']) => void;
  onToggle: (endpoint: string, modelName: string, isEnabled: boolean, reason?: string) => void;
  onReset: (endpoint: string, modelName: string) => void;
  isLoading: boolean;
}

const ProviderGroup: React.FC<ProviderGroupProps> = ({
  endpoint,
  provider,
  models,
  onBulkUpdate,
  onToggle,
  onReset,
  isLoading,
}) => {
  const localize = useLocalize();
  const [localModels, setLocalModels] = useState<TModelWithAdminStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  // Use ref to avoid stale closure in handleDragEnd
  const localModelsRef = useRef<TModelWithAdminStatus[]>([]);

  useEffect(() => {
    setLocalModels(models);
    localModelsRef.current = models;
  }, [models]);

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    const dragModel = localModelsRef.current[dragIndex];
    const newModels = [...localModelsRef.current];
    newModels.splice(dragIndex, 1);
    newModels.splice(hoverIndex, 0, dragModel);
    setLocalModels(newModels);
    localModelsRef.current = newModels;
  }, []);

  const handleDragEnd = useCallback(() => {
    // Read from ref to get the LATEST state after all drag operations
    const currentModels = localModelsRef.current;
    const updates = currentModels.map((model, index) => ({
      modelName: model.modelName,
      isEnabled: model.isEnabled,
      position: index,
    }));
    onBulkUpdate(endpoint, updates);
  }, [endpoint, onBulkUpdate]);

  const handleSetDefault = useCallback((modelName: string) => {
    onBulkUpdate(endpoint, [{ modelName, isEnabled: true, isDefault: true }]);
  }, [endpoint, onBulkUpdate]);

  const handlePositionChange = useCallback((modelName: string, newPosition: number) => {
    // Find the model and swap positions
    const currentIndex = localModelsRef.current.findIndex(m => m.modelName === modelName);
    if (currentIndex === -1) return;

    const newIndex = newPosition - 1; // Convert 1-based to 0-based
    const newModels = [...localModelsRef.current];
    const [movedModel] = newModels.splice(currentIndex, 1);
    newModels.splice(newIndex, 0, movedModel);

    setLocalModels(newModels);
    localModelsRef.current = newModels;

    // Send position updates to backend
    const updates = newModels.map((model, index) => ({
      modelName: model.modelName,
      isEnabled: model.isEnabled,
      position: index,
    }));
    onBulkUpdate(endpoint, updates);
  }, [endpoint, onBulkUpdate]);

  const providerDisplayName = provider.charAt(0).toUpperCase() + provider.slice(1);
  const enabledCount = localModels.filter(m => m.isEnabled).length;
  const disabledCount = localModels.filter(m => !m.isEnabled).length;

  return (
    <div className="mb-4 rounded-md border border-[var(--admin-border-subtle)] bg-[var(--admin-bg-elevated)] p-4">
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-[var(--admin-row-hover)] rounded-lg p-2 -m-2 transition-colors mb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isExpanded ? <ChevronUp className="h-3 w-3 admin-text-secondary" /> : <ChevronDown className="h-3 w-3 admin-text-secondary" />}
            <span className="font-medium admin-text-primary">{providerDisplayName}</span>
          </div>
          <div className="text-sm admin-text-secondary">
            <span className="admin-success font-medium">{enabledCount}</span> {localize('com_admin_enabled').toLowerCase()},
            <span className="admin-danger font-medium ml-1">{disabledCount}</span> {localize('com_admin_disabled').toLowerCase()}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="admin-table table-fixed">
            <colgroup>
              <col className="w-24" />
              <col className="w-auto" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-48" />
              <col className="w-40" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr>
                <th className="px-4 py-2 text-center text-sm font-medium text-text-primary">
                  {localize('com_admin_order')}
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_model_name')}
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-text-primary">
                  {localize('com_admin_default')}
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_status')}
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_reason')}
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_disabled_at')}
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-text-primary">
                  {localize('com_admin_actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {localModels.map((model, index) => (
                <React.Fragment key={model.modelName}>
                  <ModelRow
                    model={model}
                    position={index + 1}
                    totalModels={localModels.length}
                    onPositionChange={handlePositionChange}
                    onToggle={(modelName, isEnabled, reason) => onToggle(endpoint, modelName, isEnabled, reason)}
                    onReset={(modelName) => onReset(endpoint, modelName)}
                    onSetDefault={handleSetDefault}
                    isLoading={isLoading}
                  />
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface EndpointSectionProps {
  endpoint: string;
  data: TEndpointModelsResponse;
  searchTerm: string;
  filterStatus: string;
  quickFilter: string;
  reasonSearch: string;
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
  quickFilter,
  reasonSearch,
  onBulkUpdate,
  onToggle,
  onReset,
  isLoading,
}) => {
  const localize = useLocalize();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'position', direction: 'asc' });
  const [localModels, setLocalModels] = useState<TModelWithAdminStatus[]>([]);
  // Use ref to avoid stale closure in handleDragEnd
  const localModelsRef = useRef<TModelWithAdminStatus[]>([]);

  useEffect(() => {
    setLocalModels(data.models);
    localModelsRef.current = data.models;
  }, [data.models]);

  const config = ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS] || {
    displayName: endpoint,
    description: '',
    color: 'bg-surface-secondary text-text-primary',
  };

  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortModels = useCallback((models: TModelWithAdminStatus[]) => {
    return [...models].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.column) {
        case 'modelName':
          comparison = a.modelName.localeCompare(b.modelName);
          break;
        case 'status':
          comparison = (a.isEnabled === b.isEnabled) ? 0 : a.isEnabled ? -1 : 1;
          break;
        case 'disabledAt':
          const dateA = a.disabledAt ? new Date(a.disabledAt).getTime() : 0;
          const dateB = b.disabledAt ? new Date(b.disabledAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'position':
          // Priority 1: Default model always at top
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;

          // Priority 2: Position
          const posA = a.position ?? Number.MAX_SAFE_INTEGER;
          const posB = b.position ?? Number.MAX_SAFE_INTEGER;
          comparison = posA - posB;
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortConfig]);

  const filteredModels = useMemo(() => {
    let result = localModels;

    // Search filter
    if (searchTerm) {
      result = result.filter((model) =>
        model.modelName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus === 'enabled') {
      result = result.filter((model) => model.isEnabled);
    } else if (filterStatus === 'disabled') {
      result = result.filter((model) => !model.isEnabled);
    }

    // Quick filters
    if (quickFilter === 'enabled') {
      result = result.filter((model) => model.isEnabled);
    } else if (quickFilter === 'disabled') {
      result = result.filter((model) => !model.isEnabled);
    } else if (quickFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(
        (model) => model.disabledAt && new Date(model.disabledAt) >= sevenDaysAgo
      );
    } else if (quickFilter === 'hasReason') {
      result = result.filter((model) => !!model.reason);
    }

    // Reason search filter
    if (reasonSearch) {
      result = result.filter(
        (model) => model.reason?.toLowerCase().includes(reasonSearch.toLowerCase())
      );
    }

    // Apply sorting only if not dragging (handled by localModels order)
    // But we want to allow sorting by columns too.
    // If sortConfig is default (modelName asc), we might want to respect position.
    // But backend sends sorted by position.
    // So initial load is sorted by position.
    // If user clicks sort, we sort.
    // If user drags, we update localModels and position.

    return sortModels(result);
  }, [localModels, searchTerm, filterStatus, quickFilter, reasonSearch, sortModels]);

  const enabledCount = filteredModels.filter((m) => m.isEnabled).length;
  const disabledCount = filteredModels.filter((m) => !m.isEnabled).length;
  const isFiltered = searchTerm !== '' || filterStatus !== 'all' || quickFilter !== 'all' || reasonSearch !== '';

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    const dragModel = localModelsRef.current[dragIndex];
    const newModels = [...localModelsRef.current];
    newModels.splice(dragIndex, 1);
    newModels.splice(hoverIndex, 0, dragModel);
    setLocalModels(newModels);
    localModelsRef.current = newModels;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (isFiltered) return;

    // Read from ref to get the LATEST state after all drag operations
    const currentModels = localModelsRef.current;
    const updates = currentModels.map((model, index) => ({
      modelName: model.modelName,
      isEnabled: model.isEnabled,
      position: index,
    }));
    onBulkUpdate(endpoint, updates);
  }, [endpoint, onBulkUpdate, isFiltered]);

  // We need to trigger handleDragEnd when drag ends.
  // But ModelRow's useDrag end callback is inside ModelRow.
  // We can pass a onDragEnd prop to ModelRow.
  // But wait, useDrag end is called on the item being dragged.
  // I'll add onDragEnd to ModelRowProps and call it.

  const handleSetDefault = useCallback((modelName: string) => {
    onBulkUpdate(endpoint, [{ modelName, isEnabled: true, isDefault: true }]);
  }, [endpoint, onBulkUpdate]);

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
  }, [selectedModels, onBulkUpdate, endpoint, localize]);

  const handleSelectAllDisabled = useCallback(() => {
    const disabledModels = filteredModels.filter((m) => !m.isEnabled).map((m) => m.modelName);
    setSelectedModels(new Set(disabledModels));
  }, [filteredModels]);

  const handleSelectAllEnabled = useCallback(() => {
    const enabledModels = filteredModels.filter((m) => m.isEnabled).map((m) => m.modelName);
    setSelectedModels(new Set(enabledModels));
  }, [filteredModels]);

  const handleSelectFiltered = useCallback(() => {
    setSelectedModels(new Set(filteredModels.map((m) => m.modelName)));
  }, [filteredModels]);

  if (filteredModels.length === 0) {
    return null;
  }

  return (
    <div className="admin-card p-6 mb-4">
      <div className="pb-4">
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-[var(--admin-row-hover)] rounded-lg p-2 -m-2 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? <ChevronUp className="h-4 w-4 admin-text-secondary" /> : <ChevronDown className="h-4 w-4 admin-text-secondary" />}
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--admin-bg-elevated)] admin-text-primary border border-[var(--admin-border-subtle)]">
                {config.displayName}
              </div>
            </div>
            <div className="text-sm admin-text-secondary">
              {config.description}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm admin-text-secondary">
              <span className="admin-success font-medium">{enabledCount}</span> {localize('com_admin_enabled').toLowerCase()},
              <span className="admin-danger font-medium ml-1">{disabledCount}</span> {localize('com_admin_disabled').toLowerCase()}
            </div>
            {selectedModels.size > 0 && isExpanded && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBulkActions(!showBulkActions);
                }}
                variant="outline"
                size="sm"
                className="admin-btn-secondary"
              >
                <Settings className="h-3 w-3 mr-1" />
                {localize('com_admin_bulk_actions')} ({selectedModels.size})
              </Button>
            )}
          </div>
        </div>

        {showBulkActions && isExpanded && (
          <div className="mt-4 p-4 bg-[var(--admin-bg-elevated)] rounded-lg space-y-3 border border-[var(--admin-border-subtle)]">
            {selectedModels.size > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium admin-text-primary">
                  {localize('com_admin_bulk_actions_for_models').replace('{{count}}', selectedModels.size.toString())}
                </span>
                <Button
                  onClick={handleBulkEnable}
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  className="admin-btn-primary"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {localize('com_admin_enable_all')}
                </Button>
                <Button
                  onClick={handleBulkDisable}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  {localize('com_admin_disable_all')}
                </Button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm admin-text-secondary">
                {localize('com_admin_model_quick_select')}:
              </span>
              <Button onClick={handleSelectAllDisabled} variant="outline" size="sm" className="admin-btn-secondary">
                {localize('com_admin_model_select_all_disabled')}
              </Button>
              <Button onClick={handleSelectAllEnabled} variant="outline" size="sm" className="admin-btn-secondary">
                {localize('com_admin_model_select_all_enabled')}
              </Button>
              <Button onClick={handleSelectFiltered} variant="outline" size="sm" className="admin-btn-secondary">
                {localize('com_admin_model_select_filtered')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
          {/* Results Count */}
          {(searchTerm || filterStatus !== 'all' || quickFilter !== 'all' || reasonSearch) && (
            <div className="mb-3 text-sm admin-text-secondary">
              {localize('com_admin_model_showing_count')
                .replace('{{shown}}', filteredModels.length.toString())
                .replace('{{total}}', data.models.length.toString())}
            </div>
          )}
          {/* Check if we should group by provider */}
          {shouldGroupByProvider(endpoint) ? (
            <div className="space-y-3">
              {Object.entries(groupModelsByProvider(filteredModels)).map(([provider, providerModels]) => (
                <ProviderGroup
                  key={provider}
                  endpoint={endpoint}
                  provider={provider}
                  models={providerModels}
                  onBulkUpdate={onBulkUpdate}
                  onToggle={onToggle}
                  onReset={onReset}
                  isLoading={isLoading}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table table-fixed">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-auto" />
                  <col className="w-24" />
                  <col className="w-32" />
                  <col className="w-48" />
                  <col className="w-40" />
                  <col className="w-32" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedModels.size === filteredModels.length && filteredModels.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-border-light"
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => handleSort('modelName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{localize('com_admin_model_name')}</span>
                        {sortConfig.column === 'modelName' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                      {localize('com_admin_default')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{localize('com_admin_status')}</span>
                        {sortConfig.column === 'status' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                      {localize('com_admin_reason')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => handleSort('disabledAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{localize('com_admin_disabled_at')}</span>
                        {sortConfig.column === 'disabledAt' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                      {localize('com_admin_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model, index) => (
                    <React.Fragment key={model.modelName}>
                      <ModelRow
                        model={model}
                        index={index}
                        moveRow={moveRow}
                        onDragEnd={handleDragEnd}
                        onToggle={(modelName, isEnabled, reason) => onToggle(endpoint, modelName, isEnabled, reason)}
                        onReset={(modelName) => onReset(endpoint, modelName)}
                        onSetDefault={handleSetDefault}
                        isLoading={isLoading}
                        isFiltered={isFiltered}
                      />
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [reasonSearch, setReasonSearch] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load filter preferences from localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('adminModelFilters');
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        if (filters.selectedEndpoint) setSelectedEndpoint(filters.selectedEndpoint);
        if (filters.filterStatus) setFilterStatus(filters.filterStatus);
        if (filters.quickFilter) setQuickFilter(filters.quickFilter);
      }
    } catch (error) {
      console.error('Failed to load filter preferences:', error);
    }
  }, []);

  // Save filter preferences to localStorage
  useEffect(() => {
    try {
      const filters = { selectedEndpoint, filterStatus, quickFilter };
      localStorage.setItem('adminModelFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filter preferences:', error);
    }
  }, [selectedEndpoint, filterStatus, quickFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setQuickFilter('all');
    setReasonSearch('');
    setSelectedEndpoint('all');
  }, []);

  const activeFilterCount = [
    searchTerm !== '',
    filterStatus !== 'all',
    quickFilter !== 'all',
    reasonSearch !== '',
    selectedEndpoint !== 'all',
  ].filter(Boolean).length;

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
        message: localize('com_admin_model_toggle_success').replace('{{ modelName }}', modelName).replace('{{ action }}', isEnabled ? localize('com_admin_enabled').toLowerCase() : localize('com_admin_disabled').toLowerCase()),
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
        message: localize('com_admin_bulk_update_success').replace('{{ successful }}', result.result.successful.toString()).replace('{{ failed }}', result.result.failed.toString()),
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
        message: localize('com_admin_model_reset_success').replace('{{ modelName }}', modelName),
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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Page Header Card */}
        <div className="admin-header-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="admin-header-icon">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h1 className="admin-header-title">
                  {localize('com_admin_model_control')}
                </h1>
                <p className="admin-header-description mt-1">
                  {localize('com_admin_model_control_description')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleClearCache}
                variant="outline"
                disabled={clearCacheMutation.isLoading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--admin-header-icon-bg)] border border-[var(--admin-header-icon-bg)] px-4 py-2 text-sm font-medium text-[var(--admin-header-text)] transition-all hover:opacity-80"
              >
                {clearCacheMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {localize('com_admin_clear_cache')}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {statsData?.stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="admin-stats-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{localize('com_admin_total_models')}</p>
                  <p className="stat-value mt-2">{statsData.stats.totalModels}</p>
                </div>
                <div className="stat-icon">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="admin-stats-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{localize('com_admin_enabled')}</p>
                  <p className="stat-value mt-2 admin-success">{statsData.stats.totalEnabled}</p>
                </div>
                <div className="admin-success-bg p-2.5 rounded-lg">
                  <CheckCircle className="h-5 w-5 admin-success" />
                </div>
              </div>
            </div>
            <div className="admin-stats-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{localize('com_admin_disabled')}</p>
                  <p className="stat-value mt-2 admin-danger">{statsData.stats.totalDisabled}</p>
                </div>
                <div className="admin-danger-bg p-2.5 rounded-lg">
                  <EyeOff className="h-5 w-5 admin-danger" />
                </div>
              </div>
            </div>
            <div className="admin-stats-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{localize('com_admin_endpoints')}</p>
                  <p className="stat-value mt-2">{statsData.stats.totalEndpoints}</p>
                </div>
                <div className="stat-icon">
                  <Settings className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Default Model Info Card */}
        {(() => {
          // Find default model across all endpoints
          const defaultModel = endpointQueries
            .filter(({ query }) => !query.isLoading && query.data?.models)
            .flatMap(({ query }) => query.data?.models || [])
            .find((m: TModelWithAdminStatus) => m.isDefault);

          if (!defaultModel) return null;

          return (
            <div className="admin-card p-5">
              <div className="flex items-start gap-4">
                <div className="stat-icon p-3">
                  <Info className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold admin-text-primary">
                    {localize('com_admin_default_model')}
                  </h3>
                  <p className="mt-1 text-sm admin-text-secondary">
                    {localize('com_admin_default_model_description')}
                  </p>
                  <div className="flex items-center gap-3 mt-3 p-3 bg-[var(--admin-bg-elevated)] rounded-lg border border-[var(--admin-border-subtle)]">
                    <div className="stat-icon p-2">
                      <Brain className="h-4 w-4" />
                    </div>
                    <span className="font-semibold admin-text-primary">
                      {defaultModel.modelName}
                    </span>
                    <span className={`admin-badge ${defaultModel.isEnabled
                      ? 'admin-badge-success'
                      : 'admin-badge-danger'
                      }`}>
                      {defaultModel.isEnabled ? localize('com_admin_enabled') : localize('com_admin_disabled')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}


        {/* Filters */}
        <div className="admin-card p-5 space-y-4">
          {/* Search and Basic Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 admin-text-secondary" />
                <Input
                  placeholder={localize('com_admin_search_models')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-[var(--admin-bg-surface)] border-[var(--admin-border-muted)] admin-text-primary"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-[var(--admin-border-muted)] rounded-md bg-[var(--admin-bg-surface)] admin-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--admin-border-active)]"
              >
                <option value="all">{localize('com_admin_all_models')}</option>
                <option value="enabled">{localize('com_admin_enabled_models')}</option>
                <option value="disabled">{localize('com_admin_disabled_models')}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 admin-text-secondary" />
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="px-3 py-2 border border-[var(--admin-border-muted)] rounded-md bg-[var(--admin-bg-surface)] admin-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--admin-border-active)]"
              >
                <option value="all">{localize('com_admin_all_endpoints')}</option>
                {Object.entries(ENDPOINT_CONFIGS).map(([endpoint, config]) => (
                  <option key={endpoint} value={endpoint}>
                    {config.displayName}
                  </option>
                ))}
              </select>
              {activeFilterCount > 0 && (
                <Button onClick={handleClearFilters} variant="outline" size="sm" className="admin-btn-secondary">
                  <X className="h-3 w-3 mr-1" />
                  {localize('com_admin_model_clear_filters')} ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm admin-text-secondary">{localize('com_admin_model_quick_filters')}:</span>
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${quickFilter === 'all'
                ? 'bg-[var(--admin-bg-elevated)] admin-text-primary border border-[var(--admin-border-muted)]'
                : 'bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)]'
                }`}
            >
              {localize('com_admin_model_filter_all')}
            </button>
            <button
              onClick={() => setQuickFilter('enabled')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${quickFilter === 'enabled'
                ? 'admin-success-bg admin-success border border-[var(--admin-success)]'
                : 'bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)]'
                }`}
            >
              <Eye className="h-3 w-3 inline mr-1" />
              {localize('com_admin_model_filter_enabled')}
            </button>
            <button
              onClick={() => setQuickFilter('disabled')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${quickFilter === 'disabled'
                ? 'admin-danger-bg admin-danger border border-[var(--admin-danger)]'
                : 'bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)]'
                }`}
            >
              <EyeOff className="h-3 w-3 inline mr-1" />
              {localize('com_admin_model_filter_disabled')}
            </button>
            <button
              onClick={() => setQuickFilter('recent')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${quickFilter === 'recent'
                ? 'admin-warning-bg admin-warning border border-[var(--admin-warning)]'
                : 'bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)]'
                }`}
            >
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {localize('com_admin_model_filter_recent')}
            </button>
            <button
              onClick={() => setQuickFilter('hasReason')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${quickFilter === 'hasReason'
                ? 'admin-info-bg admin-info border border-[var(--admin-info)]'
                : 'bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)]'
                }`}
            >
              <MessageSquare className="h-3 w-3 inline mr-1" />
              {localize('com_admin_model_filter_has_reason')}
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--admin-bg-surface)] admin-text-secondary hover:bg-[var(--admin-row-hover)] transition-colors"
            >
              <Settings className="h-3 w-3 inline mr-1" />
              {localize('com_admin_model_advanced_filters')}
              {showAdvancedFilters ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />}
            </button>
          </div>

          {/* Advanced Filters */}
          {
            showAdvancedFilters && (
              <div className="pt-4 border-t border-[var(--admin-border-subtle)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium admin-text-primary mb-2">
                      {localize('com_admin_model_search_reason')}
                    </label>
                    <Input
                      placeholder={localize('com_admin_model_search_reason_placeholder')}
                      value={reasonSearch}
                      onChange={(e) => setReasonSearch(e.target.value)}
                      className="bg-[var(--admin-bg-surface)] border-[var(--admin-border-muted)] admin-text-primary"
                    />
                  </div>
                </div>
              </div>
            )
          }
        </div >

        {/* Model Lists by Endpoint */}
        < div className="space-y-6" >
          {
            relevantQueries.length === 0 ? (
              <div className="admin-card">
                <div className="admin-empty-state">
                  <div className="admin-empty-state-icon">
                    <Brain />
                  </div>
                  <h3 className="admin-empty-state-title">
                    {localize('com_admin_no_models')}
                  </h3>
                  <p className="admin-empty-state-description">
                    {localize('com_admin_no_models_description')}
                  </p>
                </div>
              </div>
            ) : (
              relevantQueries.map(({ endpoint, query }) => {
                if (query.isLoading) {
                  return (
                    <div key={endpoint} className="admin-card">
                      <div className="admin-loading">
                        <div className="admin-loading-spinner" />
                        <p className="admin-loading-text">
                          {localize('com_admin_loading_models').replace('{{endpoint}}', ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS]?.displayName || endpoint)}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (query.error) {
                  return (
                    <div key={endpoint} className="admin-card">
                      <div className="admin-empty-state">
                        <div className="admin-empty-state-icon admin-danger-bg">
                          <AlertTriangle className="admin-danger" />
                        </div>
                        <p className="admin-empty-state-title admin-danger">
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
                      quickFilter={quickFilter}
                      reasonSearch={reasonSearch}
                      onBulkUpdate={handleBulkUpdate}
                      onToggle={handleToggleModel}
                      onReset={handleResetModel}
                      isLoading={isLoading}
                    />
                  );
                }

                return null;
              })
            )
          }
        </div >
      </div >
    </DndProvider >
  );
};

export default ModelControlPanel;