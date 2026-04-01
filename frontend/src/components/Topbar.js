import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Shield, ChevronDown, LogOut, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Topbar.css';

const PAGE_TITLES = {
  '/dashboard':    { title: 'Dashboard',       sub: 'Overview & analytics' },
  '/files':        { title: 'My Files',         sub: 'Manage your secure files' },
  '/upload':       { title: 'Upload File',      sub: 'Securely upload to Azure Blob' },
  '/logs':         { title: 'Activity Logs',    sub: 'Audit trail & security events' },
  '/mfa-settings': { title: 'MFA Settings',     sub: 'Multi-factor authentication' },
  '/admin':        { title: 'Admin Panel',      sub: 'User management & system control' },
};

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const page = PAGE_TITLES[location.pathname] || { title: 'VaultShare', sub: '' };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1 className="topbar-title">{page.title}</h1>
          {page.sub && <p className="topbar-sub">{page.sub}</p>}
        </div>
      </div>

      <div className="topbar-right">
        {/* MFA Status */}
        <div className={`mfa-indicator ${user?.mfaEnabled ? 'mfa-on' : 'mfa-off'}`} data-tooltip={user?.mfaEnabled ? 'MFA Active' : 'MFA Disabled'}>
          <Shield size={14} strokeWidth={2} />
          <span>{user?.mfaEnabled ? 'MFA On' : 'MFA Off'}</span>
        </div>

        {/* Notifications */}
        <button className="topbar-icon-btn" data-tooltip="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span className="notif-dot" />
        </button>

        {/* User Menu */}
        <div className="user-menu-wrap">
          <button className="user-menu-trigger" onClick={() => setMenuOpen(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.name}</span>
              <span className="topbar-user-role">{user?.role}</span>
            </div>
            <ChevronDown size={14} className={`menu-chevron ${menuOpen ? 'open' : ''}`} />
          </button>

          {menuOpen && (
            <div className="user-dropdown" onClick={() => setMenuOpen(false)}>
              <div className="dropdown-header">
                <p className="dropdown-name">{user?.name}</p>
                <p className="dropdown-email">{user?.email}</p>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => navigate('/mfa-settings')}>
                <Settings size={15} /> Account Settings
              </button>
              <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
