import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Trash2, Share2, Search, Grid, List,
  FileText, FileImage, FileArchive, File, RefreshCw, Plus
} from 'lucide-react';
import { getFiles, downloadFile, deleteFile } from '../services/fileService';
import ShareModal from '../components/ShareModal';
import MFAVerificationModal from '../components/MFAVerificationModal';
import { useToast } from '../components/Toast';
import '../styles/Files.css';

const FILE_ICONS = {
  'application/pdf':  { icon: FileText,    color: '#ff3366' },
  'image/jpeg':       { icon: FileImage,   color: '#00d4ff' },
  'image/png':        { icon: FileImage,   color: '#00d4ff' },
  'image/gif':        { icon: FileImage,   color: '#00d4ff' },
  'application/zip':  { icon: FileArchive, color: '#ff6b35' },
  'text/plain':       { icon: FileText,    color: '#a855f7' },
};

const getFileIcon = (mime) => FILE_ICONS[mime] || { icon: File, color: '#94a3c4' };

const formatSize = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5].map(i => (
      <td key={i}><div className="skeleton" style={{ height: 16, width: i === 1 ? 200 : 80 }} /></td>
    ))}
  </tr>
);

const Files = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [shareModal, setShareModal] = useState({ show: false, fileId: null });
  const [mfaModal, setMfaModal] = useState({ show: false, action: null, sessionId: null, callback: null });

  const load = useCallback(async (searchTerm = search) => {
    setLoading(true);
    try {
      const d = await getFiles(searchTerm ? { search: searchTerm } : {});
      setFiles(d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { e.preventDefault(); load(search); };

  const handleDownload = async (fileId, filename) => {
    try {
      await downloadFile(fileId, filename);
      toast.success(`Downloaded "${filename}"`);
    } catch (err) {
      if (err.mfaRequired) setMfaModal({ show: true, action: `Download ${filename}`, sessionId: err.sessionId, callback: () => handleDownload(fileId, filename) });
      else toast.error(err.response?.data?.message || err.message || 'Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await deleteFile(fileId);
      setFiles(f => f.filter(x => x._id !== fileId));
      toast.success('File deleted successfully');
    } catch (err) {
      if (err.mfaRequired) setMfaModal({ show: true, action: 'Delete file', sessionId: err.sessionId, callback: () => handleDelete(fileId) });
      else toast.error(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const filtered = files.filter(f => f.originalName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="files-page">
      {/* Toolbar */}
      <div className="files-toolbar fade-up">
        <form className="search-wrap" onSubmit={handleSearch}>
          <Search size={15} className="search-icon" />
          <input className="search-input" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn-sm" onClick={load} data-tooltip="Refresh">
            <RefreshCw size={15} />
          </button>
          <div className="view-toggle">
            <button className={`view-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}><List size={15} /></button>
            <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><Grid size={15} /></button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
            <Plus size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="glass-card files-table-wrap fade-up" style={{ animationDelay: '60ms' }}>
          <table className="data-table files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <File size={40} strokeWidth={1} />
                    <p>No files found</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>Upload your first file</button>
                  </div>
                </td></tr>
              ) : filtered.map(file => {
                const { icon: Icon, color } = getFileIcon(file.mimetype);
                return (
                  <tr key={file._id} className="file-row">
                    <td>
                      <div className="file-name-cell">
                        <div className="file-type-icon" style={{ color }}>
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="file-name">{file.originalName}</p>
                          {file.tags?.length > 0 && (
                            <div className="file-tags">
                              {file.tags.slice(0, 2).map(t => <span key={t} className="file-tag">{t}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="mime-badge">{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span></td>
                    <td className="text-mono">{formatSize(file.size)}</td>
                    <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="text-mono">{file.downloadCount}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn action-download" onClick={() => handleDownload(file._id, file.originalName)} data-tooltip="Download">
                          <Download size={14} />
                        </button>
                        <button className="action-btn action-share" onClick={() => setShareModal({ show: true, fileId: file._id })} data-tooltip="Share">
                          <Share2 size={14} />
                        </button>
                        <button className="action-btn action-delete" onClick={() => handleDelete(file._id)} data-tooltip="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="files-grid fade-up" style={{ animationDelay: '60ms' }}>
          {loading ? Array(8).fill(0).map((_, i) => (
            <div key={i} className="file-grid-card glass-card">
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
            </div>
          )) : filtered.map(file => {
            const { icon: Icon, color } = getFileIcon(file.mimetype);
            return (
              <div key={file._id} className="file-grid-card glass-card">
                <div className="grid-file-icon" style={{ color }}>
                  <Icon size={32} strokeWidth={1.2} />
                </div>
                <p className="grid-file-name">{file.originalName}</p>
                <p className="grid-file-meta">{formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</p>
                <div className="grid-actions">
                  <button className="action-btn action-download" onClick={() => handleDownload(file._id, file.originalName)}><Download size={13} /></button>
                  <button className="action-btn action-share" onClick={() => setShareModal({ show: true, fileId: file._id })}><Share2 size={13} /></button>
                  <button className="action-btn action-delete" onClick={() => handleDelete(file._id)}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shareModal.show && (
        <ShareModal fileId={shareModal.fileId} onClose={() => setShareModal({ show: false, fileId: null })} onSubmit={() => setShareModal({ show: false, fileId: null })} />
      )}
      {mfaModal.show && (
        <MFAVerificationModal
          onClose={() => setMfaModal({ show: false, action: null, sessionId: null, callback: null })}
          onVerified={() => { setMfaModal(m => ({ ...m, show: false })); mfaModal.callback?.(); }}
          sessionId={mfaModal.sessionId} action={mfaModal.action}
        />
      )}
    </div>
  );
};

export default Files;
