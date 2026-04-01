import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, X, CloudUpload } from 'lucide-react';
import { uploadFile } from '../services/fileService';
import { useToast } from '../components/Toast';
import '../styles/Upload.css';

const Upload = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  const formatSize = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading'); setProgress(0); setErrorMsg('');
    try {
      await uploadFile(file, description, tags, (p) => setProgress(p));
      setStatus('success');
      toast.success(`"${file.name}" uploaded successfully!`);
      setTimeout(() => navigate('/files'), 1800);
    } catch (err) {
      setStatus('error');
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-layout">
        {/* Drop Zone */}
        <div
          className={`drop-zone glass-card ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''} fade-up`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" hidden
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={e => setFile(e.target.files[0])}
          />
          {!file ? (
            <div className="drop-content">
              <div className="drop-icon"><CloudUpload size={40} strokeWidth={1.2} /></div>
              <p className="drop-title">Drop your file here</p>
              <p className="drop-sub">or <span className="drop-link">browse to upload</span></p>
              <p className="drop-hint">PDF, Images, Docs, ZIP · Max 10 MB</p>
            </div>
          ) : (
            <div className="file-preview">
              <div className="preview-icon"><File size={32} strokeWidth={1.2} /></div>
              <div className="preview-info">
                <p className="preview-name">{file.name}</p>
                <p className="preview-size">{formatSize(file.size)}</p>
              </div>
              <button className="preview-remove" onClick={e => { e.stopPropagation(); setFile(null); setStatus(null); }}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="upload-form-card glass-card fade-up" style={{ animationDelay: '80ms' }}>
          <h3 className="upload-form-title">File Details</h3>

          {status === 'success' && (
            <div className="upload-status success">
              <CheckCircle size={16} /> File uploaded successfully! Redirecting...
            </div>
          )}
          {status === 'error' && (
            <div className="upload-status error">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group">
              <label className="form-label">Description <span className="optional">(optional)</span></label>
              <textarea
                className="form-input upload-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a description for this file..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags <span className="optional">(optional)</span></label>
              <input
                className="form-input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="work, finance, q4 (comma-separated)"
              />
            </div>

            {status === 'uploading' && (
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-pct">{progress}%</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={!file || status === 'uploading' || status === 'success'}
            >
              {status === 'uploading' ? (
                <><span className="btn-spinner" /> Uploading {progress}%</>
              ) : (
                <><UploadIcon size={18} /> Upload Securely</>
              )}
            </button>
          </form>

          <div className="upload-security-note">
            <div className="security-note-icon">🔒</div>
            <p>Files are encrypted with AES-256-CBC before storage in Azure Blob Storage.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
