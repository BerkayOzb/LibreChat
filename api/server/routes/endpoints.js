const express = require('express');
const endpointController = require('~/server/controllers/EndpointController');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const router = express.Router();
router.get('/', requireJwtAuth, endpointController);

module.exports = router;
