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
      <div className="flex h-full items-center justify-center">
        <div className="text-text-secondary">{localize('com_ui_loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-tertiary">
              <ListOrdered className="h-6 w-6 text-text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {localize('com_admin_provider_ordering_title') || 'Provider Display Ordering'}
              </h1>
              <p className="text-sm text-text-secondary">
                {localize('com_admin_provider_ordering_subtitle') ||
                  'Configure how model provider groups are displayed in the model selector. Drag providers to reorder them.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-surface-tertiary p-2">
            <ListOrdered className="h-4 w-4 text-text-primary" />
          </div>
          <div className="text-sm text-text-secondary">
            {localize('com_admin_endpoint') || 'Endpoint'}: <span className="font-medium text-text-primary">{endpoint}</span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {providers.map((provider, index) => (
          <div
            key={provider.id}
            className="flex items-center gap-4 rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {/* Grip Icon */}
            <div className="cursor-grab rounded-lg bg-surface-tertiary p-2">
              <GripVertical className="h-4 w-4 text-text-tertiary" />
            </div>

            {/* Provider Name */}
            <div className="flex-1">
              <div className="font-semibold text-text-primary">{provider.displayName}</div>
              <div className="text-xs text-text-tertiary">{provider.id}</div>
            </div>

            {/* Order Number */}
            <div className="flex items-center justify-center rounded-lg bg-surface-tertiary px-3 py-1">
              <span className="text-sm font-medium text-text-primary">#{provider.order + 1}</span>
            </div>

            {/* Move Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0 || isSaving}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_up') || 'Move up'}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === providers.length - 1 || isSaving}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_down') || 'Move down'}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm sm:flex-row sm:justify-end">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-medium px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          {localize('com_admin_provider_reset_order') || 'Reset to Default'}
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-text-primary px-4 py-2.5 text-sm font-medium text-surface-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
