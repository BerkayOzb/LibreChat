import { useCallback, useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { ImageIcon } from 'lucide-react';
import type { TConversation } from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { useAgentsMapContext } from '~/Providers/AgentsMapContext';
import useSelectAgent from '~/hooks/Agents/useSelectAgent';
import useNewConvo from '~/hooks/useNewConvo';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import store from '~/store';

/**
 * Quick Image Generation Button
 *
 * Smart button for one-click image generation with auto-switching:
 * 1. Saves current conversation/model
 * 2. Switches to "Görsel Üretici" agent
 * 3. After generation completes, switches back to previous conversation
 */
export default function QuickImageGenButton() {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const { onSelect } = useSelectAgent();
  const { switchToConversation } = useNewConvo(0);
  const agentsMap = useAgentsMapContext();
  const isTemporary = useRecoilValue(store.isTemporary);

  const [isGenerating, setIsGenerating] = useState(false);
  const previousConversationRef = useRef<TConversation | null>(null);
  const imageAgentIdRef = useRef<string | null>(null);

  // Find "Görsel Üretici" agent by name
  const findImageAgent = useCallback(() => {
    if (!agentsMap) return null;

    return Object.values(agentsMap).find(
      (agent) => agent?.name?.toLowerCase() === 'görsel üretici'
    );
  }, [agentsMap]);

  // Detect when we're in image generation mode (using image agent)
  const isInImageMode = conversation?.agent_id === imageAgentIdRef.current && imageAgentIdRef.current !== null;

  // Monitor conversation changes to detect completion
  useEffect(() => {
    // If we were generating and now we have a different conversation, generation is complete
    if (isGenerating && !isInImageMode && previousConversationRef.current) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        setIsGenerating(false);
        previousConversationRef.current = null;
        imageAgentIdRef.current = null;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, isInImageMode]);

  const handleClick = useCallback(async () => {
    if (isGenerating) {
      // If generating, switch back to previous conversation
      if (previousConversationRef.current) {
        try {
          await switchToConversation(
            previousConversationRef.current,
            null,
            undefined,
            false,
            true, // keepLatestMessage
          );
          setIsGenerating(false);
          previousConversationRef.current = null;
          imageAgentIdRef.current = null;
        } catch (error) {
          console.error('Error switching back to previous conversation:', error);
        }
      }
      return;
    }

    // Find image generation agent
    const imageAgent = findImageAgent();
    if (!imageAgent?.id) {
      alert(
        'Görsel Üretici agent\'ı bulunamadı!\n\n' +
        'Lütfen "Görsel Üretici" adında bir agent oluşturun.'
      );
      return;
    }

    try {
      // Save current conversation
      previousConversationRef.current = conversation;
      imageAgentIdRef.current = imageAgent.id;

      // Switch to image generation agent
      setIsGenerating(true);
      await onSelect(imageAgent.id);
    } catch (error) {
      console.error('Error switching to image generation agent:', error);
      setIsGenerating(false);
      previousConversationRef.current = null;
      imageAgentIdRef.current = null;
    }
  }, [isGenerating, conversation, findImageAgent, onSelect, switchToConversation]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTemporary}
      className={cn(
        'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
        'transition-colors duration-200',
        isGenerating || isInImageMode
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg'
          : 'border border-border-medium bg-surface-primary text-text-primary hover:border-purple-400 hover:bg-surface-hover',
        isTemporary && 'cursor-not-allowed opacity-50',
      )}
      title={
        isGenerating || isInImageMode
          ? 'Görsel üretimi aktif - Vazgeç'
          : 'Görsel üret'
      }
    >
      <ImageIcon
        className={cn(
          'h-4 w-4 transition-all duration-200',
          isGenerating || isInImageMode
            ? 'text-white'
            : 'text-text-secondary group-hover:text-purple-500',
        )}
      />
      <span className="hidden sm:inline">
        {isGenerating || isInImageMode
          ? 'Vazgeç'
          : localize('com_ui_image_gen') || 'Görsel Üret'}
      </span>
      {(isGenerating || isInImageMode) && (
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
        </span>
      )}
    </button>
  );
}
