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
  const lastConversationUpdateRef = useRef<string | null>(null);

  // Find "Görsel Üretici" agent by name
  const findImageAgent = useCallback(() => {
    if (!agentsMap) return null;

    return Object.values(agentsMap).find(
      (agent) => agent?.name?.toLowerCase() === 'görsel üretici'
    );
  }, [agentsMap]);

  // Detect when we're in image generation mode (using image agent)
  const isInImageMode = conversation?.agent_id === imageAgentIdRef.current && imageAgentIdRef.current !== null;

  // Monitor conversation for completion with image attachment
  useEffect(() => {
    if (!isGenerating || !isInImageMode || !previousConversationRef.current || !conversation) {
      return;
    }

    // Create a unique signature of the conversation to detect updates
    const conversationSignature = JSON.stringify({
      conversationId: conversation.conversationId,
      messageCount: conversation.messages?.length || 0,
    });

    // Skip if conversation hasn't changed
    if (conversationSignature === lastConversationUpdateRef.current) {
      return;
    }

    lastConversationUpdateRef.current = conversationSignature;

    // Check if there's a new assistant message with image attachments
    if (!conversation.messages || conversation.messages.length === 0) {
      return;
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];

    // Check if the message has image attachments and is from the assistant
    const hasImageAttachment =
      lastMessage?.files &&
      lastMessage.files.length > 0 &&
      lastMessage.files.some((file: any) =>
        file.type?.startsWith('image/') ||
        file.filepath?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

    if (hasImageAttachment && !lastMessage.isCreatedByUser) {
      // Image generation complete! Switch back to previous conversation
      const timer = setTimeout(async () => {
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
          lastConversationUpdateRef.current = null;
        } catch (error) {
          console.error('Error auto-switching back to previous conversation:', error);
        }
      }, 800); // Small delay to ensure message is fully rendered

      return () => clearTimeout(timer);
    }
  }, [isGenerating, isInImageMode, conversation, switchToConversation]);

  const handleClick = useCallback(async () => {
    if (isGenerating) {
      // If generating, switch back to previous conversation (manual cancel)
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
          lastConversationUpdateRef.current = null;
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
      lastConversationUpdateRef.current = null; // Reset to track new updates

      // Switch to image generation agent
      setIsGenerating(true);
      await onSelect(imageAgent.id);
    } catch (error) {
      console.error('Error switching to image generation agent:', error);
      setIsGenerating(false);
      previousConversationRef.current = null;
      imageAgentIdRef.current = null;
      lastConversationUpdateRef.current = null;
    }
  }, [isGenerating, conversation, findImageAgent, onSelect, switchToConversation]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTemporary}
      className={cn(
        // Base styling - compact size like before
        'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
        'transition-colors duration-200',
        'bg-transparent border border-border-medium shadow-sm',
        'hover:bg-surface-hover hover:shadow-md active:shadow-inner',

        // Active state - matching Web button opacity style
        isGenerating || isInImageMode
          ? 'border-purple-600/40 bg-purple-500/10 hover:bg-purple-700/10'
          : '',

        // Disabled state
        isTemporary && 'cursor-not-allowed opacity-50',
      )}
      title={
        isGenerating || isInImageMode
          ? 'Görsel üretimi aktif - Vazgeç'
          : 'Görsel üret'
      }
    >
      {/* Icon */}
      <ImageIcon className="h-4 w-4 text-text-primary" />

      {/* Label */}
      <span className="hidden sm:inline">
        {isGenerating || isInImageMode
          ? 'Vazgeç'
          : localize('com_ui_image_gen') || 'Görsel Üret'}
      </span>
    </button>
  );
}
