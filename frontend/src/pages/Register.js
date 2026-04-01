import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { loginRequest } from '../config/msalConfig';
import './Auth.css';

const PERKS = [
  '10 GB encrypted cloud storage',
  'Azure AD single sign-on',
  'GDPR & SOC 2 compliant',
  'Real-time audit logging',
  'Role-based access control',
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [azureLoading, setAzureLoading] = useState(false);
  const { register, azureLogin } = useContext(AuthContext);
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleAzureLogin = async () => {
    setError(''); setAzureLoading(true);
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result?.account) {
        await azureLogin(result.account);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.errorCode !== 'user_cancelled') {
        setError('Microsoft sign-in failed. Please try again.');
      }
    } finally { setAzureLoading(false); }
  };

  const fields = [
    { key: 'name',    label: 'Full Name',        type: 'text',     icon: User,  placeholder: 'John Smith' },
    { key: 'email',   label: 'Work Email',        type: 'email',    icon: Mail,  placeholder: 'you@company.com' },
    { key: 'password',label: 'Password',          type: showPw ? 'text' : 'password', icon: Lock, placeholder: 'Min. 8 characters', pw: true },
    { key: 'confirm', label: 'Confirm Password',  type: showPw ? 'text' : 'password', icon: Lock, placeholder: 'Re-enter password' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-hex-grid" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-layout">
        {/* ── Left Panel ── */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <Lock size={22} strokeWidth={2.5} />
              </div>
              <div>
                <span className="auth-brand-name">VaultShare</span>
                <span className="auth-brand-tag">Enterprise</span>
              </div>
            </div>

            <div className="auth-hero">
              <div className="auth-hero-eyebrow">
                <span className="eyebrow-dot" />
                Join 10,000+ enterprises
              </div>
              <h1 className="auth-hero-title">
                Secure by<br />
                <span className="auth-hero-gradient">Default</span>
              </h1>
              <p className="auth-hero-sub">
                Start sharing files with enterprise-grade security in minutes. No credit card required.
              </p>
            </div>

            <div className="auth-perks">
              {PERKS.map(p => (
                <div key={p} className="auth-perk-row">
                  <CheckCircle size={15} className="perk-check" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            <div className="auth-powered">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg"
                alt="Azure" className="auth-azure-logo"
              />
              <span>Powered by Microsoft Azure</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-accent" />

            <div className="auth-card-header">
              <h2 className="auth-card-title">Create account</h2>
              <p className="auth-card-sub">Set up your secure workspace in seconds</p>
            </div>

            <button
              className="auth-ms-btn"
              onClick={handleAzureLogin}
              disabled={azureLoading || loading}
            >
              {azureLoading ? (
                <span className="btn-spinner" />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  alt="Microsoft" width="20" height="20"
                />
              )}
              <span>{azureLoading ? 'Connecting to Microsoft...' : 'Sign up with Microsoft'}</span>
            </button>

            <div className="auth-or">
              <span className="auth-or-line" />
              <span className="auth-or-text">or register with email</span>
              <span className="auth-or-line" />
            </div>

            {error && (
              <div className="auth-error">
                <Shield size={14} /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {fields.map(({ key, label, type, icon: Icon, placeholder, pw }) => (
                <div key={key} className="auth-field">
                  <label className="auth-label">{label}</label>
                  <div className="auth-input-wrap">
                    <Icon size={16} className="auth-input-icon" />
                    <input
                      type={type} value={form[key]} required
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="auth-input"
                    />
                    {pw && (
                      <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="submit" className="auth-submit" disabled={loading || azureLoading}>
                {loading
                  ? <><span className="btn-spinner" /> Creating account...</>
                  : <>Create Account <ArrowRight size={16} /></>
                }
              </button>
            </form>

            <p className="auth-footer-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

            <p className="auth-security-note">
              <Shield size={11} /> Protected by end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
