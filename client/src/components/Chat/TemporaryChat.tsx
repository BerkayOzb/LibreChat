import React from 'react';
import { useRecoilState, useRecoilCallback } from 'recoil';
import { TooltipAnchor, useToastContext } from '@librechat/client';
import { VenetianMask } from 'lucide-react';
import { useChatContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

export function TemporaryChat() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [isTemporary, setIsTemporary] = useRecoilState(store.isTemporary);
  const { conversation, isSubmitting } = useChatContext();

  const handleBadgeToggle = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const currentIsTemporary = await snapshot.getPromise(store.isTemporary);
        const newState = !currentIsTemporary;
        setIsTemporary(newState);

        showToast({
          message: localize(
            newState ? 'com_ui_temporary_enabled' : 'com_ui_temporary_disabled'
          ),
          status: newState ? 'success' : 'info',
        });
      },
    [setIsTemporary, showToast, localize],
  );

  if (
    (Array.isArray(conversation?.messages) && conversation.messages.length >= 1) ||
    isSubmitting
  ) {
    return null;
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <TooltipAnchor
        description={localize('com_ui_temporary_desc')}
        render={
          <button
            onClick={handleBadgeToggle}
            aria-label={localize('com_ui_temporary')}
            className={cn(
              'flex size-9 items-center justify-center rounded-full p-1 transition-colors hover:bg-surface-hover',
              isTemporary ? 'bg-surface-active text-text-primary' : 'text-text-secondary',
            )}
            title={localize('com_ui_temporary')}
          >
            <VenetianMask className={cn('h-6 w-6')} />
          </button>
        }
      />
    </div>
  );
}
