import api from './authService';

// Get MFA status
export const getMFAStatus = async () => {
  const response = await api.get('/mfa/status');
  return response.data;
};

// Enable MFA
export const enableMFA = async (phone) => {
  const response = await api.post('/mfa/enable', { phone });
  return response.data;
};

// Disable MFA
export const disableMFA = async (password) => {
  const response = await api.post('/mfa/disable', { password });
  return response.data;
};

// Regenerate backup codes
export const regenerateBackupCodes = async (password) => {
  const response = await api.post('/mfa/regenerate-backup-codes', { password });
  return response.data;
};

// Send MFA code
export const sendMFACode = async () => {
  const response = await api.post('/mfa/send-code');
  return response.data;
};

// Verify MFA code
export const verifyMFACode = async (otp, sessionId) => {
  const response = await api.post('/mfa/verify-code', { otp, sessionId });
  return response.data;
};
