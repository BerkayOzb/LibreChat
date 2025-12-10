const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { User, Organization } = require('~/db/models');
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
/**
 * Get conversation statistics breakdown by organization
 */
const getOrganizationConversationBreakdown = async (today, thisWeek) => {
  const organizations = await Organization.find({});
  const stats = await Promise.all(
    organizations.map(async (org) => {
      const orgUserIds = await User.find({ organization: org._id }).distinct('_id');
      const [totalConversations, conversationsToday, conversationsThisWeek] = await Promise.all([
        Conversation.countDocuments({ user: { $in: orgUserIds } }),
        Conversation.countDocuments({ user: { $in: orgUserIds }, createdAt: { $gte: today } }),
        Conversation.countDocuments({ user: { $in: orgUserIds }, createdAt: { $gte: thisWeek } }),
      ]);
      return {
        organizationId: org._id,
        organizationName: org.name,
        organizationCode: org.code,
        userCount: orgUserIds.length,
        totalConversations,
        conversationsToday,
        conversationsThisWeek,
      };
    }),
  );
  return stats.sort((a, b) => b.totalConversations - a.totalConversations);
};

const getSystemOverviewController = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalConversations,
      conversationsToday,
      conversationsThisWeek,
      conversationsThisMonth,
      activeUsersToday,
      activeUsersWeek,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      bannedUsers,
      organizationConversationStats,
    ] = await Promise.all([
      User.countDocuments({}),
      Conversation.countDocuments({}),
      Conversation.countDocuments({ createdAt: { $gte: today } }),
      Conversation.countDocuments({ createdAt: { $gte: thisWeek } }),
      Conversation.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ lastLoginAt: { $gte: today } }),
      User.countDocuments({ lastLoginAt: { $gte: thisWeek } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: thisWeek } }),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ banned: true }),
      getOrganizationConversationBreakdown(today, thisWeek),
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
      conversations: {
        total: totalConversations,
        today: conversationsToday,
        thisWeek: conversationsThisWeek,
        thisMonth: conversationsThisMonth,
      },
      organizationConversationStats,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[getSystemOverviewController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get AI Models (Open Router) usage statistics
 * Aggregates model usage from conversations with custom endpoints
 */
const getAIModelsUsageController = async (req, res) => {
  try {
    const { period = '30d', endpoint = 'AI Models' } = req.query;

    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };

    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get model usage from conversations for the specified endpoint
    const modelUsageFromConversations = await Conversation.aggregate([
      {
        $match: {
          endpoint: endpoint,
          model: { $exists: true, $ne: null },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$model',
          totalConversations: { $sum: 1 },
          conversationsToday: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] },
          },
          conversationsThisWeek: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, 1, 0] },
          },
          lastUsed: { $max: '$createdAt' },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          model: '$_id',
          totalConversations: 1,
          conversationsToday: 1,
          conversationsThisWeek: 1,
          lastUsed: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          _id: 0,
        },
      },
      { $sort: { totalConversations: -1 } },
    ]);

    // Get token usage from transactions for models found in conversations
    const modelNames = modelUsageFromConversations.map((m) => m.model);

    let tokenUsageByModel = [];
    if (modelNames.length > 0) {
      tokenUsageByModel = await Transaction.aggregate([
        {
          $match: {
            model: { $in: modelNames },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$model',
            totalTokens: { $sum: { $abs: '$rawAmount' } },
            totalValue: { $sum: { $abs: '$tokenValue' } },
            promptTokens: {
              $sum: {
                $cond: [{ $eq: ['$tokenType', 'prompt'] }, { $abs: '$rawAmount' }, 0],
              },
            },
            completionTokens: {
              $sum: {
                $cond: [{ $eq: ['$tokenType', 'completion'] }, { $abs: '$rawAmount' }, 0],
              },
            },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $project: {
            model: '$_id',
            totalTokens: 1,
            totalValue: 1,
            promptTokens: 1,
            completionTokens: 1,
            transactionCount: 1,
            _id: 0,
          },
        },
      ]);
    }

    // Merge conversation stats with token stats
    const tokenUsageMap = {};
    tokenUsageByModel.forEach((t) => {
      tokenUsageMap[t.model] = t;
    });

    const modelStats = modelUsageFromConversations.map((convStats) => ({
      ...convStats,
      totalTokens: tokenUsageMap[convStats.model]?.totalTokens || 0,
      totalValue: tokenUsageMap[convStats.model]?.totalValue || 0,
      promptTokens: tokenUsageMap[convStats.model]?.promptTokens || 0,
      completionTokens: tokenUsageMap[convStats.model]?.completionTokens || 0,
      transactionCount: tokenUsageMap[convStats.model]?.transactionCount || 0,
    }));

    // Calculate totals
    const totals = modelStats.reduce(
      (acc, stat) => ({
        totalConversations: acc.totalConversations + stat.totalConversations,
        totalTokens: acc.totalTokens + stat.totalTokens,
        totalValue: acc.totalValue + stat.totalValue,
        promptTokens: acc.promptTokens + stat.promptTokens,
        completionTokens: acc.completionTokens + stat.completionTokens,
        conversationsToday: acc.conversationsToday + stat.conversationsToday,
        conversationsThisWeek: acc.conversationsThisWeek + stat.conversationsThisWeek,
      }),
      {
        totalConversations: 0,
        totalTokens: 0,
        totalValue: 0,
        promptTokens: 0,
        completionTokens: 0,
        conversationsToday: 0,
        conversationsThisWeek: 0,
      },
    );

    res.status(200).json({
      endpoint,
      period,
      totals,
      modelStats,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[getAIModelsUsageController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

module.exports = {
  getUserStatsController,
  getActivityStatsController,
  getRegistrationStatsController,
  getSystemOverviewController,
  getAIModelsUsageController,
};