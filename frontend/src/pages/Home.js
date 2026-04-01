import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, BarChart2, Key, ArrowRight, Zap, Globe, Users } from 'lucide-react';
import '../styles/Home.css';

const FEATURES = [
  { icon: Shield,   title: 'Zero Trust Security',    desc: 'Every request verified. AES-256-CBC encryption at rest and in transit.' },
  { icon: Lock,     title: 'Azure AD + MFA',          desc: 'Enterprise identity with multi-factor authentication on every sensitive action.' },
  { icon: BarChart2,title: 'Full Audit Trail',        desc: 'Every action logged to MongoDB and Azure Monitor with real-time alerts.' },
  { icon: Key,      title: 'Azure Key Vault',         desc: 'Secrets and encryption keys managed by Microsoft Azure Key Vault.' },
  { icon: Globe,    title: 'Azure Blob Storage',      desc: 'Encrypted files stored in geo-redundant Azure Blob Storage.' },
  { icon: Users,    title: 'RBAC Permissions',        desc: 'Admin, User, and Viewer roles with granular file-level access control.' },
];

const Home = () => (
  <div className="home-page">
    <div className="home-bg-grid" />
    <div className="home-orb home-orb-1" />
    <div className="home-orb home-orb-2" />

    <nav className="home-nav">
      <div className="home-brand">
        <div className="home-brand-icon"><Lock size={18} strokeWidth={2.5} /></div>
        <span>VaultShare</span>
      </div>
      <div className="home-nav-links">
        <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
      </div>
    </nav>

    <section className="hero">
      <div className="hero-badge"><Zap size={12} /> Enterprise-Grade Security</div>
      <h1 className="hero-title">
        Secure File Sharing<br />
        <span className="hero-accent">Powered by Azure</span>
      </h1>
      <p className="hero-sub">
        Zero-trust architecture with AES-256 encryption, Azure AD authentication, MFA, and complete audit logging — built for enterprises that demand security.
      </p>
      <div className="hero-cta">
        <Link to="/register" className="btn btn-primary btn-lg">
          Start for Free <ArrowRight size={18} />
        </Link>
        <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
      </div>
      <div className="hero-azure">
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg" alt="Azure" className="hero-azure-logo" />
        <span>Secured by Microsoft Azure</span>
      </div>
    </section>

    <section className="features-section">
      <h2 className="features-title">Enterprise Security Features</h2>
      <div className="features-grid">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="feature-card glass-card">
            <div className="feature-icon"><Icon size={22} strokeWidth={1.5} /></div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default Home;
