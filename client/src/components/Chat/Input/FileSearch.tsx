import React, { memo } from 'react';
import { FolderSearch } from 'lucide-react';
import { CheckboxButton } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess, useToolVisibility, ToolIds } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

function FileSearch() {
  const localize = useLocalize();
  const { fileSearch } = useBadgeRowContext();
  const { toggleState: fileSearchEnabled, debouncedChange, isPinned } = fileSearch;

  const canUseFileSearch = useHasAccess({
    permissionType: PermissionTypes.FILE_SEARCH,
    permission: Permissions.USE,
  });

  // Check admin tool visibility
  const { isToolVisible } = useToolVisibility();

  if (!canUseFileSearch || !isToolVisible(ToolIds.FILE_SEARCH)) {
    return null;
  }

  return (
    <>
      {(fileSearchEnabled || isPinned) && (
        <CheckboxButton
          className="max-w-fit"
          checked={fileSearchEnabled}
          setValue={debouncedChange}
          label={localize('com_assistants_file_search')}
          isCheckedClassName="border-green-600/40 bg-green-500/10 hover:bg-green-700/10"
          icon={<FolderSearch className="icon-md" />}
        />
      )}
    </>
  );
}

export default memo(FileSearch);
