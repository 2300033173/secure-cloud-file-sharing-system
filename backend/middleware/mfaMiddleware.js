const MFAService = require('../services/mfaService');
const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');

// Store temporary MFA sessions (in production, use Redis)
const mfaSessions = new Map();
const otpStore = new Map(); // Store OTP codes temporarily

// Middleware to check if MFA verification is required
exports.requireMFA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaEnabled +mfaSecret');

    // If MFA is not enabled, proceed
    if (!user.mfaEnabled) {
      return next();
    }

    // Check if user has a valid MFA session
    const sessionKey = `${user._id}_${req.ip}`;
    const session = mfaSessions.get(sessionKey);

    if (session && session.verified && Date.now() - session.timestamp < 300000) { // 5 minutes
      return next();
    }

    // MFA verification required
    return res.status(403).json({
      success: false,
      mfaRequired: true,
      message: 'MFA verification required for this action',
      sessionId: sessionKey
    });
  } catch (error) {
    next(error);
  }
};

// Verify MFA code for sensitive operations
exports.verifyMFAForAction = async (req, res, next) => {
  try {
    const { otp, sessionId } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP code is required'
      });
    }

    const user = await User.findById(req.user._id).select('+mfaSecret +mfaBackupCodes');

    if (!user.mfaEnabled) {
      return next();
    }

    // Verify OTP - check stored OTP first
    const otpKey = `${user._id}_${req.ip}`;
    const storedOTP = otpStore.get(otpKey);
    
    console.log(`[MFA Verify] User IP: ${req.ip}`);
    console.log(`[MFA Verify] OTP Key: ${otpKey}`);
    console.log(`[MFA Verify] Received OTP: "${otp}" (type: ${typeof otp})`);
    console.log(`[MFA Verify] Stored OTP exists: ${!!storedOTP}`);
    
    let isValid = false;
    
    // First check stored OTP (most reliable)
    if (storedOTP && Date.now() - storedOTP.timestamp < 300000) {
      console.log(`[MFA Verify] Stored OTP: "${storedOTP.otp}" (type: ${typeof storedOTP.otp})`);
      console.log(`[MFA Verify] Comparison: "${otp}" === "${storedOTP.otp}"`);
      isValid = String(storedOTP.otp) === String(otp);
      console.log(`[MFA Verify] Stored OTP match: ${isValid}`);
    } else if (storedOTP) {
      console.log('[MFA Verify] Stored OTP expired');
    } else {
      console.log('[MFA Verify] No stored OTP found');
    }
    
    // Fallback to time-based verification
    if (!isValid) {
      console.log('[MFA Verify] Trying time-based verification');
      isValid = MFAService.verifyOTP(user.mfaSecret, otp);
      console.log(`[MFA Verify] Time-based OTP Valid: ${isValid}`);
    }

    if (!isValid) {
      // Check backup codes
      const backupCodeIndex = user.mfaBackupCodes?.indexOf(otp);
      if (backupCodeIndex === -1) {
        await ActivityLogger.log(user._id, 'mfa_verification_failed', {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failure'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid OTP code'
        });
      }

      // Remove used backup code
      user.mfaBackupCodes.splice(backupCodeIndex, 1);
      await user.save();
    }

    // Create MFA session
    const sessionKey = sessionId || `${user._id}_${req.ip}`;
    mfaSessions.set(sessionKey, {
      verified: true,
      timestamp: Date.now()
    });
    
    // Delete used OTP
    otpStore.delete(otpKey);

    // Clean up old sessions
    setTimeout(() => {
      mfaSessions.delete(sessionKey);
    }, 300000); // 5 minutes

    await ActivityLogger.log(user._id, 'mfa_verification_success', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Send OTP for verification
exports.sendMFACode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaSecret +mfaEnabled');

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled for this user'
      });
    }

    // Check if mfaSecret exists, if not generate one
    if (!user.mfaSecret) {
      user.mfaSecret = MFAService.generateSecret();
      await user.save();
    }

    // Generate OTP
    const otp = MFAService.generateOTP(user.mfaSecret);
    
    // Store OTP temporarily (5 minutes)
    const otpKey = `${user._id}_${req.ip}`;
    otpStore.set(otpKey, {
      otp: otp,
      timestamp: Date.now(),
      secret: user.mfaSecret
    });
    
    // Clean up after 5 minutes
    setTimeout(() => {
      otpStore.delete(otpKey);
    }, 300000);
    
    console.log('\n========================================');
    console.log('🔐 MFA VERIFICATION CODE');
    console.log('========================================');
    console.log(`📧 User: ${user.email}`);
    console.log(`🔢 OTP CODE: ${otp}`);
    console.log(`⏱️  Expires in: 3 minutes`);
    console.log('========================================\n');

    // Send OTP via email
    const emailResult = await MFAService.sendOTPEmail(user.email, otp);

    // If phone exists, send SMS too
    if (user.phone) {
      await MFAService.sendOTPSMS(user.phone, otp);
    }

    await ActivityLogger.log(user._id, 'mfa_code_sent', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      additionalInfo: { method: user.phone ? 'email_and_sms' : 'email' }
    });

    res.status(200).json({
      success: true,
      message: emailResult.message || 'OTP sent to your registered email/phone',
      sessionId: `${user._id}_${req.ip}`,
      expiresIn: 30, // seconds
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Show OTP in development
    });
  } catch (error) {
    next(error);
  }
};

// Check MFA status
exports.checkMFAStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaEnabled');
    
    req.mfaEnabled = user.mfaEnabled;
    req.mfaRequired = user.mfaEnabled;
    
    next();
  } catch (error) {
    next(error);
  }
};
