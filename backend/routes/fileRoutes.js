const express = require('express');
const router = express.Router();
const {
  uploadFile, getFiles, downloadFile, deleteFile,
  shareFile, generateShareLink, accessShareLink
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { requireMFA } = require('../middleware/mfaMiddleware');
const upload = require('../middleware/upload');
const { fileShareValidation, validate } = require('../middleware/validator');

// Public share link (no auth required)
router.route('/share/link/:token').get(accessShareLink).post(accessShareLink);

router.post('/upload', protect, upload.single('file'), upload.validateMagicBytes, uploadFile);
router.get('/', protect, getFiles);
router.get('/download/:id', protect, requireMFA, downloadFile);
router.delete('/:id', protect, requireMFA, deleteFile);
router.post('/share', protect, requireMFA, fileShareValidation, validate, shareFile);
router.post('/share/generate', protect, generateShareLink);

module.exports = router;
