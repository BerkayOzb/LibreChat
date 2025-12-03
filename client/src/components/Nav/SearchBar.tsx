import React, { forwardRef, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useRecoilState } from 'recoil';
import { Search, X, ArrowLeft } from 'lucide-react';
import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalize, useNewConvo } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

type SearchBarProps = {
  isSmallScreen?: boolean;
};

const SearchBar = forwardRef((props: SearchBarProps, ref: React.Ref<HTMLDivElement>) => {
  const localize = useLocalize();
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isSmallScreen } = props;

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showClearIcon, setShowClearIcon] = useState(false);

  const { newConversation: newConvo } = useNewConvo();
  const [search, setSearchState] = useRecoilState(store.search);

  const clearSearch = useCallback(
    (pathname?: string) => {
      if (pathname?.includes('/search') || pathname === '/c/new') {
        queryClient.removeQueries([QueryKeys.messages]);
        newConvo({ disableFocus: true });
        navigate('/c/new');
      }
    },
    [newConvo, navigate, queryClient],
  );

  const clearText = useCallback(
    (pathname?: string) => {
      setShowClearIcon(false);
      setText('');
      setSearchState((prev) => ({
        ...prev,
        query: '',
        debouncedQuery: '',
        isTyping: false,
      }));
      clearSearch(pathname);
      inputRef.current?.focus();
    },
    [setSearchState, clearSearch],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement;
      if (e.key === 'Backspace' && value === '') {
        clearText(location.pathname);
      }
    },
    [clearText, location.pathname],
  );

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const debouncedSetDebouncedQuery = useMemo(
    () =>
      debounce((value: string) => {
        setSearchState((prev) => ({ ...prev, debouncedQuery: value, isTyping: false }));
      }, 500),
    [setSearchState],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowClearIcon(value.length > 0);
    setText(value);
    setSearchState((prev) => ({
      ...prev,
      query: value,
      isTyping: true,
    }));
    debouncedSetDebouncedQuery(value);
  };

  // Automatically set isTyping to false when loading is done and debouncedQuery matches query
  // (prevents stuck loading state if input is still focused)
  useEffect(() => {
    if (search.isTyping && !search.isSearching && search.debouncedQuery === search.query) {
      setSearchState((prev) => ({ ...prev, isTyping: false }));
    }
  }, [search.isTyping, search.isSearching, search.debouncedQuery, search.query, setSearchState]);

  return (
    <div
      ref={ref}
      className={cn(
        'group relative flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-text-primary transition-colors duration-200 hover:bg-surface-hover cursor-pointer',
        isSmallScreen === true ? 'mb-2 h-14 rounded-xl' : '',
      )}
    >
      <button
        type="button"
        className="flex items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
        onClick={() => setSearchState((prev) => ({ ...prev, enabled: false, query: '', debouncedQuery: '', isTyping: false }))}
        aria-label={localize('com_ui_close')}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <input
        type="text"
        ref={inputRef}
        className="m-0 mr-0 w-full border-none bg-transparent p-0 pr-8 text-sm font-normal leading-tight text-text-primary placeholder-text-secondary placeholder-opacity-100 focus-visible:outline-none group-focus-within:placeholder-text-primary group-hover:placeholder-text-primary"
        value={text}
        onChange={onChange}
        onKeyDown={(e) => {
          e.code === 'Space' ? e.stopPropagation() : null;
        }}
        aria-label={localize('com_nav_search_placeholder')}
        placeholder={localize('com_nav_search_placeholder')}
        onKeyUp={handleKeyUp}
        onFocus={() => setSearchState((prev) => ({ ...prev, isSearching: true }))}
        onBlur={() => setSearchState((prev) => ({ ...prev, isSearching: false }))}
        autoComplete="off"
        dir="auto"
      />
      <button
        type="button"
        aria-label={`${localize('com_ui_clear')} ${localize('com_ui_search')}`}
        className={cn(
          'absolute right-3 flex h-5 w-5 items-center justify-center rounded-full border-none bg-transparent p-0 text-text-secondary transition-opacity duration-200 hover:text-text-primary',
          showClearIcon ? 'opacity-100' : 'opacity-0',
          isSmallScreen === true ? 'right-4' : '',
        )}
        onClick={() => clearText(location.pathname)}
        tabIndex={showClearIcon ? 0 : -1}
        disabled={!showClearIcon}
      >
        <X className="h-5 w-5 cursor-pointer" />
      </button>
    </div>
  );
});

export default SearchBar;
