import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMFAStatus, enableMFA, disableMFA, regenerateBackupCodes } from '../services/mfaService';
import '../styles/MFASettings.css';

const MFASettings = () => {
  const { user } = useContext(AuthContext);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      const data = await getMFAStatus();
      setMfaEnabled(data.mfaEnabled);
      setPhone(data.phone || '');
    } catch (error) {
      console.error('Failed to load MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const data = await enableMFA(phone || undefined);
      setMfaEnabled(true);
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setMessage({ type: 'success', text: 'MFA enabled successfully! Please save your backup codes.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to enable MFA' });
    }
  };

  const handleDisableMFA = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!password) {
      setMessage({ type: 'error', text: 'Password is required to disable MFA' });
      return;
    }

    if (!window.confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return;
    }

    try {
      await disableMFA(password);
      setMfaEnabled(false);
      setPassword('');
      setBackupCodes([]);
      setShowBackupCodes(false);
      setMessage({ 
        type: 'success', 
        text: 'MFA disabled successfully' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to disable MFA' 
      });
    }
  };

  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    if (!window.confirm('Are you sure? This will invalidate all existing backup codes.')) {
      return;
    }

    try {
      const data = await regenerateBackupCodes(password);
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setPassword('');
      setMessage({ 
        type: 'success', 
        text: 'Backup codes regenerated successfully! Please save them.' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to regenerate backup codes' 
      });
    }
  };

  const downloadBackupCodes = () => {
    const content = `Backup Codes for ${user.email}\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mfa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Backup codes copied to clipboard!' });
  };

  if (loading) return <div className="loading">Loading MFA settings...</div>;

  return (
    <div className="mfa-settings-container">
      <h1>🔐 Multi-Factor Authentication Settings</h1>
      <p className="mfa-subtitle">
        Add an extra layer of security to your account
      </p>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="mfa-status-card">
        <div className="status-header">
          <h2>MFA Status</h2>
          <span className={`status-badge ${mfaEnabled ? 'enabled' : 'disabled'}`}>
            {mfaEnabled ? '✅ Enabled' : '⚠️ Disabled'}
          </span>
        </div>
        <p className="status-description">
          {mfaEnabled 
            ? 'Your account is protected with multi-factor authentication. You will need to enter a verification code when downloading, deleting, or sharing files.'
            : 'Enable MFA to add an extra layer of security to your account. You will receive a verification code via email or SMS for sensitive operations.'}
        </p>
      </div>

      {!mfaEnabled ? (
        <div className="mfa-enable-section">
          <h2>Enable Multi-Factor Authentication</h2>
          <form onSubmit={handleEnableMFA}>
            <div className="form-group">
              <label>Phone Number (Optional but recommended)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="form-input"
              />
              <small>Used for SMS verification. Format: +[country code][number]</small>
            </div>

            <div className="info-box">
              <h3>📱 What happens when you enable MFA?</h3>
              <ul>
                <li>You'll receive 10 backup codes - save them securely</li>
                <li>When downloading files, you'll need to verify with a code</li>
                <li>Codes are sent to your email{phone && ' and phone'}</li>
                <li>Each code is valid for 30 seconds</li>
                <li>After verification, you have 5 minutes before needing to verify again</li>
              </ul>
            </div>

            <button type="submit" className="btn-enable-mfa">
              Enable MFA
            </button>
          </form>
        </div>
      ) : (
        <div className="mfa-manage-section">
          <div className="mfa-info-card">
            <h2>MFA Information</h2>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            {phone && (
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{phone}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Protected Operations:</span>
              <span className="info-value">Download, Delete, Share Files</span>
            </div>
          </div>

          <div className="mfa-actions">
            <h2>Manage MFA</h2>

            <div className="action-card">
              <h3>🔄 Regenerate Backup Codes</h3>
              <p>Generate new backup codes. This will invalidate all existing codes.</p>
              <form onSubmit={handleRegenerateBackupCodes}>
                <div className="form-group">
                  <label>Enter your password to confirm</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="form-input"
                  />
                </div>
                <button type="submit" className="btn-regenerate">
                  Regenerate Backup Codes
                </button>
              </form>
            </div>

            <div className="action-card danger">
              <h3>⚠️ Disable MFA</h3>
              <p>This will remove the extra security layer from your account.</p>
              <form onSubmit={handleDisableMFA}>
                <div className="form-group">
                  <label>Enter your password to confirm</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="form-input"
                  />
                </div>
                <button type="submit" className="btn-disable-mfa">
                  Disable MFA
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showBackupCodes && backupCodes.length > 0 && (
        <div className="backup-codes-modal">
          <div className="modal-content">
            <h2>🔑 Your Backup Codes</h2>
            <div className="warning-box">
              <p>⚠️ <strong>Important:</strong> Save these codes in a secure location. Each code can only be used once.</p>
              <p>You can use these codes if you don't have access to your email or phone.</p>
            </div>

            <div className="backup-codes-grid">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">
                  <span className="code-number">{index + 1}.</span>
                  <span className="code-value">{code}</span>
                </div>
              ))}
            </div>

            <div className="backup-codes-actions">
              <button onClick={downloadBackupCodes} className="btn-download">
                📥 Download Codes
              </button>
              <button onClick={copyBackupCodes} className="btn-copy">
                📋 Copy to Clipboard
              </button>
              <button 
                onClick={() => setShowBackupCodes(false)} 
                className="btn-close"
              >
                ✓ I've Saved My Codes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mfa-help-section">
        <h2>❓ Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>What is Multi-Factor Authentication?</h3>
          <p>MFA adds an extra layer of security by requiring a verification code in addition to your password when performing sensitive operations like downloading files.</p>
        </div>

        <div className="faq-item">
          <h3>When will I need to enter a code?</h3>
          <p>You'll need to verify when downloading, deleting, or sharing files. After verification, you have a 5-minute session before needing to verify again.</p>
        </div>

        <div className="faq-item">
          <h3>What if I lose my phone?</h3>
          <p>Use one of your backup codes to access your account. Each backup code can be used once. You can then regenerate new backup codes.</p>
        </div>

        <div className="faq-item">
          <h3>How long are verification codes valid?</h3>
          <p>Verification codes are valid for 30 seconds. If a code expires, you can request a new one.</p>
        </div>

        <div className="faq-item">
          <h3>Can I disable MFA?</h3>
          <p>Yes, but we strongly recommend keeping it enabled for better security. You'll need to enter your password to disable MFA.</p>
        </div>
      </div>
    </div>
  );
};

export default MFASettings;
