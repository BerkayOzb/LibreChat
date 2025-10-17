const { logger } = require('@librechat/data-schemas');

/**
 * Audit logging middleware for admin actions
 * Logs all admin operations with details
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the admin action
      const auditData = {
        timestamp: new Date().toISOString(),
        adminUser: {
          id: req.user?.id,
          email: req.user?.email,
        },
        action,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: sanitizeBody(req.body),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection?.remoteAddress,
        responseStatus: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 300,
      };

      // Log to audit trail
      if (auditData.success) {
        logger.info(`[AUDIT] ${action}`, auditData);
      } else {
        logger.warn(`[AUDIT_FAILED] ${action}`, auditData);
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Admin action audit middleware factory
 */
const adminAudit = {
  createUser: auditLog('CREATE_USER'),
  updateUserRole: auditLog('UPDATE_USER_ROLE'),
  banUser: auditLog('BAN_USER'),
  deleteUser: auditLog('DELETE_USER'),
  viewUsers: auditLog('VIEW_USERS'),
  viewUserDetails: auditLog('VIEW_USER_DETAILS'),
  viewStats: auditLog('VIEW_STATS'),
};

module.exports = {
  auditLog,
  adminAudit,
};