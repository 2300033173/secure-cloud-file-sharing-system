const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const File = require('../models/File');
const Permission = require('../models/Permission');
const User = require('../models/User');
const ActivityLogger = require('../services/activityLogger');
const azureBlob = require('../config/azureBlob');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || './uploads');

// Retry helper for transient Azure errors
const withRetry = async (fn, retries = 3, delayMs = 500) => {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
};

// ─── Upload ────────────────────────────────────────────────────────────────────
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const blobName = `${req.user._id}/${crypto.randomUUID()}${ext}`;
    let fileData = { path: null, blobName: null, encryptionIV: null };

    if (azureBlob.isReady()) {
      const { blobName: uploadedBlob, iv } = await withRetry(() =>
        azureBlob.uploadFile(req.file.buffer, blobName, req.file.mimetype)
      );
      fileData = { blobName: uploadedBlob, encryptionIV: iv };
    } else {
      // Local fallback — safe filename, no path traversal
      const safeFilename = `${req.user._id}-${crypto.randomUUID()}${ext}`;
      const localPath = path.join(UPLOAD_DIR, safeFilename);
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(localPath, req.file.buffer);
      fileData.path = localPath;
    }

    const file = await File.create({
      filename: blobName,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      ...fileData,
    });

    await ActivityLogger.log(req.user._id, 'file_upload', {
      resource: 'file', resourceId: file._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      additionalInfo: { filename: file.originalName, size: file.size, storage: azureBlob.isReady() ? 'azure' : 'local' },
    });

    res.status(201).json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
};

// ─── List Files ────────────────────────────────────────────────────────────────
exports.getFiles = async (req, res, next) => {
  try {
    const { search, tag, page = 1, limit = 20 } = req.query;
    const query = { uploadedBy: req.user._id };

    if (search) query.originalName = { $regex: search, $options: 'i' };
    if (tag) query.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [files, total] = await Promise.all([
      File.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('uploadedBy', 'name email'),
      File.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: files.length, total, page: parseInt(page), data: files });
  } catch (error) {
    next(error);
  }
};

// ─── Download ──────────────────────────────────────────────────────────────────
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('+encryptionIV');
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const hasPermission = isOwner || req.user.role === 'Admin' ||
      await Permission.findOne({ file: file._id, sharedWith: req.user._id, isActive: true });

    if (!hasPermission) return res.status(403).json({ success: false, message: 'Access denied' });

    file.downloadCount += 1;
    await file.save();

    await ActivityLogger.log(req.user._id, 'file_download', {
      resource: 'file', resourceId: file._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      additionalInfo: { filename: file.originalName }
    });

    if (file.blobName && azureBlob.isReady()) {
      const buffer = await azureBlob.downloadFile(file.blobName);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimetype);
      return res.send(buffer);
    }

    // Local fallback
    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
};

// ─── Delete ────────────────────────────────────────────────────────────────────
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (file.blobName && azureBlob.isReady()) {
      await azureBlob.deleteFile(file.blobName);
    } else if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    await file.deleteOne();
    await Permission.deleteMany({ file: file._id });

    await ActivityLogger.log(req.user._id, 'file_delete', {
      resource: 'file', resourceId: file._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      additionalInfo: { filename: file.originalName }
    });

    res.status(200).json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Share with User ───────────────────────────────────────────────────────────
exports.shareFile = async (req, res, next) => {
  try {
    const { fileId, sharedWithEmail, accessLevel, expiresInHours } = req.body;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const sharedWithUser = await User.findOne({ email: sharedWithEmail });
    if (!sharedWithUser) return res.status(404).json({ success: false, message: 'User not found' });

    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : undefined;

    const permission = await Permission.findOneAndUpdate(
      { file: fileId, sharedWith: sharedWithUser._id },
      { sharedBy: req.user._id, accessLevel: accessLevel || 'view', isActive: true, expiresAt },
      { upsert: true, new: true }
    );

    await ActivityLogger.log(req.user._id, 'file_share', {
      resource: 'file', resourceId: file._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      additionalInfo: { sharedWith: sharedWithEmail, accessLevel }
    });

    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

// ─── Generate Secure Share Link ────────────────────────────────────────────────
exports.generateShareLink = async (req, res, next) => {
  try {
    const { fileId, expiresInHours = 24, password, accessLevel = 'download' } = req.body;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + expiresInHours * 3600000);

    file.shareToken = token;
    file.shareTokenExpiry = expiry;
    file.shareTokenAccessLevel = accessLevel;
    file.shareTokenPassword = password ? await bcrypt.hash(password, 10) : undefined;
    await file.save();

    const shareUrl = `${process.env.FRONTEND_URL}/share/${token}`;

    res.status(200).json({
      success: true,
      shareUrl,
      expiresAt: expiry,
      passwordProtected: !!password
    });
  } catch (error) {
    next(error);
  }
};

// ─── Access Shared Link ────────────────────────────────────────────────────────
exports.accessShareLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const file = await File.findOne({ shareToken: token }).select('+shareTokenPassword +encryptionIV');
    if (!file || !file.shareTokenExpiry || file.shareTokenExpiry < new Date()) {
      return res.status(404).json({ success: false, message: 'Link expired or invalid' });
    }

    if (file.shareTokenPassword) {
      if (!password) return res.status(401).json({ success: false, message: 'Password required', passwordRequired: true });
      const valid = await bcrypt.compare(password, file.shareTokenPassword);
      if (!valid) return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    if (file.shareTokenAccessLevel === 'download') {
      file.downloadCount += 1;
      await file.save();

      if (file.blobName && azureBlob.isReady()) {
        const buffer = await azureBlob.downloadFile(file.blobName);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimetype);
        return res.send(buffer);
      }
      return res.download(file.path, file.originalName);
    }

    res.status(200).json({
      success: true,
      data: { originalName: file.originalName, size: file.size, mimetype: file.mimetype, createdAt: file.createdAt }
    });
  } catch (error) {
    next(error);
  }
};
