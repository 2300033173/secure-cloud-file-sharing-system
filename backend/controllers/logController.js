const ActivityLog = require('../models/ActivityLog');

exports.getLogs = async (req, res, next) => {
  try {
    const { action, status, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (req.user.role !== 'Admin') query.user = req.user._id;
    else if (userId) query.user = userId;

    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const File = require('../models/File');
    const ActivityLog = require('../models/ActivityLog');
    const isAdmin = req.user.role === 'Admin';
    const logFilter = isAdmin ? {} : { user: req.user._id };

    // Files stats
    const [totalFiles, categoryFiles] = await Promise.all([
      File.countDocuments({ uploadedBy: req.user._id }),
      File.aggregate([
        { $match: { uploadedBy: req.user._id } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: '$mimetype', regex: '^image/' } }, then: 'Images' },
                  { case: { $regexMatch: { input: '$mimetype', regex: '^application/(pdf|msword|vnd\\.)' } }, then: 'Documents' },
                  { case: { $regexMatch: { input: '$mimetype', regex: '^application/(zip|x-zip|x-tar|x-gzip)' } }, then: 'Archives' },
                  { case: { $regexMatch: { input: '$mimetype', regex: '^text/' } }, then: 'Text' }
                ],
                default: 'Others'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    // Log stats
    const [byAction, byStatus] = await Promise.all([
      ActivityLog.aggregate([
        { $match: logFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $match: logFilter },
        { $group: { _id: '$status', value: { $sum: 1 } } }
      ])
    ]);

    const totalEvents = byAction.reduce((sum, a) => sum + a.count, 0);
    const successCount = byStatus.find(s => s._id === 'success')?.value || 0;
    const successRate = totalEvents ? Math.round((successCount / totalEvents) * 100) : 0;
    const failedCount = byStatus.find(s => s._id === 'failure')?.value || 0;

    // Recent files
    const recentFiles = await File.find({ uploadedBy: req.user._id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(3)
      .select('originalName createdAt')
      .lean();

    // Recent uploads (file_upload logs with filename)
    const recentUploads = await ActivityLog.find({ user: req.user._id, action: 'file_upload' })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('user', 'name')
      .lean();

    // Recent activity
    const recentActivity = await ActivityLog.find(logFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        files: { total: totalFiles, categories: categoryFiles },
        stats: { totalEvents, successRate, successCount, failedCount, byAction },
        recentFiles,
        recentUploads,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLogStats = async (req, res, next) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const logFilter = req.user.role !== 'Admin' ? { user: req.user._id } : {};
    const matchStage = { $match: logFilter };

    const [byAction, byStatus, byDay] = await Promise.all([
      ActivityLog.aggregate([matchStage, { $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      ActivityLog.aggregate([matchStage, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      ActivityLog.aggregate([
        matchStage,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 14 }
      ])
    ]);

    res.status(200).json({ success: true, data: { byAction, byStatus, byDay: byDay.reverse() } });
  } catch (error) {
    next(error);
  }
};

