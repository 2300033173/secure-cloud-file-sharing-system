import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLogs } from '../services/logService';
import '../styles/ActivityLogs.css';

const ACTIONS = ['login','logout','file_upload','file_download','file_delete','file_share','failed_login','mfa_enabled','mfa_disabled','role_change'];

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '', status: '', startDate: '', endDate: '', limit: 25 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const d = await getLogs(params);
      setLogs(d.data || []);
      setPagination({ page: d.page, pages: d.pages, total: d.total });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const reset = () => setFilters({ action: '', status: '', startDate: '', endDate: '', limit: 25 });

  return (
    <div className="logs-page">
      {/* Filters */}
      <div className="logs-filters fade-up">
        <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <select className="form-input" name="action" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
        <select className="form-input" name="status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
        <input className="form-input" type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        <input className="form-input" type="date" value={filters.endDate}   onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        <select className="form-input" value={filters.limit} onChange={e => setFilters(f => ({ ...f, limit: e.target.value }))}>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={13} /> Reset</button>
        <span className="logs-total" style={{ marginLeft: 'auto' }}>{pagination.total} records</span>
      </div>

      {/* Table */}
      <div className="glass-card logs-table-wrap fade-up" style={{ animationDelay: '60ms' }}>
        <div className="logs-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Date & Time</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {[120,160,140,100,70].map((w, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: w }} /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="empty-logs">
                    <ScrollText size={36} strokeWidth={1} />
                    <p>No logs found for the selected filters.</p>
                  </div>
                </td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className={log.status === 'failure' ? 'row-failure' : ''}>
                  <td><span className="action-badge">{log.action.replace(/_/g, ' ')}</span></td>
                  <td>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{log.user?.name || 'Unknown'}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.user?.email}</p>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td><span className="ip-code">{log.ipAddress || 'N/A'}</span></td>
                  <td><span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
              <ChevronLeft size={15} /> Prev
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
