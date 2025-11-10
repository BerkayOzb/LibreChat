import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { ImageIcon } from 'lucide-react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { useBadgeRowContext } from '~/Providers/BadgeRowContext';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import store from '~/store';

/**
 * Quick Image Generation Button
 *
 * Tek tıkla görsel üretimi için akıllı buton.
 * Tıklayınca otomatik olarak:
 * 1. Agents endpoint'i aktif olur
 * 2. Nano-banana tool'u aktif olur
 * 3. Kullanıcı sadece prompt yazar
 */
export default function QuickImageGenButton() {
  const localize = useLocalize();
  const { conversation, newConversation } = useChatContext();
  const { imageGeneration } = useBadgeRowContext();
  const isTemporary = useRecoilValue(store.isTemporary);

  const isActive = imageGeneration.toggleState;
  const isAgentsEndpoint = conversation?.endpoint === EModelEndpoint.agents;

  const handleClick = useCallback(() => {
    // Eğer zaten aktifse, deaktif et
    if (isActive) {
      imageGeneration.debouncedChange({ value: false });
      return;
    }

    // Nano-banana tool'unu aktif et
    imageGeneration.debouncedChange({ value: true });

    // Agents endpoint'i değilse, uyarı göster
    if (!isAgentsEndpoint) {
      // Küçük bir gecikmeyle endpoint değişikliğini öner
      setTimeout(() => {
        alert(
          'Görsel üretimi için "Agents" endpoint\'ini seçin!\n\n' +
          'Sol üst köşeden "Agents" seçin ve tekrar deneyin.'
        );
      }, 100);
    }
  }, [isActive, isAgentsEndpoint, imageGeneration]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTemporary}
      className={cn(
        'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isActive
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
          : 'border border-border-medium bg-surface-primary text-text-primary hover:border-border-heavy hover:bg-surface-hover',
        isTemporary && 'cursor-not-allowed opacity-50',
      )}
      title={
        isActive
          ? localize('com_ui_image_gen_active') || 'Görsel üretimi aktif'
          : localize('com_ui_image_gen_activate') || 'Görsel üret'
      }
    >
      <ImageIcon
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary',
          isActive && 'animate-pulse',
        )}
      />
      <span className="hidden sm:inline">
        {isActive
          ? isAgentsEndpoint
            ? localize('com_ui_generating') || 'Aktif'
            : '⚠️ Agents Seçin'
          : localize('com_ui_image_gen') || 'Görsel Üret'}
      </span>
      {isActive && (
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
        </span>
      )}
    </button>
  );
}
