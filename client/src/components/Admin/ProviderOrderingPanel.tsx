import { useState, useEffect, useCallback } from 'react';
import { GripVertical, ChevronUp, ChevronDown, RotateCcw, Save, ListOrdered } from 'lucide-react';
import { useGetProviderOrder, useUpdateProviderOrderMutation } from '~/data-provider';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { PROVIDER_DISPLAY_NAMES } from '~/constants/providerNames';

interface ProviderInfo {
  id: string;
  displayName: string;
  order: number;
}

const DEFAULT_PROVIDER_ORDER = ['openai', 'anthropic', 'meta-llama', 'google', 'mistralai', 'qwen'];

export default function ProviderOrderingPanel() {
  const localize = useLocalize();
  const { showToast } = useToastContext();

  const endpoint = 'AI Models';
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current provider order
  const { data: providerOrderData, isLoading, refetch } = useGetProviderOrder(endpoint);
  const updateProviderOrderMutation = useUpdateProviderOrderMutation();

  // Initialize providers from API data or defaults
  useEffect(() => {
    if (providerOrderData?.providerDisplayOrder) {
      const providerList: ProviderInfo[] = providerOrderData.providerDisplayOrder.map((id, index) => ({
        id,
        displayName: PROVIDER_DISPLAY_NAMES[id] || id.charAt(0).toUpperCase() + id.slice(1),
        order: index,
      }));
      setProviders(providerList);
      setHasChanges(false);
    } else if (!isLoading) {
      // Use defaults if no data
      const providerList: ProviderInfo[] = DEFAULT_PROVIDER_ORDER.map((id, index) => ({
        id,
        displayName: PROVIDER_DISPLAY_NAMES[id] || id.charAt(0).toUpperCase() + id.slice(1),
        order: index,
      }));
      setProviders(providerList);
    }
  }, [providerOrderData, isLoading]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setProviders(prev => {
      const newProviders = [...prev];
      [newProviders[index - 1], newProviders[index]] = [newProviders[index], newProviders[index - 1]];
      return newProviders.map((p, i) => ({ ...p, order: i }));
    });
    setHasChanges(true);
  }, []);

  const moveDown = useCallback((index: number) => {
    setProviders(prev => {
      if (index === prev.length - 1) return prev;
      const newProviders = [...prev];
      [newProviders[index], newProviders[index + 1]] = [newProviders[index + 1], newProviders[index]];
      return newProviders.map((p, i) => ({ ...p, order: i }));
    });
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const providerOrder = providers.map(p => p.id);

      await updateProviderOrderMutation.mutateAsync({
        endpoint,
        providerDisplayOrder: providerOrder,
      });

      showToast({
        message: localize('com_admin_provider_order_updated') || 'Provider order updated successfully',
        status: 'success',
      });

      setHasChanges(false);
      refetch();
    } catch (error) {
      showToast({
        message: localize('com_admin_provider_order_error') || 'Failed to update provider order',
        status: 'error',
      });
      console.error('Failed to update provider order:', error);
    } finally {
      setIsSaving(false);
    }
  }, [providers, endpoint, updateProviderOrderMutation, showToast, localize, refetch]);

  const handleReset = useCallback(async () => {
    try {
      setIsSaving(true);

      await updateProviderOrderMutation.mutateAsync({
        endpoint,
        providerDisplayOrder: DEFAULT_PROVIDER_ORDER,
      });

      showToast({
        message: localize('com_admin_provider_order_reset') || 'Provider order reset to default',
        status: 'success',
      });

      setHasChanges(false);
      refetch();
    } catch (error) {
      showToast({
        message: localize('com_admin_provider_order_error') || 'Failed to reset provider order',
        status: 'error',
      });
      console.error('Failed to reset provider order:', error);
    } finally {
      setIsSaving(false);
    }
  }, [endpoint, updateProviderOrderMutation, showToast, localize, refetch]);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">{localize('com_ui_loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Page Header Card */}
      <div className="admin-header-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <ListOrdered className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="admin-header-title">
                {localize('com_admin_provider_ordering_title') || 'Provider Display Ordering'}
              </h1>
              <p className="admin-header-description mt-1">
                {localize('com_admin_provider_ordering_subtitle') ||
                  'Configure how model provider groups are displayed in the model selector. Drag providers to reorder them.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="admin-card p-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div className="text-sm admin-text-secondary">
            {localize('com_admin_endpoint') || 'Endpoint'}: <span className="font-medium admin-text-primary">{endpoint}</span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {providers.map((provider, index) => (
          <div
            key={provider.id}
            className="admin-card flex items-center gap-4 p-4"
          >
            {/* Grip Icon */}
            <div className="cursor-grab rounded-lg bg-[var(--admin-bg-elevated)] p-2">
              <GripVertical className="h-4 w-4 admin-text-muted" />
            </div>

            {/* Provider Name */}
            <div className="flex-1">
              <div className="font-semibold admin-text-primary">{provider.displayName}</div>
              <div className="text-xs admin-text-muted">{provider.id}</div>
            </div>

            {/* Order Number */}
            <div className="flex items-center justify-center rounded-lg bg-[var(--admin-bg-elevated)] px-3 py-1">
              <span className="text-sm font-medium admin-text-primary">#{provider.order + 1}</span>
            </div>

            {/* Move Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0 || isSaving}
                className="rounded-lg p-2 admin-text-secondary transition-colors hover:bg-[var(--admin-bg-elevated)] hover:admin-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_up') || 'Move up'}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === providers.length - 1 || isSaving}
                className="rounded-lg p-2 admin-text-secondary transition-colors hover:bg-[var(--admin-bg-elevated)] hover:admin-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_down') || 'Move down'}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="admin-card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:justify-end">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="admin-btn-secondary w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          {localize('com_admin_provider_reset_order') || 'Reset to Default'}
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="admin-btn-primary w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? localize('com_ui_saving') || 'Saving...'
            : localize('com_admin_provider_save_order') || 'Save Order'}
        </button>
      </div>
    </div>
  );
}
