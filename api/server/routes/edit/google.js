const express = require('express');
const EditController = require('~/server/controllers/EditController');
const { initializeClient: initializeGoogleClient } = require('~/server/services/Endpoints/google');
const { initializeClient: initializeAgentClient } = require('~/server/services/Endpoints/agents');
const {
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
    // If ephemeral agent is present, use agents endpoint initialization
    const initializeClient = req.body.ephemeralAgent
      ? initializeAgentClient
      : initializeGoogleClient;

    await EditController(req, res, next, initializeClient);
  },
);

module.exports = router;
