const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

class MFAService {
  // Generate a secret key for the user
  static generateSecret() {
    return crypto.randomBytes(20).toString('hex');
  }

  // Generate a 6-digit OTP code
  static generateOTP(secret) {
    const timestamp = Math.floor(Date.now() / 180000); // 180-second window (3 minutes)
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(Buffer.from(timestamp.toString()));
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  // Verify OTP code with time tolerance
  static verifyOTP(secret, code) {
    console.log(`[MFA Service] Verifying code: ${code}`);
    
    // Check current window
    const currentOTP = this.generateOTP(secret);
    console.log(`[MFA Service] Current OTP: ${currentOTP}`);
    
    if (currentOTP === code) {
      console.log('[MFA Service] Match found in current window');
      return true;
    }
    
    // Check previous window (for time drift tolerance)
    const previousTimestamp = Math.floor(Date.now() / 180000) - 1;
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(Buffer.from(previousTimestamp.toString()));
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const previousCode = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    const previousOTP = previousCode.toString().padStart(6, '0');
    console.log(`[MFA Service] Previous OTP: ${previousOTP}`);
    
    if (previousOTP === code) {
      console.log('[MFA Service] Match found in previous window');
      return true;
    }
    
    console.log('[MFA Service] No match found');
    return false;
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Send OTP via email
  static async sendOTPEmail(email, otp) {
    console.log(`[MFA] OTP Code: ${otp} (expires in 3 minutes)`);
    
    try {
      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log(`[MFA] Email not configured. OTP: ${otp}`);
        return {
          success: true,
          message: `Email not configured. Check console for OTP: ${otp}`
        };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: '🔐 Your MFA Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9ff; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 MFA Verification</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Your verification code is:</p>
              <div style="background: #f8f9ff; border: 3px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px;">⏱️ This code will expire in <strong>3 minutes</strong></p>
              <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">Secure Cloud File Sharing System</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`[MFA] Email sent successfully to ${email}`);
      
      return {
        success: true,
        message: `OTP sent to ${email}`
      };
    } catch (error) {
      console.error('[MFA] Email send error:', error.message);
      console.log(`[MFA] Fallback - OTP Code: ${otp}`);
      return {
        success: true,
        message: `Email failed. Check console for OTP: ${otp}`
      };
    }
  }

  // Send OTP via SMS (simulation - requires Twilio integration)
  static async sendOTPSMS(phone, otp) {
    console.log(`[MFA] SMS OTP to ${phone}: ${otp}`);
    // To enable SMS: Install twilio package and configure
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({
    //   body: `Your MFA code is: ${otp}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone
    // });
    return {
      success: true,
      message: `SMS not configured. OTP: ${otp}`
    };
  }
}

module.exports = MFAService;
