import React, { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { Search } from 'lucide-react';
import { TooltipAnchor, NewChatIcon, MobileSidebar, Sidebar } from '@librechat/client';
import { useLocalize, useNewConvo } from '~/hooks';
import SearchBar from './SearchBar';
import store from '~/store';

export default function NewChat({
  toggleNav,
  subHeaders,
  isSmallScreen,
  headerButtons,
}: {
  toggleNav: () => void;
  isSmallScreen: boolean;
  subHeaders?: React.ReactNode;
  headerButtons?: React.ReactNode;
}) {
  const { newConversation } = useNewConvo();
  const localize = useLocalize();
  const [search, setSearch] = useRecoilState(store.search);

  const clickHandler = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        window.open('/c/new', '_blank');
        return;
      }
      newConversation();
      if (isSmallScreen) {
        toggleNav();
      }
    },
    [newConversation, toggleNav, isSmallScreen],
  );

  return (
    <>
      <div className="flex flex-col gap-1 py-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-1">
            {headerButtons}
          </div>
          <TooltipAnchor
            description={localize('com_nav_close_sidebar')}
            render={
              <div
                role="button"
                tabIndex={0}
                data-testid="close-sidebar-button"
                aria-label={localize('com_nav_close_sidebar')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary cursor-pointer"
                onClick={toggleNav}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleNav();
                  }
                }}
              >
                <Sidebar className="h-5 w-5 max-md:hidden" />
                <MobileSidebar className="h-5 w-5 md:hidden" />
              </div>
            }
          />
        </div>

        <TooltipAnchor
          description={localize('com_ui_new_chat')}
          render={
            <div
              role="button"
              tabIndex={0}
              data-testid="nav-new-chat-button"
              aria-label={localize('com_ui_new_chat')}
              className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-text-primary transition-colors duration-200 hover:bg-surface-hover cursor-pointer"
              onClick={clickHandler}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  newConversation();
                  if (isSmallScreen) {
                    toggleNav();
                  }
                }
              }}
            >
              <NewChatIcon className="h-5 w-5" />
              <span className="text-sm font-normal">{localize('com_ui_new_chat')}</span>
            </div>
          }
        />

        {!search.enabled && (
          <TooltipAnchor
            description={localize('com_ui_search_chats')}
            render={
              <div
                role="button"
                tabIndex={0}
                data-testid="nav-search-chats-button"
                aria-label={localize('com_ui_search_chats')}
                className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-text-primary transition-colors duration-200 hover:bg-surface-hover cursor-pointer"
                onClick={() => setSearch((prev) => ({ ...prev, enabled: true }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSearch((prev) => ({ ...prev, enabled: true }));
                  }
                }}
              >
                <Search className="h-5 w-5" />
                <span className="text-sm font-normal">{localize('com_ui_search_chats')}</span>
              </div>
            }
          />
        )}

        {search.enabled && <SearchBar isSmallScreen={isSmallScreen} />}
      </div>
    </>
  );
}
