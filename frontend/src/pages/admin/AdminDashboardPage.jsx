import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  FileCheck2,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
  PieChart,
} from 'lucide-react';
import { adminService } from '../../services/itemService';
import { StatCard, LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

/* ── animated counter ── */
const CountUp = ({ target, duration = 1400, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{val}{suffix}</span>;
};

export const AdminDashboardPage = () => {
  const [stats, setStats]             = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading]         = useState(true);
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

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, claimsRes, itemsRes] = await Promise.allSettled([
          adminService.getStats(),
          adminService.getAdminClaims({ status: 'pending' }),
          adminService.getAdminItems({ limit: 5 }),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value || {});
        }
        if (claimsRes.status === 'fulfilled') {
          setRecentClaims(claimsRes.value?.claims || []);
        }
        if (itemsRes.status === 'fulfilled') {
          setRecentItems(itemsRes.value?.items || []);
        }
      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm animate-pulse">
        <Activity className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Compiling Campus Analytics...</p>
      </div>
    );
  }

  const totalUsers = stats?.totalUsers || 0;
  const lostItems = stats?.lostItems || 0;
  const foundItems = stats?.foundItems || 0;
  const pendingClaims = stats?.pendingClaims || 0;
  const approvedClaims = stats?.approvedClaims || 0;
  const returnedItems = stats?.returnedItems || 0;
  const recoveryRate = stats?.recoveryRate || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* ══ INTERACTIVE HERO ══ */}
      <div
        ref={heroRef}
        style={{ transition: 'transform 0.12s ease-out' }}
        className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/25 shadow-2xl shadow-amber-500/5"
      >
        {/* Layered bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.10),transparent_60%)]" />
        {/* Dot-grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Animated orbs */}
        <div className="absolute top-6 right-16 w-52 h-52 bg-amber-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-24 w-40 h-40 bg-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black uppercase tracking-widest mb-5 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Live · Campus Control Panel
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">Administrative</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Control Panel</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm max-w-md leading-relaxed">
              Real-time management for campus lost & found intake, student identity audits, and custody dispute verifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link to="/admin/claims" className="text-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-sm font-black shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5">
                Review Requests ({pendingClaims})
              </Link>
              <Link to="/admin/items" className="text-center px-7 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 hover:border-slate-600 transition-all backdrop-blur-md">
                Manage Inventory
              </Link>
            </div>
          </div>
          {/* Right — stat tiles */}
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
            {[
              { label: 'Campus Users',  value: totalUsers,    suffix: '',  icon: Users,       color: 'blue'   },
              { label: 'Lost Items',    value: lostItems,     suffix: '',  icon: Package,     color: 'rose'   },
              { label: 'Found Items',   value: foundItems,    suffix: '',  icon: Package,     color: 'emerald'},
              { label: 'Recovery Rate', value: recoveryRate,  suffix: '%', icon: TrendingUp,  color: 'amber'  },
            ].map(({ label, value, suffix, icon: Icon, color }) => (
              <div key={label} className={`relative overflow-hidden p-5 rounded-2xl bg-slate-900/60 border border-${color}-500/20 backdrop-blur-md shadow-lg hover:border-${color}-500/40 transition-all group`}>
                <div className={`absolute -top-6 -right-6 w-20 h-20 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-colors`} />
                <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 w-fit mb-3 border border-${color}-500/20`}><Icon className="w-4 h-4" /></div>
                <div className={`text-3xl font-black text-${color}-400`}><CountUp target={value} suffix={suffix} /></div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-blue-500/40 hover:bg-slate-900/80 transition-all transform hover:-translate-y-1 shadow-lg group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-100">{totalUsers}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Campus Users</p>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-rose-500/40 hover:bg-slate-900/80 transition-all transform hover:-translate-y-1 shadow-lg group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-100">{lostItems}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Lost Items Logged</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all transform hover:-translate-y-1 shadow-lg group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-100">{foundItems}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Found Turn-ins</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/40 hover:bg-slate-900/80 transition-all transform hover:-translate-y-1 shadow-lg group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-100">{pendingClaims}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Pending Claims</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar: Recovery Rate & Resolutions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recovery Rate</span>
            <h3 className="text-3xl font-black text-emerald-400 mt-2">{recoveryRate}%</h3>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 relative z-10">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approved Claims</span>
            <h3 className="text-3xl font-black text-blue-400 mt-2">{approvedClaims}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 relative z-10">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Returned to Owners</span>
            <h3 className="text-3xl font-black text-purple-400 mt-2">{returnedItems}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 relative z-10">
            <Activity className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Two Columns: Pending Claims Moderation & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Claims Moderation Box */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Ownership Requests
            </h3>
            <Link
              to="/admin/claims"
              className="text-xs px-4 py-2 rounded-xl bg-slate-800 text-amber-400 hover:text-white hover:bg-amber-600 font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClaims.length > 0 ? (
            <div className="space-y-4 flex-1">
              {recentClaims.slice(0, 5).map((claim) => (
                <div
                  key={claim._id || claim.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-amber-500/30 transition-colors group"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                      {claim.item_title || 'Item Claim'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {claim.user_email || 'Campus Member'}
                    </p>
                  </div>
                  <Link
                    to="/admin/claims"
                    className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed text-center">
               <FileCheck2 className="w-12 h-12 text-slate-600 mb-4" />
               <h4 className="text-lg font-bold text-slate-300">Queue is Clear</h4>
               <p className="text-slate-500 text-sm mt-1">All submitted claims have been verified.</p>
            </div>
          )}
        </div>

        {/* Category Breakdown Aggregation */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <PieChart className="w-5 h-5" />
              </div>
              Category Distribution
            </h3>
          </div>

          {stats?.categories && Object.keys(stats.categories).length > 0 ? (
            <div className="space-y-6 flex-1 pt-2">
              {Object.entries(stats.categories).map(([category, count]) => {
                const totalItemsCount = stats.totalItems || 1;
                const pct = Math.round((count / totalItemsCount) * 100);
                return (
                  <div key={category} className="space-y-2.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-bold text-slate-300">{category}</span>
                      <span className="font-mono text-slate-400 text-xs">
                        <span className="text-slate-200 font-bold">{count}</span> ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 relative"
                        style={{ width: `${Math.max(2, pct)}%` }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed text-center">
               <Package className="w-12 h-12 text-slate-600 mb-4" />
               <h4 className="text-lg font-bold text-slate-300">No Analytics Yet</h4>
               <p className="text-slate-500 text-sm mt-1">Category breakdown will appear here once items are logged.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
