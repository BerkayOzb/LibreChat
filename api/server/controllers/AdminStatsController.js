const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { User } = require('~/db/models');
const { getMessage } = require('~/models');
const { Conversation, Transaction } = require('~/db/models');
const { normalizeHttpError } = require('@librechat/api');

/**
 * Get user statistics
 */
const getUserStatsController = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      usersByRole,
      usersByProvider,
    ] = await Promise.all([
      // Total users count
      User.countDocuments({}),
      
      // Active users (logged in within last 30 days)
      User.countDocuments({ 
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      
      // Banned users count
      User.countDocuments({ banned: true }),
      
      // Users by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { role: '$_id', count: 1, _id: 0 } }
      ]),
      
      // Users by provider
      User.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } },
        { $project: { provider: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    // Transform role data
    const roleStats = {
      [SystemRoles.USER]: 0,
      [SystemRoles.ADMIN]: 0,
    };
    usersByRole.forEach(item => {
      if (item.role) {
        roleStats[item.role] = item.count;
      }
    });

    // Transform provider data
    const providerStats = {};
    usersByProvider.forEach(item => {
      providerStats[item.provider || 'email'] = item.count;
    });

    res.status(200).json({
      totalUsers,
      activeUsers,
      bannedUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: roleStats,
      usersByProvider: providerStats,
    });
  } catch (error) {
    logger.error('[getUserStatsController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get activity statistics
 */
const getActivityStatsController = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      dailyActiveUsers,
      conversationCounts,
      messageCounts,
    ] = await Promise.all([
      // Daily active users
      User.aggregate([
        {
          $match: {
            lastLoginAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$lastLoginAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Conversation counts by day
      Conversation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Message counts (this might need adjustment based on your message storage)
      getMessage ? 
        getMessage.aggregate ? 
          getMessage.aggregate([
            {
              $match: {
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]) : []
        : []
    ]);

    res.status(200).json({
      period,
      dailyActiveUsers,
      conversationCounts,
      messageCounts,
    });
  } catch (error) {
    logger.error('[getActivityStatsController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get registration statistics
 */
const getRegistrationStatsController = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      registrationsByDay,
      registrationsByProvider,
      totalRegistrations,
    ] = await Promise.all([
      // Registrations by day
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Registrations by provider
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$provider',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            provider: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]),
      
      // Total registrations in period
      User.countDocuments({
        createdAt: { $gte: startDate }
      })
    ]);

    res.status(200).json({
      period,
      totalRegistrations,
      registrationsByDay,
      registrationsByProvider,
    });
  } catch (error) {
    logger.error('[getRegistrationStatsController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get system overview statistics
 */
const getSystemOverviewController = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalConversations,
      activeUsersToday,
      activeUsersWeek,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments({}),
      Conversation.countDocuments({}),
      User.countDocuments({ lastLoginAt: { $gte: today } }),
      User.countDocuments({ lastLoginAt: { $gte: thisWeek } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: thisWeek } }),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ banned: true }),
    ]);

    res.status(200).json({
      // Flatten structure for frontend compatibility
      totalUsers,
      totalConversations,
      totalMessages: 0, // Can be enhanced later with actual message count
      activeUsers: activeUsersWeek,
      activeUsersToday,
      newUsersThisMonth: newUsersMonth,
      overview: {
        totalUsers,
        totalConversations,
        bannedUsers,
      },
      activity: {
        activeUsersToday,
        activeUsersWeek,
      },
      growth: {
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[getSystemOverviewController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

module.exports = {
  getUserStatsController,
  getActivityStatsController,
  getRegistrationStatsController,
  getSystemOverviewController,
};