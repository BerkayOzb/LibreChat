import React, { useState, useEffect } from 'react';
import { Globe, Loader2, Check, AlertTriangle, KeyRound, ExternalLink } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useGetWebSearchConfig } from '~/data-provider/Admin/queries';
import { useUpdateWebSearchConfigMutation } from '~/data-provider/Admin/mutations';
import { useToastContext, Button } from '@librechat/client';

const PROVIDERS = [
  {
    id: 'searxng',
    nameKey: 'com_admin_provider_searxng',
    descriptionKey: 'com_admin_provider_searxng_description',
    models: ['default'],
    defaultModel: 'default',
    noApiKey: true, // SearXNG uses instance URL, not API key
  },
  {
    id: 'openai',
    nameKey: 'com_admin_provider_openai',
    descriptionKey: 'com_admin_provider_openai_description',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o',
  },
  {
    id: 'gemini',
    nameKey: 'com_admin_provider_gemini',
    descriptionKey: 'com_admin_provider_gemini_description',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
  },
  {
    id: 'anthropic',
    nameKey: 'com_admin_provider_anthropic',
    descriptionKey: 'com_admin_provider_anthropic_description',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    defaultModel: 'claude-3-5-sonnet-latest',
  },
];

const WebSearchProviderConfig: React.FC = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();

  const { data, isLoading, error } = useGetWebSearchConfig();
  const updateMutation = useUpdateWebSearchConfigMutation();

  const [selectedProvider, setSelectedProvider] = useState<string>('searxng');
  const [selectedModel, setSelectedModel] = useState<string>('default');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if provider has API key configured (or SearXNG URL)
  const hasApiKey = (providerId: string): boolean => {
    if (!data?.apiKeyAvailability) return false;
    return data.apiKeyAvailability[providerId as keyof typeof data.apiKeyAvailability] ?? false;
  };

  // Initialize from server data or smart defaults
  useEffect(() => {
    if (data?.config?.provider) {
      // If there's existing config, use it
      setSelectedProvider(data.config.provider);
      setSelectedModel(data.config.model);
    } else if (data?.apiKeyAvailability) {
      // No existing config - choose smart default based on availability
      // Priority: SearXNG (free) > OpenAI > Gemini > Anthropic
      if (data.apiKeyAvailability.searxng) {
        setSelectedProvider('searxng');
        setSelectedModel('default');
      } else if (data.apiKeyAvailability.openai) {
        setSelectedProvider('openai');
        setSelectedModel('gpt-4o');
      } else if (data.apiKeyAvailability.gemini) {
        setSelectedProvider('gemini');
        setSelectedModel('gemini-2.0-flash');
      } else if (data.apiKeyAvailability.anthropic) {
        setSelectedProvider('anthropic');
        setSelectedModel('claude-3-5-sonnet-latest');
      }
    }
  }, [data]);

  // Track changes
  useEffect(() => {
    if (data?.config) {
      const changed =
        selectedProvider !== data.config.provider ||
        selectedModel !== data.config.model;
      setHasChanges(changed);
    }
  }, [selectedProvider, selectedModel, data]);

  // Check if any provider has an API key
  const hasAnyApiKey = (): boolean => {
    if (!data?.apiKeyAvailability) return false;
    return Object.values(data.apiKeyAvailability).some(Boolean);
  };

  const handleProviderChange = (providerId: string) => {
    // Only allow selection if provider has API key
    if (!hasApiKey(providerId)) {
      showToast({
        message: localize('com_admin_web_search_no_api_key') || 'Please configure an API key for this provider first',
        status: 'warning',
      });
      return;
    }
    setSelectedProvider(providerId);
    // Set default model for the new provider
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setSelectedModel(provider.defaultModel);
    }
  };

  const handleSave = async () => {
    // Validate that selected provider has API key
    if (!hasApiKey(selectedProvider)) {
      showToast({
        message: localize('com_admin_web_search_no_api_key') || 'Please configure an API key for this provider first',
        status: 'error',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        provider: selectedProvider as 'searxng' | 'gemini' | 'openai' | 'anthropic',
        model: selectedModel,
      });
      showToast({
        message: localize('com_admin_web_search_config_saved') || 'Web search provider configuration saved',
        status: 'success',
      });
    } catch (err) {
      showToast({
        message: localize('com_admin_web_search_config_error') || 'Failed to save web search configuration',
        status: 'error',
      });
    }
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);

  if (isLoading) {
    return (
      <div className="admin-card p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin admin-text-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card p-5">
        <div className="flex items-center gap-3 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span>{localize('com_admin_error_loading') || 'Error loading configuration'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-blue-500/10 p-2.5">
          <Globe className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold admin-text-primary">
            {localize('com_admin_web_search_provider') || 'Web Search Provider'}
          </h3>
          <p className="text-sm admin-text-secondary">
            {localize('com_admin_web_search_provider_description') ||
              'Configure which AI provider handles web search requests'}
          </p>
        </div>
      </div>

      {/* Warning if no API keys configured */}
      {!hasAnyApiKey() && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {localize('com_admin_web_search_no_keys_title') || 'No API Keys Configured'}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                {localize('com_admin_web_search_no_keys_description') ||
                  'Please configure at least one API key to enable web search.'}
              </p>
              <a
                href="/d/admin/api-keys"
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {localize('com_admin_configure_api_keys') || 'Configure API Keys'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-3 mb-4">
        <label className="block text-sm font-medium admin-text-secondary">
          {localize('com_admin_select_provider') || 'Select Provider'}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PROVIDERS.map((provider) => {
            const isAvailable = hasApiKey(provider.id);
            const isSelected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                disabled={!isAvailable}
                className={`relative flex flex-col items-start rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : isAvailable
                      ? 'border-[var(--admin-border-muted)] hover:border-[var(--admin-border-active)] hover:bg-[var(--admin-bg-elevated)]'
                      : 'border-[var(--admin-border-muted)] opacity-50 cursor-not-allowed bg-[var(--admin-bg-muted)]'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-blue-500" />
                  </div>
                )}
                {!isAvailable && (
                  <div className="absolute right-2 top-2">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                  </div>
                )}
                <span className={`font-medium ${isAvailable ? 'admin-text-primary' : 'admin-text-muted'}`}>
                  {localize(provider.nameKey as any) || provider.id}
                </span>
                <span className="mt-1 text-xs admin-text-muted">
                  {localize(provider.descriptionKey as any) || ''}
                </span>
                {!isAvailable && (
                  <span className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {provider.id === 'searxng'
                      ? (localize('com_admin_instance_url_required') || 'Instance URL required')
                      : (localize('com_admin_api_key_required') || 'API key required')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection - hide for SearXNG as it doesn't use models */}
      {currentProvider && hasApiKey(selectedProvider) && selectedProvider !== 'searxng' && (
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium admin-text-secondary">
            {localize('com_admin_select_model') || 'Select Model'}
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border-muted)] bg-[var(--admin-bg-surface)] px-3 py-2 text-sm admin-text-primary focus:border-[var(--admin-border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-border-active)]"
          >
            {currentProvider.models.map((model) => (
              <option key={model} value={model}>
                {model}
                {model === currentProvider.defaultModel ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-4 rounded-lg bg-[var(--admin-bg-elevated)] p-3">
        <p className="text-xs admin-text-muted">
          <strong>{localize('com_admin_note') || 'Note'}:</strong>{' '}
          {localize('com_admin_web_search_api_key_note_updated') ||
            'API keys can be configured in the API Key Management section. Providers without configured API keys are disabled.'}
        </p>
        <a
          href="/d/admin/api-keys"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline mt-2"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {localize('com_admin_go_to_api_keys') || 'Go to API Key Management'}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isLoading || !hasApiKey(selectedProvider)}
          variant="default"
          size="sm"
          className={hasChanges && hasApiKey(selectedProvider) ? 'admin-btn-primary' : ''}
        >
          {updateMutation.isLoading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              {localize('com_admin_saving') || 'Saving...'}
            </>
          ) : (
            localize('com_admin_save_changes') || 'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default WebSearchProviderConfig;
