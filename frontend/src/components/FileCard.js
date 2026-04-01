import React from 'react';
import '../styles/FileCard.css';

const FileCard = ({ file, onDownload, onDelete, onShare }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="file-card">
      <div className="file-icon">📄</div>
      <div className="file-info">
        <h3>{file.originalName}</h3>
        <p className="file-meta">
          Size: {formatFileSize(file.size)} | Uploaded: {formatDate(file.createdAt)}
        </p>
        {file.description && <p className="file-description">{file.description}</p>}
        <p className="file-downloads">Downloads: {file.downloadCount}</p>
      </div>
      <div className="file-actions">
        <button onClick={() => onDownload(file._id, file.originalName)} className="btn-download">
          Download
        </button>
        <button onClick={() => onShare(file._id)} className="btn-share">
          Share
        </button>
        <button onClick={() => onDelete(file._id)} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
};

export default FileCard;
