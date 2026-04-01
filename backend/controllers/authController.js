const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');

const generateAccessToken = (id) =>
  jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });

const sendTokens = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      azureAdId: user.azureAdId,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ email, name, password, role: role || 'User' });
    await ActivityLogger.log(user._id, 'user_create', { ipAddress: req.ip, userAgent: req.get('user-agent') });
    sendTokens(res, user, 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      if (user?._id) {
        await ActivityLogger.log(user._id, 'failed_login', {
          status: 'failure', ipAddress: req.ip, userAgent: req.get('user-agent'), additionalInfo: { email },
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = Date.now();
    await user.save();
    await ActivityLogger.log(user._id, 'login', { ipAddress: req.ip, userAgent: req.get('user-agent') });
    sendTokens(res, user);
  } catch (error) {
    next(error);
  }
};

// ── Azure AD SSO ──────────────────────────────────────────────────────────────
// Receives the decoded MSAL account info from the frontend (after popup/redirect)
// and upserts the user in MongoDB, then issues our own JWT.
exports.azureLogin = async (req, res, next) => {
  try {
    const { azureAdId, email, name } = req.body;

    if (!azureAdId || !email) {
      return res.status(400).json({ success: false, message: 'Azure AD token data missing' });
    }

    // Find by azureAdId first, then fall back to email
    let user = await User.findOne({ azureAdId });

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link existing email account to Azure AD
        user.azureAdId = azureAdId;
        if (!user.name && name) user.name = name;
        await user.save();
      } else {
        // Create new user from Azure AD — no password required
        user = await User.create({
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          password: require('crypto').randomBytes(32).toString('hex'), // random unusable password
          azureAdId,
          role: 'User',
          mfaEnabled: false,
        });
        await ActivityLogger.log(user._id, 'user_create', {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          additionalInfo: { method: 'azure_ad' },
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = Date.now();
    await user.save();

    await ActivityLogger.log(user._id, 'login', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      additionalInfo: { method: 'azure_ad' },
    });

    sendTokens(res, user);
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found' });

    sendTokens(res, user);
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    await ActivityLogger.log(req.user._id, 'logout', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch {}
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.status(200).json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
