import React, { useRef } from 'react';
import { FileUpload, TooltipAnchor } from '@librechat/client';
import { Paperclip } from 'lucide-react';
import { useLocalize, useFileHandling } from '~/hooks';
import { cn } from '~/utils';

const AttachFile = ({ disabled }: { disabled?: boolean | null }) => {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploadDisabled = disabled ?? false;

  const { handleFileChange } = useFileHandling();

  return (
    <FileUpload ref={inputRef} handleFileChange={handleFileChange}>
      <TooltipAnchor
        description={localize('com_sidepanel_attach_files')}
        id="attach-file"
        disabled={isUploadDisabled}
        render={
          <button
            type="button"
            aria-label={localize('com_sidepanel_attach_files')}
            disabled={isUploadDisabled}
            className={cn(
              'group relative flex size-9 items-center justify-center rounded-xl p-2 transition-all duration-300',
              'hover:bg-violet-500/10 dark:hover:bg-violet-500/20',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
            )}
            onKeyDownCapture={(e) => {
              if (!inputRef.current) {
                return;
              }
              if (e.key === 'Enter' || e.key === ' ') {
                inputRef.current.value = '';
                inputRef.current.click();
              }
            }}
            onClick={() => {
              if (!inputRef.current) {
                return;
              }
              inputRef.current.value = '';
              inputRef.current.click();
            }}
          >
            <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-violet-500 group-hover:rotate-45 transition-all duration-300" />
          </button>
        }
      />
    </FileUpload>
  );
};

export default React.memo(AttachFile);
