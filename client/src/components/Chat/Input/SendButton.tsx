import React, { forwardRef } from 'react';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { TooltipAnchor } from '@librechat/client';
import { ArrowUp } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

type SendButtonProps = {
  disabled: boolean;
  control: Control<{ text: string }>;
};

const SubmitButton = React.memo(
  forwardRef((props: { disabled: boolean }, ref: React.ForwardedRef<HTMLButtonElement>) => {
    const localize = useLocalize();
    const isEnabled = !props.disabled;
    return (
      <TooltipAnchor
        description={localize('com_nav_send_message')}
        render={
          <button
            ref={ref}
            aria-label={localize('com_nav_send_message')}
            id="send-button"
            disabled={props.disabled}
            className={cn(
              'group relative flex size-9 items-center justify-center rounded-full p-2 transition-all duration-200',
              'disabled:cursor-not-allowed',
              isEnabled
                ? 'bg-black dark:bg-white hover:opacity-80 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-700',
            )}
            data-testid="send-button"
            type="submit"
          >
            <ArrowUp
              className={cn(
                'h-5 w-5 transition-all duration-200',
                isEnabled
                  ? 'text-white dark:text-black'
                  : 'text-gray-400 dark:text-gray-500',
              )}
              strokeWidth={2.5}
            />
          </button>
        }
      />
    );
  }),
);

const SendButton = React.memo(
  forwardRef((props: SendButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) => {
    const data = useWatch({ control: props.control });
    return <SubmitButton ref={ref} disabled={props.disabled || !data.text} />;
  }),
);

export default SendButton;
