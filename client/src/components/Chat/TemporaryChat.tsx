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
              'group relative flex size-9 items-center justify-center rounded-xl p-2 transition-all duration-300',
              isTemporary
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40'
                : 'hover:bg-amber-500/10 dark:hover:bg-amber-500/20',
            )}
            title={localize('com_ui_temporary')}
          >
            <VenetianMask
              className={cn(
                'h-5 w-5 transition-all duration-300',
                isTemporary
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-amber-500',
              )}
            />
            {isTemporary && (
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        }
      />
    </div>
  );
}
