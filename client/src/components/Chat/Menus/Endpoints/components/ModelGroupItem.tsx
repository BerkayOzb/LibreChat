import React from 'react';
import type { Endpoint, ModelGroup } from '~/common';
import { CustomMenu as Menu } from '../CustomMenu';
import { EndpointModelItem } from './EndpointModelItem';

interface ModelGroupItemProps {
  group: ModelGroup;
  endpoint: Endpoint;
  selectedModel: string | null;
}

export function ModelGroupItem({ group, endpoint, selectedModel }: ModelGroupItemProps) {
  return (
    <Menu
      id={`model-group-${endpoint.value}-${group.provider}`}
      key={`model-group-${group.provider}`}
      className="transition-opacity duration-200 ease-in-out"
      label={
        <div className="flex w-full items-center gap-2 px-1 py-1">
          <span className="truncate text-left">{group.displayName || group.provider}</span>
          <span className="ml-auto text-xs opacity-60">{group.models.length}</span>
        </div>
      }
    >
      {group.models.map((model) => (
        <EndpointModelItem
          key={model.name}
          modelId={model.name}
          endpoint={endpoint}
          isSelected={selectedModel === model.name}
        />
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
