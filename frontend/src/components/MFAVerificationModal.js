import React, { useState } from 'react';
import { sendMFACode, verifyMFACode } from '../services/mfaService';
import '../styles/MFAVerificationModal.css';

const MFAVerificationModal = ({ onClose, onVerified, sessionId, action }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sendMFACode();
      setCodeSent(true);
      
      // Show OTP in development mode
      if (response.otp) {
        alert(`🔐 DEVELOPMENT MODE\n\nYour OTP Code: ${response.otp}\n\nExpires in 3 minutes\n\nAlso check backend console for details.`);
      } else if (response.message && response.message.includes('Check console')) {
        alert('⚠️ Email not configured!\n\nCheck the BACKEND CONSOLE for your OTP code.\n\nLook for: [MFA] OTP Code: 123456');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyMFACode(otp, sessionId);
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-modal-overlay">
      <div className="mfa-modal">
        <button className="modal-close-btn" onClick={onClose} title="Close">
          ×
        </button>
        <h2>🔐 MFA Verification Required</h2>
        <p>This action requires multi-factor authentication.</p>
        <p className="action-text">Action: <strong>{action}</strong></p>

        {!codeSent ? (
          <div className="send-code-section">
            <p>Click below to receive a verification code via email/SMS.</p>
            <div className="info-notice">
              <strong>💡 Note:</strong> If email is not configured, check the <strong>backend console/terminal</strong> for the OTP code.
            </div>
            <button onClick={handleSendCode} disabled={loading} className="btn-primary">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="console-reminder">
              <strong>👁️ Backend Console:</strong> Look for <code>[MFA] OTP Code: 123456</code>
            </div>
            <div className="form-group">
              <label>Enter 6-digit code:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                required
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" onClick={handleSendCode} disabled={loading} className="btn-secondary">
                Resend Code
              </button>
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MFAVerificationModal;
