import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  FolderOpen, Activity, CheckCircle, AlertTriangle,
  Plus, FileText, Image, Archive, File, RefreshCw
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getDashboardStats } from '../services/logService';
import '../styles/Dashboard.css';

const CATEGORY_ICONS = {
  Images:    { icon: Image,    color: '#00d4ff' },
  Documents: { icon: FileText, color: '#a855f7' },
  Archives:  { icon: Archive,  color: '#f97316' },
  Text:      { icon: FileText, color: '#22c55e' },
  Others:    { icon: File,     color: '#94a3b8' },
};

const CHART_COLORS = ['#0078d4', '#7B61FF', '#00F5FF', '#22c55e', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a2235', border: '1px solid rgba(0,245,255,0.20)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem',
    }}>
      <p style={{ color: '#94A3B8', marginBottom: 2, textTransform: 'capitalize' }}>
        {label?.replace(/_/g, ' ')}
      </p>
      <p style={{ color: '#00F5FF', fontWeight: 700 }}>{payload[0].value} events</p>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return 'morning ☀️';
    if (h < 17) return 'afternoon 🌤️';
    if (h < 21) return 'evening 🌙';
    return 'night 🌌';
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalFiles  = data?.files?.total ?? 0;
  const totalEvents = data?.stats?.totalEvents ?? 0;
  const successRate = data?.stats?.successRate ?? 0;
  const failCount   = data?.stats?.failedCount ?? 0;
  const categories  = data?.files?.categories ?? [];
  const recentFiles = data?.recentFiles ?? [];
  const recentUploads = data?.recentUploads ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const chartData   = data?.stats?.byAction ?? [];

  const STATS = [
    { icon: FolderOpen,    iconClass: 'stat-icon-blue',   value: totalFiles,  label: 'Total Files',    sub: 'Encrypted in Azure' },
    { icon: Activity,      iconClass: 'stat-icon-cyan',   value: totalEvents, label: 'Total Events',   sub: 'Activity logged' },
    { icon: CheckCircle,   iconClass: 'stat-icon-green',  value: `${successRate}%`, label: 'Success Rate', sub: 'Operations succeeded' },
    { icon: AlertTriangle, iconClass: 'stat-icon-red',    value: failCount,   label: 'Failed Ops',     sub: 'Needs attention' },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="stats-row">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 38, width: 38, borderRadius: 8, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-left">
            {[1,2].map(i => (
              <div key={i} className="dash-section">
                <div className="dash-section-head">
                  <div className="skeleton" style={{ height: 14, width: 120 }} />
                </div>
                <div className="dash-section-body">
                  {[1,2,3].map(j => (
                    <div key={j} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-right">
            {[1,2].map(i => (
              <div key={i} className="chart-card">
                <div className="chart-head">
                  <div className="skeleton" style={{ height: 14, width: 100 }} />
                </div>
                <div className="chart-body">
                  <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dash-header fade-up">
        <div>
          <h2 className="dash-welcome fade-text">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="dash-date">
            {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <Plus size={16} /> Upload File
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row fade-up" style={{ animationDelay: '60ms' }}>
        {STATS.map(({ icon: Icon, iconClass, value, label, sub }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${iconClass}`}>
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">

        {/* LEFT */}
        <div className="dashboard-left">

          {/* Categories */}
          <div className="dash-section fade-up" style={{ animationDelay: '100ms' }}>
            <div className="dash-section-head">
              <span className="dash-section-title">File Categories</span>
            </div>
            {categories.length > 0 ? (
              <div className="folder-row">
                {categories.map((cat, i) => {
                  const cfg = CATEGORY_ICONS[cat._id] || CATEGORY_ICONS.Others;
                  const CatIcon = cfg.icon;
                  return (
                    <div key={i} className="folder-card" onClick={() => navigate('/files')}>
                      <span className="folder-card-emoji">
                        <CatIcon size={20} color={cfg.color} strokeWidth={1.5} />
                      </span>
                      <div className="folder-card-name">{cat._id}</div>
                      <div className="folder-card-count">{cat.count} file{cat.count !== 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon">📁</div>
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>

          {/* Quick Access */}
          <div className="dash-section fade-up" style={{ animationDelay: '140ms' }}>
            <div className="dash-section-head">
              <span className="dash-section-title">Quick Access</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/files')}>
                View All
              </button>
            </div>
            {recentFiles.length > 0 ? (
              <div className="quick-row">
                {recentFiles.slice(0, 3).map((file, i) => (
                  <div key={i} className="quick-card" onClick={() => navigate('/files')}>
                    <div className="quick-card-icon">
                      <File size={14} strokeWidth={1.5} />
                    </div>
                    <span className="quick-card-name">{file.originalName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon">🗂️</div>
                <p>No recent files</p>
              </div>
            )}
          </div>

          {/* Recently Uploaded */}
          <div className="dash-section fade-up" style={{ animationDelay: '180ms' }}>
            <div className="dash-section-head">
              <span className="dash-section-title">Recently Uploaded</span>
            </div>
            {recentUploads.length > 0 ? (
              <div className="recent-list">
                {recentUploads.slice(0, 4).map((log, i) => (
                  <div key={i} className="recent-item">
                    <div className="recent-item-icon">📄</div>
                    <span className="recent-item-name">
                      {log.details?.filename || 'File uploaded'}
                    </span>
                    <span className="recent-item-time">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon">📤</div>
                <p>No recent uploads</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT */}
        <div className="dashboard-right">

          {/* Usage Chart */}
          <div className="chart-card fade-up" style={{ animationDelay: '120ms' }}>
            <div className="chart-head">
              <span className="chart-title">Usage by Action</span>
            </div>
            <div className="chart-body">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="_id"
                      stroke="#4a5578"
                      tick={{ fontSize: 9, fill: '#64748B' }}
                      tickFormatter={v => v?.replace(/_/g, ' ').slice(0, 8)}
                    />
                    <YAxis stroke="#4a5578" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,245,255,0.05)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-empty" style={{ height: 200 }}>
                  <div className="dash-empty-icon">📊</div>
                  <p>No activity data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card fade-up" style={{ animationDelay: '160ms' }}>
            <div className="activity-head">
              <span className="activity-title">Recent Activity</span>
            </div>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.slice(0, 5).map((log, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot ${log.status === 'failure' ? 'activity-dot-failure' : 'activity-dot-success'}`} />
                    <div>
                      <div className="activity-action">
                        {log.action?.replace(/_/g, ' ')}
                      </div>
                      <div className="activity-time">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon">🔍</div>
                <p>No recent activity</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
