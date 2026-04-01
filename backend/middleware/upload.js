const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.txt', '.zip',
]);

// Magic byte signatures for MIME validation (prevents MIME spoofing)
const MAGIC_BYTES = [
  { mime: 'image/jpeg',  bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',   bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',   bytes: [0x47, 0x49, 0x46] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', bytes: [0x50, 0x4B, 0x03, 0x04] },
  { mime: 'application/x-zip-compressed', bytes: [0x50, 0x4B, 0x03, 0x04] },
];

const validateMagicBytes = (buffer, declaredMime) => {
  const sig = MAGIC_BYTES.find(m => m.mime === declaredMime);
  if (!sig) return true; // No magic bytes defined for this type — allow (txt, doc, etc.)
  return sig.bytes.every((b, i) => buffer[i] === b);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
  // Extension/MIME mismatch check
  const mimeExtMap = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  };
  const allowedExts = mimeExtMap[file.mimetype];
  if (allowedExts && !allowedExts.includes(ext)) {
    return cb(new Error('File extension does not match MIME type'));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, files: 1 },
  fileFilter,
});

// Post-upload magic byte validation middleware
upload.validateMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ success: false, message: 'File content does not match declared type' });
  }
  next();
};

module.exports = upload;
