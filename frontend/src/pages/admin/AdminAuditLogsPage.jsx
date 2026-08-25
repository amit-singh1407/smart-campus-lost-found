import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Key, UserCheck, Trash, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) return <Badge variant="primary">AUTH</Badge>;
    if (action.includes('REGISTER')) return <Badge variant="success">USER</Badge>;
    if (action.includes('CLAIM')) return <Badge variant="purple">CLAIM</Badge>;
    if (action.includes('DELETE')) return <Badge variant="danger">DELETE</Badge>;
    return <Badge variant="default">EVENT</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Security & Audit Logs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of authentication events, user status adjustments, and claim resolutions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching security trail..." />
      ) : logs.length > 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Details & IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      {getActionBadge(log.action || '')}
                      <span className="font-semibold text-slate-200">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {log.user_email || log.user_id || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {log.details || '—'} {log.ip_address ? `(${log.ip_address})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShieldAlert}
          title="No audit logs recorded yet"
          description="Security and administrative events will be logged here as users interact with the system."
        />
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
