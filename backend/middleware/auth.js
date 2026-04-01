const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logEvent } = require('../config/azureMonitor');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }

    // Reject refresh tokens used as access tokens
    if (decoded.type !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    req.user = await User.findById(decoded.id).select('-password -mfaSecret -mfaBackupCodes');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    logEvent('AuthenticationError', { error: error.message });
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logEvent('AuthorizationError', { userId: req.user._id, role: req.user.role, requiredRoles: roles });
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to access this route`,
    });
  }
  next();
};
