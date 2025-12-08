import React, { memo } from 'react';
import { CheckboxButton } from '@librechat/client';
import { useLocalize, useToolVisibility, ToolIds } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

// Banana icon component for nano-banana image generation
const BananaIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontSize: '1.1em' }}>🍌</span>
);

function ImageGeneration() {
  const localize = useLocalize();
  const { imageGeneration: imageGenerationData } = useBadgeRowContext();
  const { toggleState: imageGeneration, debouncedChange, isPinned } = imageGenerationData;

  // Check admin tool visibility
  const { isToolVisible } = useToolVisibility();

  if (!isToolVisible(ToolIds.IMAGE_GENERATION)) {
    return null;
  }

  return (
    (isPinned || imageGeneration) && (
      <CheckboxButton
        className="max-w-fit"
        checked={imageGeneration}
        setValue={debouncedChange}
        label={localize('com_ui_image_gen') || 'Görsel Üret'}
        isCheckedClassName="border-yellow-500/40 bg-yellow-400/10 hover:bg-yellow-500/10"
        icon={<BananaIcon className="icon-md" />}
      />
    )
  );
}

export default memo(ImageGeneration);
