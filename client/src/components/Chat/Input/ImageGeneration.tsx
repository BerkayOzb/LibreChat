import React, { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { CheckboxButton } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

function ImageGeneration() {
  const localize = useLocalize();
  const { imageGeneration: imageGenerationData } = useBadgeRowContext();
  const { toggleState: imageGeneration, debouncedChange, isPinned } = imageGenerationData;

  return (
    (isPinned || imageGeneration) && (
      <CheckboxButton
        className="max-w-fit"
        checked={imageGeneration}
        setValue={debouncedChange}
        label={localize('com_ui_image_gen') || 'Görsel Üret'}
        isCheckedClassName="border-pink-600/40 bg-pink-500/10 hover:bg-pink-700/10"
        icon={<ImageIcon className="icon-md" />}
      />
    )
  );
}

export default memo(ImageGeneration);
