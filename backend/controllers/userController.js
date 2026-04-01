const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ActivityLogger.log(req.user._id, 'role_change', {
      resource: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      additionalInfo: { targetUser: user.email, newRole: role }
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ActivityLogger.log(req.user._id, 'user_update', {
      resource: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      additionalInfo: { action: 'deactivate', targetUser: user.email }
    });

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
