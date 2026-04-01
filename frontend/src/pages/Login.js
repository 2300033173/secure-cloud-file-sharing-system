import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Globe, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { loginRequest } from '../config/msalConfig';
import './Auth.css';

/* Animated particle canvas */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const DOTS = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      DOTS.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${d.opacity})`;
        ctx.fill();
      });
      // Draw connecting lines
      for (let i = 0; i < DOTS.length; i++) {
        for (let j = i + 1; j < DOTS.length; j++) {
          const dx = DOTS[i].x - DOTS[j].x;
          const dy = DOTS[i].y - DOTS[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(DOTS[i].x, DOTS[i].y);
            ctx.lineTo(DOTS[j].x, DOTS[j].y);
            ctx.strokeStyle = `rgba(0,120,212,${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="auth-canvas" />;
};

const FEATURES = [
  { icon: Shield,       text: 'AES-256-CBC Encryption' },
  { icon: Globe,        text: 'Azure Blob Storage' },
  { icon: Zap,          text: 'RBAC + MFA Protection' },
  { icon: CheckCircle,  text: 'Full Audit Trail' },
];

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [azureLoading, setAzureLoading] = useState(false);
  const { login, azureLogin } = useContext(AuthContext);
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
        setError('Microsoft sign-in failed. Please try again or use email/password.');
      }
    } finally { setAzureLoading(false); }
  };

  return (
    <div className="auth-page">
      <ParticleCanvas />
      <div className="auth-hex-grid" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

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
                Zero Trust Security Platform
              </div>
              <h1 className="auth-hero-title">
                Protect What<br />
                <span className="auth-hero-gradient">Matters Most</span>
              </h1>
              <p className="auth-hero-sub">
                Military-grade encryption meets enterprise identity. Your files, secured by Azure — accessible only to those who should see them.
              </p>
            </div>

            <div className="auth-feature-list">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="auth-feature-row">
                  <div className="auth-feature-icon-wrap">
                    <Icon size={14} strokeWidth={2.5} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="auth-trust-bar">
              <div className="trust-item">
                <span className="trust-num">256-bit</span>
                <span className="trust-lbl">Encryption</span>
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <span className="trust-num">99.9%</span>
                <span className="trust-lbl">Uptime SLA</span>
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <span className="trust-num">SOC 2</span>
                <span className="trust-lbl">Compliant</span>
              </div>
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
            {/* Card top accent */}
            <div className="auth-card-accent" />

            <div className="auth-card-header">
              <h2 className="auth-card-title">Sign in</h2>
              <p className="auth-card-sub">Access your secure workspace</p>
            </div>

            {/* Azure AD Button — PRIMARY */}
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
              <span>{azureLoading ? 'Connecting to Microsoft...' : 'Continue with Microsoft'}</span>
            </button>

            <div className="auth-or">
              <span className="auth-or-line" />
              <span className="auth-or-text">or sign in with email</span>
              <span className="auth-or-line" />
            </div>

            {error && (
              <div className="auth-error">
                <Shield size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email" value={form.email} required
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Password</label>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPw ? 'text' : 'password'} value={form.password} required
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="auth-input"
                    autoComplete="current-password"
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading || azureLoading}>
                {loading ? (
                  <><span className="btn-spinner" /> Authenticating...</>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="auth-footer-link">
              Don't have an account? <Link to="/register">Create account</Link>
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

export default Login;
