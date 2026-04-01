const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },

  // Azure Blob Storage — replaces local path
  blobName: { type: String },
  encryptionIV: { type: String, select: false },

  // Legacy local path (kept for backward compat)
  path: { type: String },

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  description: { type: String, maxlength: 500 },

  // Secure share link
  shareToken: { type: String, index: true, sparse: true },
  shareTokenExpiry: { type: Date },
  shareTokenPassword: { type: String, select: false },
  shareTokenAccessLevel: { type: String, enum: ['view', 'download'], default: 'download' }
}, { timestamps: true });

fileSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);
