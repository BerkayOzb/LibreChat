const { logger } = require('@librechat/data-schemas');
const { Tools } = require('librechat-data-provider');

/**
 * Tool categories for intelligent filtering
 * Maps tool types to their respective tool IDs
 *
 * IMPORTANT: Tools are listed in PRIORITY order (first = highest priority)
 * - For single-tool intents, only the first available tool will be selected
 * - For multi-tool intents, all relevant tools may be selected
 */
const TOOL_CATEGORIES = {
  // Image generation tools (priority: nano-banana > flux > dalle)
  imageGeneration: ['nano-banana', 'flux', 'dalle'],

  // Web search tools (priority: web_search > google > tavily)
  webSearch: ['web_search', 'google', 'tavily'],

  // Code execution tools
  codeExecution: ['execute_code'],

  // File search tools
  fileSearch: ['file_search'],
};

/**
 * Prompt template for intent detection
 * This will be used to ask the LLM which tools are needed for the current request
 */
const INTENT_DETECTION_TEMPLATE = `You are a tool selection assistant. Your ONLY job is to analyze user messages and return a JSON array of tool IDs that are needed.

Available Tools:
{{TOOLS}}

Conversation History (most recent first):
{{HISTORY}}

Current User Message:
"{{MESSAGE}}"

Task: Analyze the user's message and select which tools are needed.

Rules:
1. **SINGLE TOOL PREFERENCE**: For most requests, return ONLY ONE tool (the most appropriate one)
2. **MULTIPLE TOOLS**: Only use multiple tools if the request EXPLICITLY requires multiple actions
3. If requesting IMAGE/VISUAL/PICTURE generation: return ONLY ["nano-banana"] (fastest option)
4. If requesting WEB SEARCH/RESEARCH/LATEST INFO: return ONLY ["web_search"]
5. If requesting CODE EXECUTION: return ["execute_code"]
6. If requesting FILE SEARCH: return ["file_search"]
7. If NO TOOLS are needed (e.g., general conversation, knowledge questions): return []
8. Only return tool IDs that are in the available tools list

Important:
- **PREFER SINGLE TOOL**: Unless explicitly needed, use only ONE tool
- Only return tools that DIRECTLY match the user's request
- Do NOT return image tools for non-image requests
- Do NOT return search tools for questions you can answer directly
- Format: ["tool_id"] for single tool, ["tool1", "tool2"] for multiple, or []
- ONLY return the JSON array, absolutely NO other text or explanation

Examples:
- "Create a sunset image" → ["nano-banana"]
- "Search for latest AI news" → ["web_search"]
- "What is Python?" → []
- "Search for Eiffel Tower and create its image" → ["web_search", "nano-banana"]

Response:`;

/**
 * Detects which tools should be used based on the user's message intent
 *
 * @param {Object} params
 * @param {string} params.userMessage - The current user message
 * @param {Array<Object>} params.conversationHistory - Recent conversation messages
 * @param {Array<string>} params.availableTools - Array of tool IDs available to the agent
 * @param {Object} params.req - Express request object
 * @returns {Promise<Array<string>>} Array of tool IDs to use
 */
const detectToolIntent = async ({
  userMessage,
  conversationHistory = [],
  availableTools = [],
  req,
}) => {
  try {
    // If no tools available, return empty array
    if (!availableTools || availableTools.length === 0) {
      return [];
    }

    // Build available tools description
    const toolsDescription = availableTools
      .map((toolId) => {
        const category = Object.keys(TOOL_CATEGORIES).find((cat) =>
          TOOL_CATEGORIES[cat].includes(toolId),
        );
        const categoryLabel = category
          ? `(${category.replace(/([A-Z])/g, ' $1').trim()})`
          : '';
        return `- ${toolId} ${categoryLabel}`;
      })
      .join('\n');

    // Build conversation history (last 4 messages)
    const historyText = conversationHistory
      .slice(-4)
      .reverse()
      .map((msg) => `${(msg.role || 'user').toUpperCase()}: "${msg.content || msg.text || ''}"`)
      .join('\n');

    // Build the prompt
    const prompt = INTENT_DETECTION_TEMPLATE.replace('{{TOOLS}}', toolsDescription)
      .replace('{{HISTORY}}', historyText || 'No previous messages')
      .replace('{{MESSAGE}}', userMessage || '');

    // Use lightweight model for intent detection
    const intentDetectionModel = process.env.INTENT_DETECTION_MODEL || 'gpt-4o-mini';
    const intentDetectionProvider = process.env.INTENT_DETECTION_PROVIDER || 'openai';

    logger.debug('[IntentDetection] Analyzing message intent', {
      userMessage: userMessage?.substring(0, 100),
      availableTools,
      model: intentDetectionModel,
    });

    // Prepare request for chat completion
    const { generateChatCompletion } = require('~/server/services/Endpoints/openAI');

    const payload = {
      model: intentDetectionModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 100, // Short response
      user: req.user?.id,
    };

    // Make the LLM call
    const response = await generateChatCompletion({
      req,
      res: null,
      endpointOption: {
        model: intentDetectionModel,
        endpoint: intentDetectionProvider,
      },
      payload,
      onlyCompletion: true,
    });

    let content = response?.choices?.[0]?.message?.content;
    if (!content) {
      logger.warn('[IntentDetection] No content in response, falling back to all tools');
      return availableTools;
    }

    logger.debug('[IntentDetection] Raw LLM response', { content });

    // Parse the response - extract JSON array
    content = content.trim();

    // Handle various response formats
    // 1. Already JSON array: ["tool1", "tool2"]
    // 2. With markdown: ```json\n["tool1"]\n```
    // 3. With text: "Here are the tools: ["tool1"]"

    // Remove markdown code blocks
    content = content.replace(/```json?\n?/g, '').replace(/```/g, '');

    // Extract array pattern [...]
    const arrayMatch = content.match(/\[.*?\]/s);
    if (!arrayMatch) {
      logger.warn('[IntentDetection] No array found in response, falling back to all tools');
      return availableTools;
    }

    // Parse the JSON array
    let selectedTools = JSON.parse(arrayMatch[0]);

    // Validate it's an array
    if (!Array.isArray(selectedTools)) {
      logger.warn('[IntentDetection] Response is not an array, falling back to all tools');
      return availableTools;
    }

    // Filter to only valid tools that are in availableTools
    selectedTools = selectedTools.filter((tool) => {
      if (typeof tool !== 'string') {
        return false;
      }
      return availableTools.includes(tool);
    });

    logger.info('[IntentDetection] Selected tools', {
      userMessage: userMessage?.substring(0, 100),
      selectedTools,
      availableTools,
    });

    return selectedTools;
  } catch (error) {
    logger.error(`[IntentDetection] Error detecting intent: ${error.message}`);
    logger.error(`[IntentDetection] Error details:`, error);
    logger.error(`[IntentDetection] User message: "${userMessage?.substring(0, 100)}"`);

    // Fallback: Try quick pattern detection first
    logger.info('[IntentDetection] Falling back to quick pattern detection');
    const quickResult = quickPatternDetection(userMessage, availableTools);
    logger.info(`[IntentDetection] Quick pattern result: detected=${quickResult.detected}, tools=${JSON.stringify(quickResult.tools)}`);
    if (quickResult.detected) {
      logger.info(`[IntentDetection] ✅ Fallback pattern match → Tools: [${quickResult.tools.join(', ')}]`);
      return quickResult.tools;
    }
    // If no pattern detected, return the first available tool from each category as a safe default
    // This is better than returning ALL tools
    const fallbackTools = [];
    for (const category of Object.keys(TOOL_CATEGORIES)) {
      const firstTool = TOOL_CATEGORIES[category].find((tool) =>
        availableTools.includes(tool),
      );
      if (firstTool && !fallbackTools.includes(firstTool)) {
        fallbackTools.push(firstTool);
      }
    }
    logger.warn('[IntentDetection] Using fallback tools (first from each category)', {
      fallbackTools,
    });
    logger.warn(`[IntentDetection] ⚠️ Fallback → Tools: [${fallbackTools.join(', ')}]`);
    return fallbackTools.length > 0 ? fallbackTools : availableTools;
  }
};

/**
 * Quick pattern-based intent detection (fallback/cache)
 * Uses regex patterns to detect common intents without LLM call
 *
 * @param {string} message - User message
 * @param {Array<string>} availableTools - Available tools
 * @returns {Object} { detected: boolean, tools: Array<string> }
 */
const quickPatternDetection = (message, availableTools) => {
  if (!message || typeof message !== 'string') {
    return { detected: false, tools: availableTools };
  }

  const lowerMessage = message.toLowerCase();

  // Image generation patterns (broadened for better detection)
  const imagePatterns = [
    // English patterns - broad
    /\b(create|generate|make|draw|design|produce|show me)\b.*\b(image|picture|photo|visual|illustration|artwork|graphic|pic)\b/i,
    /\b(image|picture|photo|visual|illustration|artwork|pic)\b.*\b(of|showing|with|depicting|for)\b/i,
    /\b(draw|sketch|illustrate|visualize|depict)\b/i,
    // Turkish patterns - flexible matching without strict word boundaries (to handle Turkish suffixes)
    /(resim|foto[ğg]raf|g[öo]rsel)/i,  // Matches any form: resim, resmi, resmin, resimler, görsel, görseli, görselini, etc.
    /(olu[şs]tur|[üu]ret|[çc]iz|haz[ıi]rla|yap)/i,  // Matches: oluştur, üret, çiz, hazırla, yap and their conjugations
    // Common phrases
    /bir\s+.*\s*(g[öo]rsel|resim|foto[ğg]raf)/i,
  ];

  for (const pattern of imagePatterns) {
    if (pattern.test(lowerMessage)) {
      // Find the FIRST available image generation tool (highest priority)
      const firstImageTool = TOOL_CATEGORIES.imageGeneration.find((tool) =>
        availableTools.includes(tool),
      );
      // Return only the first (highest priority) tool, or empty array if none available
      return { detected: true, tools: firstImageTool ? [firstImageTool] : [] };
    }
  }

  // Web search patterns
  const searchPatterns = [
    /\b(search|find|look up|research|investigate|latest|recent|current|news)\b/i,
    /\b(ara|ara[şs]t[ıi]r|bul|son|g[üu]ncel|haber)\b/iu,
    /\bwhat (is|are) the (latest|recent|current)\b/i,
  ];

  for (const pattern of searchPatterns) {
    if (pattern.test(lowerMessage)) {
      // Find the FIRST available web search tool (highest priority)
      const firstSearchTool = TOOL_CATEGORIES.webSearch.find((tool) =>
        availableTools.includes(tool),
      );
      // Return only the first (highest priority) tool, or empty array if none available
      return { detected: true, tools: firstSearchTool ? [firstSearchTool] : [] };
    }
  }

  // No clear pattern detected
  return { detected: false, tools: availableTools };
};

module.exports = {
  detectToolIntent,
  quickPatternDetection,
  TOOL_CATEGORIES,
};
