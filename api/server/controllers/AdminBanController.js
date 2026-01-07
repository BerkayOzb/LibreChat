const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { ViolationTypes, CacheKeys } = require('librechat-data-provider');
const { normalizeHttpError } = require('@librechat/api');
const { User } = require('~/db/models');

/**
 * Get the logs collection directly from mongoose
 * @returns {Collection}
 */
const getLogsCollection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection not ready');
  }
  return mongoose.connection.db.collection('logs');
};

/**
 * Parse ban record value from stored JSON
 * @param {string} value - JSON string value
 * @returns {Object} Parsed ban data
 */
const parseBanValue = (value) => {
  try {
    const parsed = JSON.parse(value);
    return parsed.value || parsed;
  } catch {
    return { value };
  }
};

/**
 * Determine ban type from key
 * @param {string} key - Ban record key
 * @returns {Object} Ban type info
 */
const parseBanKey = (key) => {
  // Key formats: BANS:userId, BANS:ip, ban:userId, ban:ip
  const isBansPrefix = key.startsWith('BANS:');
  const isBanPrefix = key.startsWith('ban:');

  if (!isBansPrefix && !isBanPrefix) {
    return { type: 'unknown', target: key };
  }

  const target = isBansPrefix ? key.substring(5) : key.substring(4);

  // Check if target is an IP address (basic check)
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(target) || target.includes(':');

  return {
    type: isIP ? 'ip' : 'user',
    target,
    permanent: isBanPrefix, // ban: prefix indicates permanent
    namespace: isBansPrefix ? 'BANS' : 'ban',
  };
};

/**
 * Get all ban records
 * @route GET /api/admin/bans
 * @access Admin
 */
const getAllBans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = '', // 'user' or 'ip' or ''
      search = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const logsCollection = getLogsCollection();

    // Build query for ban records
    // Keys start with 'BANS:' or 'ban:'
    const query = {
      $or: [
        { key: { $regex: '^BANS:' } },
        { key: { $regex: '^ban:' } },
      ],
    };

    // Add search filter if provided
    if (search) {
      query.$and = [
        { $or: query.$or },
        { key: { $regex: search, $options: 'i' } },
      ];
      delete query.$or;
    }

    // Execute queries in parallel
    const [records, totalCount] = await Promise.all([
      logsCollection.find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      logsCollection.countDocuments(query),
    ]);

    // Transform records to include parsed data
    const bans = await Promise.all(records.map(async (record) => {
      const keyInfo = parseBanKey(record.key);
      const banData = parseBanValue(record.value);

      // Try to get user info if it's a user ban
      let userInfo = null;
      if (keyInfo.type === 'user') {
        try {
          const user = await User.findById(keyInfo.target)
            .select('email username name')
            .lean();
          if (user) {
            userInfo = {
              email: user.email,
              username: user.username,
              name: user.name,
            };
          }
        } catch {
          // User not found or invalid ID
        }
      }

      return {
        _id: record._id.toString(),
        key: record.key,
        type: keyInfo.type,
        target: keyInfo.target,
        permanent: keyInfo.permanent,
        namespace: keyInfo.namespace,
        violationType: banData.type || 'unknown',
        violationCount: banData.violation_count || 0,
        duration: banData.duration || null,
        expiresAt: banData.expiresAt || banData.expires || null,
        linkedUserId: banData.user_id || null,
        userInfo,
        createdAt: record._id.getTimestamp?.() || null,
      };
    }));

    // Filter by type if specified
    let filteredBans = bans;
    if (type === 'user' || type === 'ip') {
      filteredBans = bans.filter(b => b.type === type);
    }

    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate statistics
    const stats = {
      total: totalCount,
      users: bans.filter(b => b.type === 'user').length,
      ips: bans.filter(b => b.type === 'ip').length,
      permanent: bans.filter(b => b.permanent).length,
      temporary: bans.filter(b => !b.permanent).length,
    };

    res.status(200).json({
      bans: filteredBans,
      stats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        pageSize: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      message: 'Ban records retrieved successfully',
    });
  } catch (error) {
    logger.error('[getAllBans]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Remove a specific ban record by MongoDB _id
 * @route DELETE /api/admin/bans/:id
 * @access Admin
 */
const removeBanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid ban record ID is required' });
    }

    const logsCollection = getLogsCollection();

    // Find the record first
    const record = await logsCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!record) {
      return res.status(404).json({ message: 'Ban record not found' });
    }

    // Verify it's a ban record
    if (!record.key.startsWith('BANS:') && !record.key.startsWith('ban:')) {
      return res.status(400).json({ message: 'Record is not a ban entry' });
    }

    // Delete the record
    const result = await logsCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Failed to delete ban record' });
    }

    const keyInfo = parseBanKey(record.key);
    logger.info(`[removeBanById] Admin ${req.user.email} removed ban: ${record.key} (${keyInfo.type})`);

    res.status(200).json({
      message: 'Ban removed successfully',
      removed: {
        key: record.key,
        type: keyInfo.type,
        target: keyInfo.target,
      },
    });
  } catch (error) {
    logger.error('[removeBanById]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Remove all ban records for a specific target (user ID or IP)
 * @route DELETE /api/admin/bans/target/:target
 * @access Admin
 */
const removeBansByTarget = async (req, res) => {
  try {
    const { target } = req.params;

    if (!target) {
      return res.status(400).json({ message: 'Target (user ID or IP) is required' });
    }

    const logsCollection = getLogsCollection();

    // Build query to find all ban records for this target
    const query = {
      $or: [
        { key: `BANS:${target}` },
        { key: `ban:${target}` },
      ],
    };

    // Count before deletion
    const count = await logsCollection.countDocuments(query);

    if (count === 0) {
      return res.status(404).json({ message: 'No ban records found for this target' });
    }

    // Delete all matching records
    const result = await logsCollection.deleteMany(query);

    logger.info(`[removeBansByTarget] Admin ${req.user.email} removed ${result.deletedCount} ban records for target: ${target}`);

    res.status(200).json({
      message: `Successfully removed ${result.deletedCount} ban record(s)`,
      removed: {
        target,
        count: result.deletedCount,
      },
    });
  } catch (error) {
    logger.error('[removeBansByTarget]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Clear all expired bans
 * @route POST /api/admin/bans/clear-expired
 * @access Admin
 */
const clearExpiredBans = async (req, res) => {
  try {
    const logsCollection = getLogsCollection();
    const now = Date.now();

    // Find all ban records
    const banRecords = await logsCollection.find({
      $or: [
        { key: { $regex: '^BANS:' } },
        { key: { $regex: '^ban:' } },
      ],
    }).toArray();

    let clearedCount = 0;
    const expiredIds = [];

    for (const record of banRecords) {
      try {
        const banData = parseBanValue(record.value);
        const expiresAt = banData.expiresAt || banData.expires;

        // Check if expired (has expiry and it's in the past)
        if (expiresAt && expiresAt <= now) {
          expiredIds.push(record._id);
        }
      } catch {
        // Skip records that can't be parsed
      }
    }

    if (expiredIds.length > 0) {
      const result = await logsCollection.deleteMany({
        _id: { $in: expiredIds },
      });
      clearedCount = result.deletedCount;
    }

    logger.info(`[clearExpiredBans] Admin ${req.user.email} cleared ${clearedCount} expired ban records`);

    res.status(200).json({
      message: `Cleared ${clearedCount} expired ban record(s)`,
      clearedCount,
    });
  } catch (error) {
    logger.error('[clearExpiredBans]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get ban statistics
 * @route GET /api/admin/bans/stats
 * @access Admin
 */
const getBanStats = async (req, res) => {
  try {
    const logsCollection = getLogsCollection();
    const now = Date.now();

    // Get all ban records
    const banRecords = await logsCollection.find({
      $or: [
        { key: { $regex: '^BANS:' } },
        { key: { $regex: '^ban:' } },
      ],
    }).toArray();

    let stats = {
      total: banRecords.length,
      byType: {
        user: 0,
        ip: 0,
      },
      byNamespace: {
        BANS: 0,
        ban: 0,
      },
      byViolationType: {},
      active: 0,
      expired: 0,
      permanent: 0,
    };

    for (const record of banRecords) {
      const keyInfo = parseBanKey(record.key);
      const banData = parseBanValue(record.value);

      // Count by type
      if (keyInfo.type === 'user') stats.byType.user++;
      else if (keyInfo.type === 'ip') stats.byType.ip++;

      // Count by namespace
      if (keyInfo.namespace === 'BANS') stats.byNamespace.BANS++;
      else if (keyInfo.namespace === 'ban') stats.byNamespace.ban++;

      // Count by violation type
      const violationType = banData.type || 'unknown';
      stats.byViolationType[violationType] = (stats.byViolationType[violationType] || 0) + 1;

      // Count active vs expired vs permanent
      const expiresAt = banData.expiresAt || banData.expires;
      if (!expiresAt || expiresAt === null) {
        stats.permanent++;
      } else if (expiresAt > now) {
        stats.active++;
      } else {
        stats.expired++;
      }
    }

    res.status(200).json({
      stats,
      message: 'Ban statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('[getBanStats]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

module.exports = {
  getAllBans,
  removeBanById,
  removeBansByTarget,
  clearExpiredBans,
  getBanStats,
};
