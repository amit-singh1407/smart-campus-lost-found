import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, RefreshCw, Key, UserCheck, Trash, CheckCircle, Terminal, Clock, Filter } from 'lucide-react';
import { adminService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

/* ── CountUp ── */
const CountUp = ({ target, duration = 1200 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let s = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => { s = Math.min(s + step, target); setVal(s); if (s >= target) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{val}</span>;
};

export const AdminAuditLogsPage = () => {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterType, setFilterType] = useState('all');
  const heroRef = useRef(null);

  /* 3-D parallax tilt */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = ((e.clientX - left) / width  - 0.5) * 12;
      const y = ((e.clientY - top)  / height - 0.5) * 6;
      hero.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    const onLeave = () => { hero.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)'; };
    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', onLeave);
    return () => { hero.removeEventListener('mousemove', onMove); hero.removeEventListener('mouseleave', onLeave); };
  }, []);

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

  const getActionConfig = (action = '') => {
    if (action.includes('LOGIN'))    return { label: 'AUTH',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   dot: 'bg-blue-500'   };
    if (action.includes('REGISTER')) return { label: 'USER',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' };
    if (action.includes('CLAIM'))    return { label: 'CLAIM',  color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dot: 'bg-purple-500'  };
    if (action.includes('DELETE'))   return { label: 'DELETE', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',   dot: 'bg-rose-500'   };
    return                                  { label: 'EVENT',  color: 'bg-slate-700 text-slate-400 border-slate-600',      dot: 'bg-slate-500'  };
  };

  const filterTypes = ['all', 'AUTH', 'USER', 'CLAIM', 'DELETE', 'EVENT'];

  const filteredLogs = filterType === 'all'
    ? logs
    : logs.filter(log => getActionConfig(log.action).label === filterType);

  /* derived counts */
  const authCount   = logs.filter(l => getActionConfig(l.action).label === 'AUTH').length;
  const claimCount  = logs.filter(l => getActionConfig(l.action).label === 'CLAIM').length;
  const deleteCount = logs.filter(l => getActionConfig(l.action).label === 'DELETE').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* ══ INTERACTIVE HERO ══ */}
      <div
        ref={heroRef}
        style={{ transition: 'transform 0.12s ease-out' }}
        className="relative overflow-hidden rounded-[2.5rem] border border-rose-500/20 shadow-2xl shadow-rose-500/5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.13),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(100,116,139,0.08),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-6 right-16 w-52 h-52 bg-rose-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-24 w-40 h-40 bg-slate-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-red-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-black uppercase tracking-widest mb-5 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              Immutable · Security Trail
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">Security &</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-orange-400">Audit Logs</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm max-w-md leading-relaxed">
              Immutable record of authentication events, user adjustments, claim resolutions, and system operations across the campus platform.
            </p>
            {/* Event type filter in hero */}
            <div className="mt-6 flex flex-wrap gap-2 items-center">
              {filterTypes.map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                    filterType === type
                      ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                      : 'bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 backdrop-blur-md'
                  }`}>{type}</button>
              ))}
              <button onClick={fetchLogs} className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-bold">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {/* Right — stat tiles */}
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
            {[
              { label: 'Total Events', value: logs.length, icon: Terminal,    color: 'slate'   },
              { label: 'Auth Events',  value: authCount,   icon: Key,         color: 'blue'    },
              { label: 'Claim Events', value: claimCount,  icon: CheckCircle, color: 'purple'  },
              { label: 'Deletions',    value: deleteCount, icon: Trash,       color: 'rose'    },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`relative overflow-hidden p-5 rounded-2xl bg-slate-900/60 border border-${color}-500/20 backdrop-blur-md shadow-lg hover:border-${color}-500/40 transition-all group`}>
                <div className={`absolute -top-6 -right-6 w-20 h-20 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-colors`} />
                <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 w-fit mb-3 border border-${color}-500/20`}><Icon className="w-4 h-4" /></div>
                <div className={`text-3xl font-black text-${color}-400`}><CountUp target={value} /></div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <Terminal className="w-10 h-10 text-rose-500 animate-pulse mb-4" />
          <p className="text-slate-400 font-medium">Fetching security trail...</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="relative rounded-[2rem] border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* Timeline vertical line */}
          <div className="absolute left-[2.65rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent pointer-events-none"></div>

          <div className="divide-y divide-slate-800/50">
            {filteredLogs.map((log, idx) => {
              const config = getActionConfig(log.action || '');
              const time = log.created_at ? new Date(log.created_at) : null;
              return (
                <div
                  key={log._id || idx}
                  className="relative flex items-start gap-4 px-6 py-5 hover:bg-slate-800/20 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-0.5 w-5 h-5 rounded-full border-2 border-slate-900 shrink-0 shadow-lg ${config.dot}`}></div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                        {log.action}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                        {log.user_email || log.user_id || 'System'}
                      </span>
                      {log.ip_address && (
                        <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-400">
                          {log.ip_address}
                        </span>
                      )}
                      {log.details && (
                        <span className="text-slate-400 truncate max-w-sm" title={log.details}>
                          {log.details}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <div className="text-xs font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
                      {time ? time.toLocaleTimeString() : 'Recent'}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {time ? time.toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            Showing <span className="font-bold text-slate-300">{filteredLogs.length}</span> event{filteredLogs.length !== 1 ? 's' : ''}
            {filterType !== 'all' && <span className="ml-1">filtered by <span className="text-rose-400 font-bold">{filterType}</span></span>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No Logs Recorded</h3>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            Security and administrative events will appear here as users interact with the system.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
