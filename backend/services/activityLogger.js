const ActivityLog = require('../models/ActivityLog');
const { logEvent } = require('../config/azureMonitor');

class ActivityLogger {
  static async log(userId, action, details = {}) {
    try {
      if (!userId || typeof userId === 'string' && userId === 'unknown') return;
      const logEntry = await ActivityLog.create({
        user: userId,
        action: action,
        resource: details.resource,
        resourceId: details.resourceId,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        status: details.status || 'success',
        details: details.additionalInfo
      });

      logEvent(action, {
        userId: userId,
        ...details
      });

      return logEntry;
    } catch (error) {
      console.error('Activity logging failed:', error.message);
    }
  }
}

module.exports = ActivityLogger;
