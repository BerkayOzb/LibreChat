import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Pin, PinOff } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import debounce from 'lodash/debounce';
import type { Endpoint, ModelGroup } from '~/common';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import { useGetModelOrder, useUpdateModelOrderMutation, useGetPinnedModels, useToggleModelPin } from '~/data-provider';
import UnknownIcon from '~/hooks/Endpoint/UnknownIcon';
import { CustomMenu as Menu } from '../CustomMenu';
import { EndpointModelItem } from './EndpointModelItem';

// Drag & Drop item type constant
const ItemTypes = {
  MODEL_ITEM: 'model-item',
};

interface ModelGroupItemProps {
  group: ModelGroup;
  endpoint: Endpoint;
  selectedModel: string | null;
}

interface DragItem {
  index: number;
  name: string;
  type: string;
}

interface DraggableModelItemProps {
  model: any;
  index: number;
  endpoint: Endpoint;
  selectedModel: string | null;
  isAdmin: boolean;
  moveModel: (dragIndex: number, hoverIndex: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  totalModels: number;
  isPinned: boolean;
  onTogglePin: () => void;
  localize: (key: string) => string;
}

// Draggable Model Item Component
function DraggableModelItem({
  model,
  index,
  endpoint,
  selectedModel,
  isAdmin,
  moveModel,
  moveUp,
  moveDown,
  totalModels,
  isPinned,
  onTogglePin,
  localize,
}: DraggableModelItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: ItemTypes.MODEL_ITEM,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset?.y ?? 0) - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveModel(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.MODEL_ITEM,
    item: () => {
      return { name: model.name, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isAdmin,
  });

  const opacity = isDragging ? 0.4 : 1;

  // Connect drag and drop refs
  if (isAdmin) {
    drag(drop(ref));
  }

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{ opacity }}
      className={`flex items-center gap-1 ${isDragging ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
    >
      <EndpointModelItem
        modelId={model.name}
        endpoint={endpoint}
        isSelected={selectedModel === model.name}
      />
      <div className="flex items-center gap-0.5 pr-2">
        {/* Pin button - available to all users */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isPinned ? localize('com_ui_unpin_model') : localize('com_ui_pin_model')}
          aria-label={isPinned ? 'Unpin model' : 'Pin model'}
        >
          {isPinned ? (
            <Pin className="h-4 w-4 fill-current text-blue-500" />
          ) : (
            <PinOff className="h-4 w-4 opacity-50" />
          )}
        </button>

        {/* Admin controls - only for admins */}
        {isAdmin && (
          <>
            <GripVertical
              className="h-4 w-4 text-gray-400 opacity-50 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveUp(index);
              }}
              disabled={index === 0}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-700"
              title="Move up"
              aria-label="Move model up"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveDown(index);
              }}
              disabled={index === totalModels - 1}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-700"
              title="Move down"
              aria-label="Move model down"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ModelGroupItem({ group, endpoint, selectedModel }: ModelGroupItemProps) {
  const { user } = useAuthContext();
  const isAdmin = user?.role === SystemRoles.ADMIN;
  const localize = useLocalize();

  // Fetch current model order from database (all users need this to see admin's ordering)
  const { data: modelOrderData } = useGetModelOrder(
    endpoint.value,
    group.provider
  );

  // Fetch user's pinned models
  const { data: pinnedData } = useGetPinnedModels(
    endpoint.value,
    group.provider
  );

  // Memoize pinnedModels array to create stable reference for useEffect
  const pinnedModels = useMemo(
    () => pinnedData?.pinnedModels || [],
    [pinnedData?.pinnedModels],
  );

  // Mutation for updating model order
  const updateModelOrderMutation = useUpdateModelOrderMutation();

  // Mutation for toggling pin status
  const togglePinMutation = useToggleModelPin();

  // Local state for model ordering
  const [localModels, setLocalModels] = useState(group.models);

  // Update local state when group.models or pinnedModels changes
  // Backend admin ordering (from /d/admin/models) is already applied to group.models
  // We only need to handle pinned models here
  useEffect(() => {
    // Sort by pinned status only, preserving backend order for non-pinned models
    const sortedModels = [...group.models].sort((a, b) => {
      const aPinned = pinnedModels.includes(a.name);
      const bPinned = pinnedModels.includes(b.name);

      // Pinned models go to the top
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // For models with same pinned status, preserve backend order (admin panel ordering)
      return 0;
    });

    setLocalModels(sortedModels);
  }, [group.models, pinnedModels]);

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

  // Move model via drag & drop
  const moveModel = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalModels(prev => {
      const newModels = [...prev];
      const draggedModel = newModels[dragIndex];
      newModels.splice(dragIndex, 1);
      newModels.splice(hoverIndex, 0, draggedModel);
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
          <div className="flex h-5 w-5 items-center justify-center">
            <UnknownIcon endpoint={group.provider} className="h-full w-full object-contain" />
          </div>
          <span className="truncate text-left">{group.displayName || group.provider}</span>
          <span className="ml-auto text-xs opacity-60">{localModels.length}</span>
        </div>
      }
    >
      {localModels.map((model, index) => (
        <DraggableModelItem
          key={model.name}
          model={model}
          index={index}
          endpoint={endpoint}
          selectedModel={selectedModel}
          isAdmin={isAdmin}
          moveModel={moveModel}
          moveUp={moveUp}
          moveDown={moveDown}
          totalModels={localModels.length}
          isPinned={pinnedModels.includes(model.name)}
          onTogglePin={() => {
            togglePinMutation.mutate({
              endpoint: endpoint.value,
              provider: group.provider,
              modelName: model.name,
            });
          }}
          localize={localize}
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
