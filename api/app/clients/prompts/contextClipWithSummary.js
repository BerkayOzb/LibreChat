const { logger } = require('@librechat/data-schemas');

/**
 * Context Clip with Summary - Advanced hybrid message context management
 *
 * This filter combines sliding window with intelligent summarization:
 * - Always preserves system messages/instructions
 * - Keeps the most recent N messages in full detail
 * - Summarizes older messages to maintain context continuity
 * - Optimizes resource usage while preventing context loss
 *
 * Strategy:
 * ┌─────────────────────────────────────────┐
 * │ System Prompt (Always preserved)       │
 * ├─────────────────────────────────────────┤
 * │ Summarized Old Messages                │
 * │ "User asked about X, AI responded Y..." │
 * ├─────────────────────────────────────────┤
 * │ Recent N Messages (Full content)       │
 * │ - Message 51 (full)                    │
 * │ - Message 52 (full)                    │
 * │ - ...                                  │
 * │ - Message 60 (full)                    │
 * └─────────────────────────────────────────┘
 *
 * @param {Object} params - Configuration parameters
 * @param {TMessage[]} params.messages - Array of conversation messages
 * @param {Object} [params.instructions] - System instructions/prompt to preserve
 * @param {number} [params.maxRecentMessages=10] - Maximum number of recent messages to keep in full
 * @param {number} [params.maxContextTokens] - Maximum allowed tokens in context
 * @param {Function} [params.getTokenCount] - Function to calculate token count for a message
 * @param {Function} [params.summarizeMessages] - Function to summarize messages
 * @returns {Promise<{
 *   context: TMessage[],
 *   remainingContextTokens: number,
 *   messagesToRefine: TMessage[],
 *   summaryMessage: TMessage | null,
 *   summaryTokenCount: number,
 *   clippedCount: number
 * }>}
 */
async function contextClipWithSummary({
  messages: _messages,
  instructions,
  maxRecentMessages = 10,
  maxContextTokens,
  getTokenCount,
  summarizeMessages,
}) {


  // Start with assistant label token count (3 tokens)
  let currentTokenCount = 3;

  // Account for instructions token count if present
  const instructionsTokenCount = instructions?.tokenCount ?? 0;
  let remainingContextTokens = maxContextTokens - instructionsTokenCount;

  logger.debug('[ContextClipWithSummary] Starting hybrid context management', {
    totalMessages: _messages.length,
    maxRecentMessages,
    maxContextTokens,
    instructionsTokenCount,
  });

  const messages = _messages ?? [];

  if (messages.length === 0) {
    logger.debug('[ContextClipWithSummary] No messages to process');
    return {
      context: [],
      remainingContextTokens,
      messagesToRefine: [],
      summaryMessage: null,
      summaryTokenCount: 0,
      clippedCount: 0,
    };
  }

  // Separate system and regular messages
  const systemMessages = [];
  const regularMessages = [];

  for (const message of messages) {
    if (message.role === 'system') {
      systemMessages.push(message);
    } else {
      regularMessages.push(message);
    }
  }

  logger.debug('[ContextClipWithSummary] Message categorization', {
    systemMessages: systemMessages.length,
    regularMessages: regularMessages.length,
  });

  // Determine messages to keep in full (recent N)
  const recentMessages = regularMessages.slice(-maxRecentMessages);
  const oldMessages = regularMessages.slice(0, -maxRecentMessages);


  let summaryMessage = null;
  let summaryTokenCount = 0;
  const context = [];

  // Add system messages first
  for (const sysMsg of systemMessages) {
    context.push(sysMsg);
  }

  // Summarize old messages if any exist
  if (oldMessages.length > 0) {
    if (!summarizeMessages) {
      logger.info('[ContextClipWithSummary] Summarization not supported by this client, using clip mode');
      console.log('\nℹ️  Özet özelliği bu client için desteklenmiyor');
      console.log('📌 Clip modu kullanılıyor: Son', maxRecentMessages, 'mesaj korunuyor\n');
    } else {
      logger.debug('[ContextClipWithSummary] Summarizing old messages', {
        oldMessagesCount: oldMessages.length,
      });

      console.log('\n🔄 Özetleme işlemi başlıyor...');
      console.log('📋 Özetlenecek mesaj sayısı:', oldMessages.length);

    try {
      const summaryResult = await summarizeMessages({
        messagesToRefine: oldMessages,
        remainingContextTokens,
      });

      if (summaryResult && summaryResult.summaryMessage) {
        summaryMessage = summaryResult.summaryMessage;
        summaryTokenCount = summaryResult.summaryTokenCount || 0;

        // Add summary message to context
        context.push(summaryMessage);
        remainingContextTokens -= summaryTokenCount;

        // 🔥 Log the summary content
        console.log('\n✅ ÖZET OLUŞTURULDU:');
        console.log('═══════════════════════════════════════');
        console.log(summaryMessage.content);
        console.log('═══════════════════════════════════════');
        console.log('📊 Özet Token Sayısı:', summaryTokenCount);
        console.log('🗜️  Orijinal Mesaj Sayısı:', oldMessages.length);
        console.log('💾 Tasarruf:', `${oldMessages.length} mesaj → 1 özet`);
        console.log('═══════════════════════════════════════\n');

        logger.info('[ContextClipWithSummary] Summary created', {
          originalMessageCount: oldMessages.length,
          summaryTokenCount,
          summaryPreview: summaryMessage.content.substring(0, 100) + '...',
        });
      }
    } catch (error) {
      logger.error('[ContextClipWithSummary] Summary generation failed', error);
      console.log('\n❌ ÖZET OLUŞTURMA HATASI:', error.message);
      console.log('⚠️  Eski mesajlar atılacak (fallback to clip mode)\n');

      // Fallback: If summarization fails, just skip old messages (clip mode)
    }
    }
  }

  // Add recent messages in full
  for (const message of recentMessages) {
    const tokenCount = getTokenCount ? await getTokenCount(message) : message.tokenCount || 0;

    if (currentTokenCount + tokenCount > remainingContextTokens) {
      logger.debug('[ContextClipWithSummary] Token limit reached, stopping', {
        currentTokenCount,
        messageTokenCount: tokenCount,
        remainingContextTokens,
      });
      break;
    }

    context.push(message);
    currentTokenCount += tokenCount;
  }

  const clippedCount = oldMessages.length + (regularMessages.length - recentMessages.length - oldMessages.length);

  return {
    context,
    remainingContextTokens,
    messagesToRefine: oldMessages,
    summaryMessage,
    summaryTokenCount,
    clippedCount,
  };
}

module.exports = {
  contextClipWithSummary,
};
