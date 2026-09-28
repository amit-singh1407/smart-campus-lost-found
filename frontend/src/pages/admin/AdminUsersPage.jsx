import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Search, Shield, ShieldCheck, UserX, UserCheck,
  Loader2, RefreshCw, Mail, Activity, Lock, CheckCircle2, TrendingUp
} from 'lucide-react';
import { adminService } from '../../services/itemService';
import { Badge } from '../../components/UIComponents';

/* ─── tiny animated number counter ─────────────────────────────── */
const CountUp = ({ target, duration = 1200 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{val}</span>;
};

export const AdminUsersPage = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [roleFilter, setRoleFilter]     = useState('all');   // all | admin | user
  const [statusFilter, setStatusFilter] = useState('all');   // all | active | suspended

  const heroRef = useRef(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search });
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ── parallax tilt on hero ── */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = ((e.clientX - left) / width  - 0.5) * 14;
      const y = ((e.clientY - top)  / height - 0.5) * 8;
      hero.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    const onLeave = () => { hero.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)'; };
    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', onLeave);
    return () => { hero.removeEventListener('mousemove', onMove); hero.removeEventListener('mouseleave', onLeave); };
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, role: newRole } : u));
    } catch (err) { alert(err.response?.data?.message || 'Failed to update user role'); }
    finally { setActionLoading(null); }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setActionLoading(userId);
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, status: newStatus } : u));
    } catch (err) { alert(err.response?.data?.message || 'Failed to update user status'); }
    finally { setActionLoading(null); }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /* ── derived stats ── */
  const totalUsers     = users.length;
  const adminCount     = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const verifiedCount  = users.filter(u => u.email_verified).length;

  /* ── filtered list ── */
  const visibleUsers = users.filter(u => {
    const matchRole   = roleFilter   === 'all' || (roleFilter === 'admin' ? (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') : u.role === 'USER');
    const matchStatus = statusFilter === 'all' || (statusFilter === 'suspended' ? u.status === 'suspended' : u.status !== 'suspended');
    return matchRole && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* ══════════════════ HERO ══════════════════ */}
      <div
        ref={heroRef}
        style={{ transition: 'transform 0.12s ease-out' }}
        className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 shadow-2xl shadow-blue-500/5"
      >
        {/* Layered animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.12),transparent_60%)]" />

        {/* Animated floating orbs */}
        <div className="absolute top-6 right-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-24 w-36 h-36 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.6s' }} />

        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

          {/* Left — Title block */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-black uppercase tracking-widest mb-5 shadow-lg shadow-blue-500/10">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Live · User Directory
            </div>

            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Campus User
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Management
              </span>
            </h1>

            <p className="mt-4 text-slate-400 text-sm max-w-md leading-relaxed">
              Manage every registered student, faculty, and security staff account — roles, access levels, and verification status — from a single control surface.
            </p>

            {/* Hero search */}
            <form
              onSubmit={(e) => { e.preventDefault(); fetchUsers(); }}
              className="mt-6 flex gap-3 w-full max-w-md"
            >
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-700 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all backdrop-blur-md shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Right — Stat tiles */}
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
            {[
              { label: 'Total Users',   value: totalUsers,     icon: Users,        color: 'blue',   glow: 'shadow-blue-500/20'   },
              { label: 'Admins',        value: adminCount,     icon: Shield,       color: 'purple', glow: 'shadow-purple-500/20' },
              { label: 'Verified',      value: verifiedCount,  icon: CheckCircle2, color: 'emerald',glow: 'shadow-emerald-500/20' },
              { label: 'Suspended',     value: suspendedCount, icon: Lock,         color: 'rose',   glow: 'shadow-rose-500/20'   },
            ].map(({ label, value, icon: Icon, color, glow }) => (
              <div
                key={label}
                className={`relative overflow-hidden p-5 rounded-2xl bg-slate-900/60 border border-${color}-500/20 backdrop-blur-md shadow-lg ${glow} hover:border-${color}-500/40 transition-all group`}
              >
                <div className={`absolute -top-6 -right-6 w-20 h-20 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-colors`} />
                <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 w-fit mb-3 border border-${color}-500/20`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`text-3xl font-black text-${color}-400`}>
                  <CountUp target={value} />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ FILTER BAR ══════════════════ */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
          <Activity className="w-4 h-4 text-slate-600" />
          Filters
        </div>

        {/* Role filter */}
        <div className="flex p-1 gap-1 rounded-xl bg-slate-950 border border-slate-800">
          {[
            { id: 'all',   label: 'All Roles' },
            { id: 'admin', label: 'Admins'    },
            { id: 'user',  label: 'Students'  },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setRoleFilter(id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                roleFilter === id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex p-1 gap-1 rounded-xl bg-slate-950 border border-slate-800">
          {[
            { id: 'all',       label: 'All Status' },
            { id: 'active',    label: 'Active'     },
            { id: 'suspended', label: 'Suspended'  },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                statusFilter === id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-slate-500 font-mono">
          Showing <span className="text-slate-200 font-bold">{visibleUsers.length}</span> / {totalUsers} users
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ══════════════════ USER CARDS ══════════════════ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Loading campus user directory...</p>
        </div>
      ) : visibleUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleUsers.map((u) => {
            const uid         = u._id || u.id;
            const isSuspended = u.status === 'suspended';
            const isAdmin     = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
            const isLoading   = actionLoading === uid;

            return (
              <div
                key={uid}
                className={`group flex flex-col bg-slate-900/60 border rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  isSuspended
                    ? 'border-rose-500/20 hover:border-rose-500/40 hover:shadow-rose-500/10'
                    : isAdmin
                    ? 'border-purple-500/20 hover:border-purple-500/40 hover:shadow-purple-500/10'
                    : 'border-slate-800 hover:border-blue-500/30 hover:shadow-blue-500/10'
                }`}
              >
                {/* Card Header / Avatar Section */}
                <div className={`relative p-6 pb-4 flex items-center gap-4 ${
                  isSuspended ? 'bg-rose-950/10' : isAdmin ? 'bg-purple-950/10' : 'bg-slate-950/30'
                }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-lg ${
                    isSuspended
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isAdmin
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {getInitials(u.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-100 text-base truncate group-hover:text-white transition-colors">
                      {u.name || 'Unnamed User'}
                    </h3>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      {u.email}
                    </p>
                  </div>

                  {/* Live status dot */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className={`relative w-2.5 h-2.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      {!isSuspended && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
                    </div>
                  </div>
                </div>

                {/* Details Row */}
                <div className="px-6 py-4 grid grid-cols-2 gap-4 border-t border-slate-800/60">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Campus ID</p>
                    <p className="text-sm font-mono text-slate-300">{u.student_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Department</p>
                    <p className="text-sm text-slate-300 truncate">{u.department || 'General'}</p>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                  <Badge variant={u.email_verified ? 'success' : 'warning'}>
                    {u.email_verified ? '✓ Verified' : 'Pending OTP'}
                  </Badge>
                  <Badge variant={isAdmin ? 'purple' : 'default'}>
                    {u.role || 'USER'}
                  </Badge>
                  <Badge variant={isSuspended ? 'danger' : 'success'}>
                    {isSuspended ? 'Suspended' : 'Active'}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="p-4 mt-auto border-t border-slate-800/60 flex gap-3">
                  <button
                    onClick={() => handleRoleToggle(uid, u.role)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                      isAdmin
                        ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-purple-500/20'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 hover:shadow-amber-500/20'
                    }`}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {isAdmin ? 'Revoke Admin' : 'Make Admin'}
                  </button>

                  <button
                    onClick={() => handleStatusToggle(uid, u.status)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                      isSuspended
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/20'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-rose-500/20'
                    }`}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {isSuspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No Users Found</h3>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            No accounts match the current filters or search query.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
