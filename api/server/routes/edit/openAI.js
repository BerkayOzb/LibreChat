const express = require('express');
const EditController = require('~/server/controllers/EditController');
const { initializeClient } = require('~/server/services/Endpoints/openAI');
const {
  setHeaders,
  validateModel,
  validateEndpoint,
  buildEndpointOption,
  moderateText,
} = require('~/server/middleware');
const { autoToolFilter } = require('~/server/middleware/autoToolFilter');

const router = express.Router();
router.use(moderateText);

router.post(
  '/',
  validateEndpoint,
  validateModel,
  autoToolFilter,
  buildEndpointOption,
  setHeaders,
  async (req, res, next) => {
    await EditController(req, res, next, initializeClient);
  },
);

module.exports = router;
