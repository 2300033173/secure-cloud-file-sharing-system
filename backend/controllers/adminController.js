const User = require('../models/User');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, totalFiles, totalFileSize,
      recentActivity, actionBreakdown, dailyUploads, topUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      File.countDocuments(),
      File.aggregate([{ $group: { _id: null, total: { $sum: '$size' } } }]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      ActivityLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      File.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),
      File.aggregate([
        { $group: { _id: '$uploadedBy', fileCount: { $sum: 1 }, totalSize: { $sum: '$size' } } },
        { $sort: { fileCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { 'user.name': 1, 'user.email': 1, fileCount: 1, totalSize: 1 } }
      ])
    ]);

    const suspiciousActivity = await ActivityLog.find({
      action: 'failed_login',
      createdAt: { $gte: new Date(Date.now() - 3600000) }
    }).populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        files: { total: totalFiles, totalSize: totalFileSize[0]?.total || 0 },
        recentActivity,
        actionBreakdown,
        dailyUploads: dailyUploads.reverse(),
        topUsers,
        alerts: {
          failedLoginsLastHour: suspiciousActivity.length,
          suspicious: suspiciousActivity.length > 5
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
