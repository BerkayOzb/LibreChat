const express = require('express');
const EditController = require('~/server/controllers/EditController');
const { initializeClient: initializeCustomClient } = require('~/server/services/Endpoints/custom');
const { initializeClient: initializeAgentClient } = require('~/server/services/Endpoints/agents');
const { addTitle } = require('~/server/services/Endpoints/openAI');
const {
  handleAbort,
  setHeaders,
  validateModel,
  validateEndpoint,
  buildEndpointOption,
} = require('~/server/middleware');
const { autoToolFilter } = require('~/server/middleware/autoToolFilter');

const router = express.Router();

router.post(
  '/',
  validateEndpoint,
  validateModel,
  autoToolFilter,
  buildEndpointOption,
  setHeaders,
  async (req, res, next) => {
    const { logger } = require('@librechat/data-schemas');

    // If ephemeral agent is present, use agents endpoint initialization
    const initializeClient = req.body.ephemeralAgent
      ? initializeAgentClient
      : initializeCustomClient;

    const clientType = req.body.ephemeralAgent ? 'AgentClient' : 'CustomClient';
    logger.info(`[CustomRoute] Using ${clientType} for request`, {
      hasEphemeralAgent: !!req.body.ephemeralAgent,
      conversationId: req.body.conversationId,
    });

    await EditController(req, res, next, initializeClient, addTitle);
  },
);

module.exports = router;
