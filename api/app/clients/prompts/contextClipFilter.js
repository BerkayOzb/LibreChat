const { logger } = require('@librechat/data-schemas');

/**
 * Context Clip Filter - Optimized message context management
 *
 * This filter implements a sliding window approach to manage conversation context:
 * - Always preserves system messages/instructions
 * - Keeps only the most recent N messages
 * - Respects token limits while maximizing context
 * - Optimizes resource usage by discarding older messages
 *
 * Inspired by OpenWebUI's Context Clip Filter with LibreChat-specific enhancements
 *
 * @param {Object} params - Configuration parameters
 * @param {TMessage[]} params.messages - Array of conversation messages
 * @param {Object} [params.instructions] - System instructions/prompt to preserve
 * @param {number} [params.maxRecentMessages=10] - Maximum number of recent messages to keep
 * @param {number} [params.maxContextTokens] - Maximum allowed tokens in context
 * @param {Function} [params.getTokenCount] - Function to calculate token count for a message
 * @returns {Promise<{
 *   context: TMessage[],
 *   remainingContextTokens: number,
 *   messagesToRefine: TMessage[],
 *   clippedCount: number
 * }>}
 */
async function contextClipFilter({
  messages: _messages,
  instructions,
  maxRecentMessages = 10,
  maxContextTokens,
  getTokenCount,
}) {
  // 🔥 DEBUG: Geçici console.log - çalıştığını doğrulamak için
  console.log('\n========================================');
  console.log('🎯 CONTEXT CLIP FILTER ÇALIŞIYOR!');
  console.log('========================================');
  console.log('📊 Total Messages:', _messages.length);
  console.log('📌 Max Recent Messages:', maxRecentMessages);
  console.log('🎫 Max Context Tokens:', maxContextTokens);
  console.log('========================================\n');

  // Start with assistant label token count (3 tokens)
  let currentTokenCount = 3;

  // Account for instructions token count if present
  const instructionsTokenCount = instructions?.tokenCount ?? 0;
  let remainingContextTokens = maxContextTokens - instructionsTokenCount;

  logger.debug('[ContextClipFilter] Starting context clipping', {
    totalMessages: _messages.length,
    maxRecentMessages,
    maxContextTokens,
    instructionsTokenCount,
  });

  // Separate system messages and regular messages
  const systemMessages = [];
  const regularMessages = [];

  // First pass: separate system messages from regular messages
  for (const message of _messages) {
    if (message.role === 'system' && !instructions) {
      systemMessages.push(message);
      currentTokenCount += message.tokenCount || 0;
    } else {
      regularMessages.push(message);
    }
  }

  // Get the most recent N messages (sliding window)
  const recentMessages = regularMessages.slice(-maxRecentMessages);

  logger.debug('[ContextClipFilter] Message distribution', {
    systemMessages: systemMessages.length,
    regularMessages: regularMessages.length,
    recentMessages: recentMessages.length,
    clippedCount: regularMessages.length - recentMessages.length,
  });

  // Build context array starting with system messages or instructions
  const context = [];
  const messagesToRefine = [];

  // Add instructions at the beginning if provided
  if (instructions) {
    context.push(instructions);
  } else if (systemMessages.length > 0) {
    // Add system messages if no instructions provided
    context.push(...systemMessages);
  }

  // Now add recent messages, respecting token limits
  // Process from newest to oldest to ensure we keep the most recent ones
  const reversedRecent = [...recentMessages].reverse();
  const acceptedMessages = [];

  for (const message of reversedRecent) {
    const messageTokenCount = message.tokenCount || getTokenCount?.(message) || 0;

    // Check if adding this message would exceed token limit
    if (currentTokenCount + messageTokenCount <= remainingContextTokens) {
      acceptedMessages.unshift(message); // Add to beginning to maintain order
      currentTokenCount += messageTokenCount;
    } else {
      // This message would exceed limit, add to refine list
      messagesToRefine.unshift(message);
      logger.debug('[ContextClipFilter] Message exceeds token limit', {
        messageId: message.messageId,
        messageTokens: messageTokenCount,
        currentTotal: currentTokenCount,
        limit: remainingContextTokens,
      });
    }
  }

  // Add accepted messages to context
  context.push(...acceptedMessages);

  // All older messages that were clipped go to messagesToRefine
  const olderMessages = regularMessages.slice(0, -maxRecentMessages);
  messagesToRefine.unshift(...olderMessages);

  remainingContextTokens -= currentTokenCount;

  const result = {
    context,
    remainingContextTokens,
    messagesToRefine,
    clippedCount: messagesToRefine.length,
  };

  logger.debug('[ContextClipFilter] Context clipping complete', {
    contextSize: context.length,
    clippedCount: messagesToRefine.length,
    currentTokenCount,
    remainingContextTokens,
    tokenUtilization: `${((currentTokenCount / maxContextTokens) * 100).toFixed(1)}%`,
  });

  return result;
}

/**
 * Simple clip filter that only limits by message count (no token considerations)
 * Useful for scenarios where speed is critical and token precision is not required
 *
 * @param {Object} params
 * @param {TMessage[]} params.messages - Array of messages
 * @param {Object} [params.instructions] - System instructions
 * @param {number} [params.maxRecentMessages=10] - Max recent messages
 * @returns {{
 *   context: TMessage[],
 *   clippedCount: number
 * }}
 */
function simpleClipFilter({ messages, instructions, maxRecentMessages = 10 }) {
  const context = [];

  // Add instructions/system messages first
  if (instructions) {
    context.push(instructions);
  }

  // Separate system and regular messages
  const systemMessages = messages.filter(m => m.role === 'system' && !instructions);
  const regularMessages = messages.filter(m => m.role !== 'system');

  // Add system messages
  context.push(...systemMessages);

  // Add most recent N messages
  const recentMessages = regularMessages.slice(-maxRecentMessages);
  context.push(...recentMessages);

  const clippedCount = regularMessages.length - recentMessages.length;

  logger.debug('[SimpleClipFilter] Context clipped', {
    totalMessages: messages.length,
    contextSize: context.length,
    clippedCount,
  });

  return {
    context,
    clippedCount,
  };
}

module.exports = {
  contextClipFilter,
  simpleClipFilter,
};
