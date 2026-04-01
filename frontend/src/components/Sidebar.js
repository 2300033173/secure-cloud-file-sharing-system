import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Upload,
  ScrollText, ShieldCheck, Settings, LogOut,
  Lock, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files',     icon: FolderOpen,      label: 'My Files' },
  { to: '/upload',    icon: Upload,           label: 'Upload' },
  { to: '/logs',      icon: ScrollText,       label: 'Activity Logs' },
  { to: '/mfa-settings', icon: ShieldCheck,  label: 'MFA Settings' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: Settings, label: 'Admin Panel' },
];

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Lock size={18} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <span className="brand-name">VaultShare</span>
          <span className="brand-sub">Azure Secured</span>
        </div>
      </div>

      {/* Azure badge */}
      <div className="azure-badge">
        <div className="azure-badge-dot" />
        <span>Protected by Microsoft Azure</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Navigation</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            <ChevronRight size={14} className="nav-arrow" />
          </NavLink>
        ))}

        {user?.role === 'Admin' && (
          <>
            <p className="nav-section-label" style={{ marginTop: '20px' }}>Administration</p>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item nav-admin ${isActive ? 'active' : ''}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                <ChevronRight size={14} className="nav-arrow" />
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} data-tooltip="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
