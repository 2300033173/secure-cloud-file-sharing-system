import React, { useState } from 'react';
import { X, Mail, Link2, Clock, Lock, Copy, Check, Share2, Eye, EyeOff } from 'lucide-react';
import { generateShareLink } from '../services/fileService';
import './ShareModal.css';

const ShareModal = ({ onClose, onSubmit, fileId }) => {
  const [tab, setTab] = useState('user');
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [expiry, setExpiry] = useState('24');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [linkAccess, setLinkAccess] = useState('download');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleUserShare = (e) => {
    e.preventDefault();
    onSubmit(email, accessLevel);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const d = await generateShareLink(fileId, { expiresInHours: parseInt(expiry), password: password || undefined, accessLevel: linkAccess });
      setGenerated(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div className="modal-head-icon"><Share2 size={18} /></div>
          <div>
            <h2 className="modal-title">Share File</h2>
            <p className="modal-sub">Choose how to share this file</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'user' ? 'active' : ''}`} onClick={() => setTab('user')}>
            <Mail size={14} /> Share with User
          </button>
          <button className={`modal-tab ${tab === 'link' ? 'active' : ''}`} onClick={() => setTab('link')}>
            <Link2 size={14} /> Generate Link
          </button>
        </div>

        <div className="modal-body">
          {/* User Share Tab */}
          {tab === 'user' && (
            <form onSubmit={handleUserShare} className="modal-form">
              <div className="form-group">
                <label className="form-label">Recipient Email</label>
                <div className="input-icon-wrap">
                  <Mail size={15} className="input-icon" />
                  <input className="form-input input-with-icon" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Access Level</label>
                <select className="form-input" value={accessLevel} onChange={e => setAccessLevel(e.target.value)}>
                  <option value="view">View Only</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Share File</button>
              </div>
            </form>
          )}

          {/* Link Tab */}
          {tab === 'link' && !generated && (
            <form onSubmit={handleGenerate} className="modal-form">
              {error && <div className="modal-error">{error}</div>}
              <div className="form-group">
                <label className="form-label"><Clock size={12} /> Expires In</label>
                <select className="form-input" value={expiry} onChange={e => setExpiry(e.target.value)}>
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Access Level</label>
                <select className="form-input" value={linkAccess} onChange={e => setLinkAccess(e.target.value)}>
                  <option value="view">View Only</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><Lock size={12} /> Password Protection <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <div className="input-icon-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    className="form-input input-with-icon"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Leave blank for no password"
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Generating...</> : <><Link2 size={15} /> Generate Link</>}
                </button>
              </div>
            </form>
          )}

          {/* Generated Link */}
          {tab === 'link' && generated && (
            <div className="link-result">
              <div className="link-success-banner">
                <Check size={16} /> Link generated successfully!
              </div>
              <div className="link-copy-row">
                <input className="form-input link-input" readOnly value={generated.shareUrl} />
                <button className={`btn ${copied ? 'btn-success' : 'btn-primary'} copy-btn`} onClick={handleCopy}>
                  {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
                </button>
              </div>
              <div className="link-meta-row">
                <span className="link-meta-item"><Clock size={12} /> Expires {new Date(generated.expiresAt).toLocaleString()}</span>
                {generated.passwordProtected && <span className="link-meta-item"><Lock size={12} /> Password protected</span>}
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setGenerated(null)}>Generate New</button>
                <button className="btn btn-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
