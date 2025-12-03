import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys, Constants } from 'librechat-data-provider';
import { TooltipAnchor, NewChatIcon, MobileSidebar, Sidebar, Button } from '@librechat/client';
import type { TMessage } from 'librechat-data-provider';
import { useLocalize, useNewConvo } from '~/hooks';
import store from '~/store';

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
  headerButtons,
}: {
  index?: number;
  toggleNav: () => void;
  isSmallScreen?: boolean;
  subHeaders?: React.ReactNode;
  headerButtons?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  /** Note: this component needs an explicit index passed if using more than one */
  const { newConversation: newConvo } = useNewConvo(index);
  const navigate = useNavigate();
  const localize = useLocalize();
  const { conversation } = store.useCreateConversationAtom(index);

  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        window.open('/c/new', '_blank');
        return;
      }
      queryClient.setQueryData<TMessage[]>(
        [QueryKeys.messages, conversation?.conversationId ?? Constants.NEW_CONVO],
        [],
      );
      queryClient.invalidateQueries([QueryKeys.messages]);
      newConvo();
      navigate('/c/new', { state: { focusChat: true } });
      if (isSmallScreen) {
        toggleNav();
      }
    },
    [queryClient, conversation, newConvo, navigate, toggleNav, isSmallScreen],
  );

  return (
    <>
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {headerButtons}
          </div>
          <TooltipAnchor
            description={localize('com_nav_close_sidebar')}
            render={
              <Button
                size="icon"
                variant="ghost"
                data-testid="close-sidebar-button"
                aria-label={localize('com_nav_close_sidebar')}
                className="h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                onClick={toggleNav}
              >
                <Sidebar className="h-5 w-5 max-md:hidden" />
                <MobileSidebar className="h-5 w-5 md:hidden" />
              </Button>
            }
          />
        </div>

        <TooltipAnchor
          description={localize('com_ui_new_chat')}
          render={
            <Button
              variant="ghost"
              data-testid="nav-new-chat-button"
              aria-label={localize('com_ui_new_chat')}
              className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-text-primary transition-colors duration-200 hover:bg-surface-hover"
              onClick={clickHandler}
            >
              <NewChatIcon className="h-5 w-5" />
              <span className="text-sm font-normal">{localize('com_ui_new_chat')}</span>
            </Button>
          }
        />
      </div>
      {subHeaders != null ? subHeaders : null}
    </>
  );
}
