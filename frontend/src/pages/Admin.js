import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, UserX, RefreshCw, AlertTriangle } from 'lucide-react';
import { getAllUsers, updateUserRole, deactivateUser } from '../services/userService';
import { useToast } from '../components/Toast';
import '../styles/Admin.css';

const ROLES = ['Admin', 'User', 'Viewer'];

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const d = await getAllUsers(); setUsers(d.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

const handleRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers(u => u.map(x => x._id === userId ? { ...x, role } : x));
      toast.success(`Role updated to ${role}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update role'); }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await deactivateUser(userId);
      setUsers(u => u.map(x => x._id === userId ? { ...x, isActive: false } : x));
      toast.success('User deactivated');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const active   = users.filter(u => u.isActive).length;
  const inactive = users.length - active;
  const admins   = users.filter(u => u.role === 'Admin').length;

  return (
    <div className="admin-page">

      {/* Stats */}
      <div className="admin-stats fade-up">
        {[
          { icon: Users,       label: 'Total Users',    value: users.length, color: 'blue' },
          { icon: ShieldCheck, label: 'Active Users',   value: active,       color: 'green' },
          { icon: UserX,       label: 'Inactive Users', value: inactive,     color: 'red' },
          { icon: AlertTriangle, label: 'Admins',       value: admins,       color: 'purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`admin-stat glass-card stat-${color}`}>
            <Icon size={20} strokeWidth={1.8} />
            <div>
              <p className="admin-stat-val">{value}</p>
              <p className="admin-stat-lbl">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card admin-table-wrap fade-up" style={{ animationDelay: '80ms' }}>
        <div className="admin-table-header">
          <h3 className="admin-table-title">User Management</h3>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>MFA</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {[200,80,70,60,100,80].map((w, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: w }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">{user.name?.slice(0,2).toUpperCase()}</div>
                      <div>
                        <p className="user-cell-name">{user.name}</p>
                        <p className="user-cell-email">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`role-select role-${user.role?.toLowerCase()}`}
                      value={user.role}
                      onChange={e => handleRole(user._id, e.target.value)}
                      disabled={!user.isActive}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.mfaEnabled ? 'badge-info' : 'badge-warning'}`}>
                      {user.mfaEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    {user.isActive && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(user._id)}>
                        <UserX size={13} /> Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
