import React, { useMemo, useCallback } from 'react';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import {
  Permissions,
  alternateName,
  EModelEndpoint,
  PermissionTypes,
} from 'librechat-data-provider';
import type {
  TEndpointsConfig,
  TAssistantsMap,
  TStartupConfig,
  Assistant,
  Agent,
} from 'librechat-data-provider';
import type { Endpoint, ModelGroup } from '~/common';
import { mapEndpoints, getIconKey, getEndpointField } from '~/utils';
import { useGetEndpointsQuery, useGetProviderOrder } from '~/data-provider';
import { useHasAccess } from '~/hooks';
import { icons } from './Icons';
import { PROVIDER_DISPLAY_NAMES } from '~/constants/providerNames';

// Utility to group models by provider prefix with custom ordering and alphabetic sorting
const groupModelsByProvider = (models: string[], providerOrder?: string[]): ModelGroup[] => {
  const groups: Record<string, string[]> = {};

  // Group models by provider
  models.forEach(modelName => {
    const slashIndex = modelName.indexOf('/');
    if (slashIndex > 0) {
      const provider = modelName.substring(0, slashIndex);
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(modelName);
    }
  });

  // Sort models within each group alphabetically
  Object.keys(groups).forEach(provider => {
    groups[provider].sort((a, b) => a.localeCompare(b));
  });

  // Convert to ModelGroup array
  const modelGroups: ModelGroup[] = Object.entries(groups).map(([provider, modelNames]) => ({
    provider,
    models: modelNames.map(name => ({ name, isGlobal: false })),
    displayName: PROVIDER_DISPLAY_NAMES[provider] || provider.charAt(0).toUpperCase() + provider.slice(1),
  }));

  // Apply custom ordering if provided
  if (providerOrder && providerOrder.length > 0) {
    const ordered: ModelGroup[] = [];
    const remaining: ModelGroup[] = [];

    // First, add groups in custom order
    providerOrder.forEach(providerId => {
      const group = modelGroups.find(g => g.provider === providerId);
      if (group) {
        ordered.push(group);
      }
    });

    // Then, add remaining groups alphabetically by displayName
    modelGroups.forEach(group => {
      if (!providerOrder.includes(group.provider)) {
        remaining.push(group);
      }
    });
    remaining.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

    return [...ordered, ...remaining];
  }

  // No custom order - return alphabetically sorted by displayName
  return modelGroups.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
};

// Check if endpoint should use grouped models
const shouldGroupModels = (endpointValue: string): boolean => {
  // For now, only OpenRouter uses grouped display
  return endpointValue === 'OpenRouter' || endpointValue === 'AI Models' || endpointValue === 'openrouter';
};

export const useEndpoints = ({
  agents,
  assistantsMap,
  endpointsConfig,
  startupConfig,
  excludeAgents = false,
}: {
  agents?: Agent[] | null;
  assistantsMap?: TAssistantsMap;
  endpointsConfig: TEndpointsConfig;
  startupConfig: TStartupConfig | undefined;
  excludeAgents?: boolean;
}) => {
  const modelsQuery = useGetModelsQuery();
  const { data: endpoints = [] } = useGetEndpointsQuery({ select: mapEndpoints });

  // Fetch provider display order for AI Models endpoint
  const { data: providerOrderData } = useGetProviderOrder('AI Models', {
    enabled: endpoints.includes('AI Models' as EModelEndpoint),
  });

  const interfaceConfig = startupConfig?.interface ?? {};
  const includedEndpoints = useMemo(
    () => new Set(startupConfig?.modelSpecs?.addedEndpoints ?? []),
    [startupConfig?.modelSpecs?.addedEndpoints],
  );

  const hasAgentAccess = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });

  const assistants: Assistant[] = useMemo(
    () => Object.values(assistantsMap?.[EModelEndpoint.assistants] ?? {}),
    [assistantsMap],
  );

  const azureAssistants: Assistant[] = useMemo(
    () => Object.values(assistantsMap?.[EModelEndpoint.azureAssistants] ?? {}),
    [assistantsMap],
  );

  const filteredEndpoints = useMemo(() => {
    if (!interfaceConfig.modelSelect) {
      return [];
    }
    const result: EModelEndpoint[] = [];
    for (let i = 0; i < endpoints.length; i++) {
      // Filter out agents endpoint if user doesn't have access or if explicitly excluded
      if (endpoints[i] === EModelEndpoint.agents && (!hasAgentAccess || excludeAgents)) {
        continue;
      }
      // Filter out deprecated gptPlugins endpoint from model selector
      if (endpoints[i] === EModelEndpoint.gptPlugins) {
        continue;
      }
      if (includedEndpoints.size > 0 && !includedEndpoints.has(endpoints[i])) {
        continue;
      }
      result.push(endpoints[i]);
    }

    return result;
  }, [endpoints, hasAgentAccess, includedEndpoints, interfaceConfig.modelSelect, excludeAgents]);

  const endpointRequiresUserKey = useCallback(
    (ep: string) => {
      return !!getEndpointField(endpointsConfig, ep, 'userProvide');
    },
    [endpointsConfig],
  );

  const mappedEndpoints: Endpoint[] = useMemo(() => {
    return filteredEndpoints.map((ep) => {
      const endpointType = getEndpointField(endpointsConfig, ep, 'type');
      const iconKey = getIconKey({ endpoint: ep, endpointsConfig, endpointType });
      const Icon = icons[iconKey];
      const endpointIconURL = getEndpointField(endpointsConfig, ep, 'iconURL');
      const hasModels =
        (ep === EModelEndpoint.agents && (agents?.length ?? 0) > 0) ||
        (ep === EModelEndpoint.assistants && assistants?.length > 0) ||
        (ep !== EModelEndpoint.assistants &&
          ep !== EModelEndpoint.agents &&
          (modelsQuery.data?.[ep]?.length ?? 0) > 0);

      // Base result object with formatted default icon
      const result: Endpoint = {
        value: ep,
        label: alternateName[ep] || ep,
        hasModels,
        icon: Icon
          ? React.createElement(Icon as React.ComponentType<any>, {
              size: 20,
              className: 'text-text-primary shrink-0 icon-md',
              iconURL: endpointIconURL,
              endpoint: ep,
            })
          : null,
      };

      // Handle agents case
      if (ep === EModelEndpoint.agents && (agents?.length ?? 0) > 0) {
        result.models = agents?.map((agent) => ({
          name: agent.id,
          isGlobal: agent.isPublic ?? false,
        }));
        result.agentNames = agents?.reduce((acc, agent) => {
          acc[agent.id] = agent.name || '';
          return acc;
        }, {});
        result.modelIcons = agents?.reduce((acc, agent) => {
          acc[agent.id] = agent?.avatar?.filepath;
          return acc;
        }, {});
      }

      // Handle assistants case
      else if (ep === EModelEndpoint.assistants && assistants.length > 0) {
        result.models = assistants.map((assistant: { id: string }) => ({
          name: assistant.id,
          isGlobal: false,
        }));
        result.assistantNames = assistants.reduce(
          (acc: Record<string, string>, assistant: Assistant) => {
            acc[assistant.id] = assistant.name || '';
            return acc;
          },
          {},
        );
        result.modelIcons = assistants.reduce(
          (acc: Record<string, string | undefined>, assistant: Assistant) => {
            acc[assistant.id] = assistant.metadata?.avatar;
            return acc;
          },
          {},
        );
      } else if (ep === EModelEndpoint.azureAssistants && azureAssistants.length > 0) {
        result.models = azureAssistants.map((assistant: { id: string }) => ({
          name: assistant.id,
          isGlobal: false,
        }));
        result.assistantNames = azureAssistants.reduce(
          (acc: Record<string, string>, assistant: Assistant) => {
            acc[assistant.id] = assistant.name || '';
            return acc;
          },
          {},
        );
        result.modelIcons = azureAssistants.reduce(
          (acc: Record<string, string | undefined>, assistant: Assistant) => {
            acc[assistant.id] = assistant.metadata?.avatar;
            return acc;
          },
          {},
        );
      }

      // For other endpoints with models from the modelsQuery
      else if (
        ep !== EModelEndpoint.agents &&
        ep !== EModelEndpoint.assistants &&
        (modelsQuery.data?.[ep]?.length ?? 0) > 0
      ) {
        const modelNames = modelsQuery.data?.[ep] || [];

        // Check if this endpoint should use grouped models
        if (shouldGroupModels(ep)) {
          // Get provider order for this endpoint if it's AI Models
          const providerOrder = shouldGroupModels(ep) && providerOrderData?.endpoint === ep
            ? providerOrderData?.providerDisplayOrder
            : undefined;

          result.groupedModels = groupModelsByProvider(modelNames, providerOrder);
          // Keep flat models for backward compatibility and search
          result.models = modelNames.map((model) => ({
            name: model,
            isGlobal: false,
          }));
        } else {
          // Standard flat model list
          result.models = modelNames.map((model) => ({
            name: model,
            isGlobal: false,
          }));
        }
      }

      return result;
    });
  }, [filteredEndpoints, endpointsConfig, modelsQuery.data, agents, assistants, azureAssistants, providerOrderData]);

  return {
    mappedEndpoints,
    endpointRequiresUserKey,
  };
};

export default useEndpoints;
