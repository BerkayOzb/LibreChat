const { logger } = require('@librechat/data-schemas');
const { detectToolIntent, quickPatternDetection } = require('~/server/services/IntentDetectionService');
const { getAgent } = require('~/models/Agent');

/**
 * Auto Tool Filter Middleware
 *
 * Automatically filters agent tools based on user message intent.
 * Similar to OpenWebUI's Auto Tool Filter function.
 *
 * Workflow:
 * 1. Check if agent has autoToolFilter enabled
 * 2. Analyze user message to detect intent
 * 3. Filter agent tools to only relevant ones
 * 4. Continue with filtered tools
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
const autoToolFilter = async (req, res, next) => {
  try {
    // Extract agent info from request
    let agent = req.body.agent;
    let agentId = req.body.agent_id;
    const ephemeralAgent = req.body.ephemeralAgent;
    const conversationId = req.body.conversationId;

    // If no agentId but we have conversation, try to get agent from conversation
    if (!agentId && conversationId && !ephemeralAgent) {
      const { Conversation } = require('~/db/models');
      const conversation = await Conversation.findOne({ conversationId }).lean();
      if (conversation?.agent_id) {
        agentId = conversation.agent_id;
      }
    }

    // If no agent in body, try to load from DB
    if (!agent && agentId) {
      agent = await getAgent({ id: agentId });
    }

    // Handle ephemeral agents - SMART MODE
    if (!agent && ephemeralAgent) {
      // **SMART MODE**: For ephemeral agents, ALWAYS enable auto tool filtering
      // with ALL available tools, regardless of what's enabled in ephemeralAgent
      const allAvailableTools = ['nano-banana', 'flux', 'dalle', 'web_search', 'execute_code', 'file_search'];

      // Create a virtual agent for ephemeral mode with autoToolFilter ALWAYS enabled
      agent = {
        id: 'ephemeral',
        name: 'Ephemeral Agent (Smart Tool Selection)',
        autoToolFilter: true, // ALWAYS enable intelligent filtering
        tools: [], // Start with empty - will be populated by intent detection
        availableTools: allAvailableTools, // Full pool of tools to select from
      };

      logger.debug('[AutoToolFilter] SMART MODE enabled for ephemeral agent');
    }

    // If still no agent, skip filtering
    if (!agent) {
      return next();
    }

    logger.info('[AutoToolFilter] Agent found:', {
      id: agent.id,
      name: agent.name,
      autoToolFilter: agent.autoToolFilter,
      tools: agent.tools,
      availableTools: agent.availableTools,
    });

    // Check if auto tool filter is enabled for this agent
    if (!agent.autoToolFilter) {
      logger.debug('[AutoToolFilter] Auto tool filter disabled for agent', {
        agentId: agent.id,
        agentName: agent.name,
      });
      return next();
    }

    // Get user message
    const userMessage = req.body.text || '';
    if (!userMessage || typeof userMessage !== 'string') {
      logger.debug('[AutoToolFilter] No user message found, skipping filter');
      return next();
    }

    // Get conversation history
    const conversationHistory = req.body.messages || [];

    // Determine available tools pool
    // Priority: availableTools > tools
    const toolsPool = agent.availableTools || agent.tools || [];

    // If no tools to filter, skip
    if (toolsPool.length === 0) {
      logger.debug('[AutoToolFilter] No tools available for filtering');
      return next();
    }

    logger.info('[AutoToolFilter] Starting tool filtering', {
      agentId: agent.id,
      agentName: agent.name,
      toolsPool,
      messageLength: userMessage.length,
    });

    // Step 1: Try quick pattern detection (fast path)
    const quickDetection = quickPatternDetection(userMessage, toolsPool);
    let selectedTools;

    if (quickDetection.detected) {
      // Quick pattern matched, use those tools
      selectedTools = quickDetection.tools;
      logger.info('[AutoToolFilter] Quick pattern detected', {
        pattern: 'matched',
        selectedTools,
      });
    } else {
      // Step 2: Use LLM-based intent detection (slower but more accurate)
      logger.debug('[AutoToolFilter] No quick pattern match, using LLM detection');

      selectedTools = await detectToolIntent({
        userMessage,
        conversationHistory,
        availableTools: toolsPool,
        req,
      });
    }

    // Log the filtering result
    logger.info('[AutoToolFilter] Tool filtering complete', {
      agentId: agent.id,
      originalTools: toolsPool,
      selectedTools,
      filtered: toolsPool.length !== selectedTools.length,
    });

    // Update agent tools in request body
    // This will be used by the agent initialization logic
    if (req.body.agent) {
      req.body.agent = {
        ...req.body.agent,
        tools: selectedTools,
      };
    } else {
      req.body.agent = {
        ...agent,
        tools: selectedTools,
      };
    }

    // **CRITICAL**: For ephemeral agents, also update ephemeralAgent object
    if (ephemeralAgent && agent.id === 'ephemeral') {
      // Reset all tools to false first
      req.body.ephemeralAgent = {
        'nano-banana': false,
        flux: false,
        dalle: false,
        web_search: false,
        execute_code: false,
        file_search: false,
        artifacts: ephemeralAgent.artifacts || false,
        mcp: ephemeralAgent.mcp || [],
      };

      // Enable only selected tools
      selectedTools.forEach(tool => {
        req.body.ephemeralAgent[tool] = true;
      });

      logger.debug('[AutoToolFilter] Ephemeral agent tools updated', { selectedTools });
    }

    // Add metadata for debugging/logging
    req.autoToolFilterApplied = true;
    req.originalTools = toolsPool;
    req.filteredTools = selectedTools;

    logger.info('[AutoToolFilter] Tool filtering complete', {
      selectedTools,
      filtered: toolsPool.length !== selectedTools.length,
    });

    next();
  } catch (error) {
    // On error, log and continue without filtering
    logger.error('[AutoToolFilter] Error in auto tool filter middleware', {
      error: error.message,
      stack: error.stack,
    });

    // Don't block the request on error
    next();
  }
};

/**
 * Optional: Status emitter for debugging
 * Can be used to send status updates to the client
 */
const emitFilterStatus = (eventEmitter, message, done = false) => {
  if (!eventEmitter) {
    return;
  }

  try {
    eventEmitter({
      type: 'status',
      data: {
        description: message,
        done,
      },
    });
  } catch (error) {
    logger.error('[AutoToolFilter] Error emitting status', { error: error.message });
  }
};

module.exports = {
  autoToolFilter,
  emitFilterStatus,
};
