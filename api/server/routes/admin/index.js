const express = require('express');
const userRoutes = require('./users');
const statsRoutes = require('./stats');
const endpointRoutes = require('./endpoints');
const apiKeyRoutes = require('./apiKeys');

const router = express.Router();

// Mount sub-routes
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);
router.use('/endpoints', endpointRoutes);
router.use('/api-keys', apiKeyRoutes);

module.exports = router;