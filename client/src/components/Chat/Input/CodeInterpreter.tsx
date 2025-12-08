import React, { memo } from 'react';
import { Code2 } from 'lucide-react';
import { CheckboxButton } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess, useToolVisibility, ToolIds } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

function CodeInterpreter() {
  const localize = useLocalize();
  const { codeInterpreter, codeApiKeyForm } = useBadgeRowContext();
  const { toggleState: runCode, debouncedChange, isPinned } = codeInterpreter;
  const { badgeTriggerRef } = codeApiKeyForm;

  const canRunCode = useHasAccess({
    permissionType: PermissionTypes.RUN_CODE,
    permission: Permissions.USE,
  });

  // Check admin tool visibility
  const { isToolVisible } = useToolVisibility();

  if (!canRunCode || !isToolVisible(ToolIds.CODE_INTERPRETER)) {
    return null;
  }

  return (
    (runCode || isPinned) && (
      <CheckboxButton
        ref={badgeTriggerRef}
        className="max-w-fit"
        checked={runCode}
        setValue={debouncedChange}
        label={localize('com_assistants_code_interpreter')}
        isCheckedClassName="border-purple-600/40 bg-purple-500/10 hover:bg-purple-700/10"
        icon={<Code2 className="icon-md" />}
      />
    )
  );
}

export default memo(CodeInterpreter);
