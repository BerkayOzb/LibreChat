const express = require('express');
const userRoutes = require('./users');
const statsRoutes = require('./stats');

const router = express.Router();

// Mount sub-routes
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);

module.exports = router;