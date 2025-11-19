import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import debounce from 'lodash/debounce';
import type { Endpoint, ModelGroup } from '~/common';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetModelOrder, useUpdateModelOrderMutation } from '~/data-provider';
import { CustomMenu as Menu } from '../CustomMenu';
import { EndpointModelItem } from './EndpointModelItem';

interface ModelGroupItemProps {
  group: ModelGroup;
  endpoint: Endpoint;
  selectedModel: string | null;
}

export function ModelGroupItem({ group, endpoint, selectedModel }: ModelGroupItemProps) {
  const { user } = useAuthContext();
  const isAdmin = user?.role === SystemRoles.ADMIN;

  // Fetch current model order from database (all users need this to see admin's ordering)
  const { data: modelOrderData } = useGetModelOrder(
    endpoint.value,
    group.provider
  );

  // Mutation for updating model order
  const updateModelOrderMutation = useUpdateModelOrderMutation();

  // Local state for model ordering
  const [localModels, setLocalModels] = useState(group.models);

  // Update local state when group.models or modelOrderData changes
  useEffect(() => {
    if (modelOrderData?.modelDisplayOrder && modelOrderData.modelDisplayOrder.length > 0) {
      // Apply custom order from database
      const orderedModels = [...group.models].sort((a, b) => {
        const indexA = modelOrderData.modelDisplayOrder.indexOf(a.name);
        const indexB = modelOrderData.modelDisplayOrder.indexOf(b.name);

        // If both models are in the custom order, sort by their index
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // If only one is in custom order, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Otherwise, alphabetic sort for unlisted models
        return a.name.localeCompare(b.name);
      });

      setLocalModels(orderedModels);
    } else {
      // No custom order, use alphabetic sort
      const sortedModels = [...group.models].sort((a, b) => a.name.localeCompare(b.name));
      setLocalModels(sortedModels);
    }
  }, [group.models, modelOrderData]);

  // Debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce((models: typeof group.models) => {
        const modelDisplayOrder = models.map(m => m.name);
        updateModelOrderMutation.mutate({
          endpoint: endpoint.value,
          provider: group.provider,
          modelDisplayOrder,
        });
      }, 500),
    [endpoint.value, group.provider, updateModelOrderMutation],
  );

  // Move model up in order
  const moveUp = useCallback((index: number) => {
    if (index === 0) return;

    setLocalModels(prev => {
      const newModels = [...prev];
      [newModels[index - 1], newModels[index]] = [newModels[index], newModels[index - 1]];
      debouncedSave(newModels);
      return newModels;
    });
  }, [debouncedSave]);

  // Move model down in order
  const moveDown = useCallback((index: number) => {
    setLocalModels(prev => {
      if (index === prev.length - 1) return prev;

      const newModels = [...prev];
      [newModels[index], newModels[index + 1]] = [newModels[index + 1], newModels[index]];
      debouncedSave(newModels);
      return newModels;
    });
  }, [debouncedSave]);

  return (
    <Menu
      id={`model-group-${endpoint.value}-${group.provider}`}
      key={`model-group-${group.provider}`}
      className="transition-opacity duration-200 ease-in-out"
      label={
        <div className="flex w-full items-center gap-2 px-1 py-1">
          <span className="truncate text-left">{group.displayName || group.provider}</span>
          <span className="ml-auto text-xs opacity-60">{localModels.length}</span>
        </div>
      }
    >
      {localModels.map((model, index) => (
        <div key={model.name} className="flex items-center gap-1">
          <EndpointModelItem
            modelId={model.name}
            endpoint={endpoint}
            isSelected={selectedModel === model.name}
          />
          {isAdmin && (
            <div className="flex items-center gap-0.5 pr-2">
              <GripVertical className="h-4 w-4 text-gray-400 opacity-50" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveUp(index);
                }}
                disabled={index === 0}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-700"
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveDown(index);
                }}
                disabled={index === localModels.length - 1}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-700"
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ))}
    </Menu>
  );
}

export function renderModelGroups(
  endpoint: Endpoint,
  groups: ModelGroup[],
  selectedModel: string | null,
) {
  return groups.map((group) => (
    <ModelGroupItem
      key={`${endpoint.value}-${group.provider}`}
      group={group}
      endpoint={endpoint}
      selectedModel={selectedModel}
    />
  ));
}
