import { CustomMenuItem as MenuItem } from '../../Endpoints/CustomMenu';
import { cn } from '~/utils';

interface AssistantMenuItemProps {
  assistant: any;
  selected: boolean;
  onSelect: () => void;
}

export function AssistantMenuItem({ assistant, selected, onSelect }: AssistantMenuItemProps) {
  const avatarUrl = assistant.metadata?.avatar;

  return (
    <MenuItem
      value={assistant.id}
      className={cn(
        'flex items-center gap-3 px-3 py-2 hover:bg-surface-hover cursor-pointer',
        selected && 'bg-surface-secondary'
      )}
      onClick={onSelect}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={assistant.name || 'Assistant'}
          className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-xs">
          {(assistant.name || 'A').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{assistant.name || 'Unnamed Assistant'}</span>
        </div>
        {assistant.description && (
          <span className="truncate text-xs text-text-secondary">{assistant.description}</span>
        )}
      </div>
    </MenuItem>
  );
}
