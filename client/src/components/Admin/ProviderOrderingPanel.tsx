import { useState, useEffect, useCallback } from 'react';
import { GripVertical, ChevronUp, ChevronDown, RotateCcw, Save } from 'lucide-react';
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          {localize('com_admin_provider_ordering_title') || 'Provider Display Ordering'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {localize('com_admin_provider_ordering_subtitle') ||
            'Configure how model provider groups are displayed in the model selector. Drag providers to reorder them.'}
        </p>
      </div>

      {/* Endpoint Info */}
      <div className="mb-4 rounded-md border border-border-light bg-surface-secondary p-3">
        <div className="text-sm text-text-secondary">
          {localize('com_admin_endpoint') || 'Endpoint'}: <span className="font-medium text-text-primary">{endpoint}</span>
        </div>
      </div>

      {/* Provider List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {providers.map((provider, index) => (
          <div
            key={provider.id}
            className="flex items-center gap-3 rounded-md border border-border-light bg-surface-primary p-4 transition-colors hover:bg-surface-secondary"
          >
            {/* Grip Icon */}
            <div className="cursor-grab text-text-tertiary">
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Provider Name */}
            <div className="flex-1">
              <div className="font-medium text-text-primary">{provider.displayName}</div>
              <div className="text-xs text-text-tertiary">{provider.id}</div>
            </div>

            {/* Order Number */}
            <div className="text-sm text-text-secondary">
              #{provider.order + 1}
            </div>

            {/* Move Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0 || isSaving}
                className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_up') || 'Move up'}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === providers.length - 1 || isSaving}
                className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title={localize('com_admin_move_down') || 'Move down'}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3 border-t border-border-light pt-4">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-md border border-border-medium px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {localize('com_admin_provider_reset_order') || 'Reset to Default'}
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
