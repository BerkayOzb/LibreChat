const { logger } = require('@librechat/data-schemas');
const { Constants } = require('librechat-data-provider');
const { detectToolIntent, quickPatternDetection } = require('~/server/services/IntentDetectionService');
const { getAgent } = require('~/models/Agent');
const { getMCPServerTools } = require('~/server/services/Config');

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
      // IMPORTANT: Use the correct EPHEMERAL_AGENT_ID constant
      agent = {
        id: Constants.EPHEMERAL_AGENT_ID,
        name: 'Ephemeral Agent (Smart Tool Selection)',
        autoToolFilter: true, // ALWAYS enable intelligent filtering
        tools: [], // Start with empty - will be populated by intent detection
        availableTools: allAvailableTools, // Full pool of tools to select from
      };

      logger.debug('[AutoToolFilter] SMART MODE enabled for ephemeral agent', {
        agentId: agent.id,
        constantValue: Constants.EPHEMERAL_AGENT_ID,
      });
    }

    // If still no agent, skip filtering
    if (!agent) {
      return next();
    }

    logger.debug('[AutoToolFilter] Agent found:', {
      id: agent.id,
      autoToolFilter: agent.autoToolFilter,
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
    let toolsPool = agent.availableTools || agent.tools || [];

    // **NEW**: Add MCP tools to the pool for ephemeral agents
    // This allows Auto Tool Filter to intelligently select borsa-mcp tools
    if (agent.id === Constants.EPHEMERAL_AGENT_ID) {
      try {
        // Get borsa-mcp tools and add them to the pool
        const borsaMcpTools = await getMCPServerTools('borsa-mcp');
        if (borsaMcpTools && Object.keys(borsaMcpTools).length > 0) {
          const borsaToolNames = Object.keys(borsaMcpTools);
          toolsPool = [...toolsPool, ...borsaToolNames];
          logger.info('[AutoToolFilter] 📈 Added borsa-mcp tools to ephemeral agent pool', {
            borsaToolsCount: borsaToolNames.length,
            totalToolsInPool: toolsPool.length,
          });
        }
      } catch (error) {
        logger.warn('[AutoToolFilter] Failed to load borsa-mcp tools', {
          error: error.message,
        });
      }
    }

    // If no tools to filter, skip
    if (toolsPool.length === 0) {
      logger.debug('[AutoToolFilter] No tools available for filtering');
      return next();
    }

    logger.debug('[AutoToolFilter] Starting tool filtering', {
      agentId: agent.id,
      toolsPool,
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
      logger.info(`[AutoToolFilter] ✅ Quick pattern → Tools: [${selectedTools.join(', ')}]`);
    } else {
      // Step 2: Use LLM-based intent detection (slower but more accurate)
      logger.debug('[AutoToolFilter] No quick pattern match, using LLM detection');

      selectedTools = await detectToolIntent({
        userMessage,
        conversationHistory,
        availableTools: toolsPool,
        req,
      });
      logger.info(`[AutoToolFilter] 🤖 LLM detection → Tools: [${selectedTools.join(', ')}]`);
    }

    // Update agent tools in request body
    // This will be used by the agent initialization logic
    if (req.body.agent) {
      req.body.agent = {
        ...req.body.agent,
        tools: selectedTools,
      };
      logger.info('[AutoToolFilter] Updated existing req.body.agent with filtered tools', {
        selectedTools,
        agentId: req.body.agent.id,
      });
    } else {
      req.body.agent = {
        ...agent,
        tools: selectedTools,
      };
      logger.info('[AutoToolFilter] Created new req.body.agent with filtered tools', {
        selectedTools,
        agentId: agent.id,
      });
    }

    // **CRITICAL**: For ephemeral agents, also update ephemeralAgent object
    if (ephemeralAgent && agent.id === Constants.EPHEMERAL_AGENT_ID) {
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

      logger.info('[AutoToolFilter] ✨ Ephemeral agent updated', {
        selectedTools,
        ephemeralAgentState: req.body.ephemeralAgent
      });
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

module.exports = {
  autoToolFilter,
};
