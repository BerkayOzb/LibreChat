import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useGetSearchEnabledQuery } from '~/data-provider';
import { logger } from '~/utils';
import store from '~/store';

export default function useSearchEnabled(isAuthenticated: boolean) {
  const setSearch = useSetRecoilState(store.search);
  const searchEnabledQuery = useGetSearchEnabledQuery({ enabled: isAuthenticated });

  useEffect(() => {
    // Note: We only check if search is available, but don't automatically enable the UI
    // The search UI should only be visible when the user clicks the "Search Chats" button
    if (searchEnabledQuery.isError) {
      logger.error('Failed to get search enabled: ', searchEnabledQuery.error);
    }
  }, [searchEnabledQuery.error, searchEnabledQuery.isError]);

  return searchEnabledQuery;
}
