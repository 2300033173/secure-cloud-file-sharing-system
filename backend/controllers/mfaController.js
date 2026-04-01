const User = require('../models/User');
const MFAService = require('../services/mfaService');
const ActivityLogger = require('../services/activityLogger');

// Enable MFA for user
exports.enableMFA = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ ADD THIS (MISSING USER FETCH)
    const user = await User.findById(req.user._id).select('+mfaEnabled +mfaSecret +mfaBackupCodes');

    // ✅ ADD THIS (SAFETY CHECK)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled'
      });
    }

    // Generate MFA secret and backup codes
    const mfaSecret = MFAService.generateSecret();
    const backupCodes = MFAService.generateBackupCodes();

    user.mfaEnabled = true;
    user.mfaSecret = mfaSecret;
    user.mfaBackupCodes = backupCodes;

    if (phone) user.phone = phone;

    await user.save();

    await ActivityLogger.log(user._id, 'mfa_enabled', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
      backupCodes: backupCodes,
      warning: 'Save these backup codes in a secure location. You will not be able to see them again.'
    });

  } catch (error) {
    console.error("Enable MFA Error:", error); // ✅ added debug
    next(error);
  }
};

// Disable MFA for user
exports.disableMFA = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable MFA'
      });
    }

    const user = await User.findById(req.user._id).select('+password +mfaEnabled');

    // ✅ ADD THIS
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = undefined;

    await user.save();

    await ActivityLogger.log(user._id, 'mfa_disabled', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    console.error("Disable MFA Error:", error); // ✅ debug
    next(error);
  }
};

// Get MFA status
exports.getMFAStatus = async (req, res, next) => {
  try {
    // ✅ ADD AUTH CHECK
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id).select('+mfaEnabled +phone');

    // ✅ ADD THIS
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      mfaEnabled: user.mfaEnabled || false,
      phone: user.phone || null
    });

  } catch (error) {
    console.error("Get MFA Status Error:", error);
    next(error);
  }
};

// Regenerate backup codes
exports.regenerateBackupCodes = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const user = await User.findById(req.user._id).select('+password +mfaEnabled +mfaBackupCodes');

    // ✅ ADD THIS
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate new backup codes
    const backupCodes = MFAService.generateBackupCodes();
    user.mfaBackupCodes = backupCodes;

    await user.save();

    await ActivityLogger.log(user._id, 'mfa_backup_codes_regenerated', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Backup codes regenerated successfully',
      backupCodes: backupCodes,
      warning: 'Save these backup codes in a secure location. Old codes are now invalid.'
    });

  } catch (error) {
    console.error("Regenerate Backup Error:", error);
    next(error);
  }
};