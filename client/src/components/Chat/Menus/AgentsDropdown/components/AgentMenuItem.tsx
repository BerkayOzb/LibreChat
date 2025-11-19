import React from 'react';
import type { Agent } from 'librechat-data-provider';
import { CustomMenuItem as MenuItem } from '../../Endpoints/CustomMenu';
import { cn } from '~/utils';

interface AgentMenuItemProps {
  agent: Agent;
  selected: boolean;
  onSelect: () => void;
}

export function AgentMenuItem({ agent, selected, onSelect }: AgentMenuItemProps) {
  const avatarUrl = agent.avatar?.filepath;

  return (
    <MenuItem
      value={agent.id}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2 hover:bg-surface-hover cursor-pointer',
        selected && 'bg-surface-secondary'
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={agent.name || 'Agent'}
          className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-xs">
          {(agent.name || 'A').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-text-primary">
          {agent.name || agent.id}
        </span>
        {agent.description && (
          <span className="truncate text-xs text-text-secondary">
            {agent.description}
          </span>
        )}
      </div>
      {agent.isPublic && (
        <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Public
        </span>
      )}
    </MenuItem>
  );
}
