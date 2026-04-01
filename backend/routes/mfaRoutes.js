const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendMFACode, verifyMFAForAction } = require('../middleware/mfaMiddleware');
const { enableMFA, disableMFA, getMFAStatus, regenerateBackupCodes } = require('../controllers/mfaController');

// MFA Management Routes
router.post('/enable', protect, enableMFA);
router.post('/disable', protect, disableMFA);
router.get('/status', protect, getMFAStatus);
router.post('/regenerate-backup-codes', protect, regenerateBackupCodes);

// MFA Verification Routes
router.post('/send-code', protect, sendMFACode);
router.post('/verify-code', protect, verifyMFAForAction, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MFA verification successful'
  });
});

module.exports = router;
