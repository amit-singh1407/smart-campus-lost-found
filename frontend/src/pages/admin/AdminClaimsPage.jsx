import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Flame,
  Clock,
  Sparkles,
  QrCode,
  Search,
  CheckCircle
} from 'lucide-react';
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

export const AdminClaimsPage = () => {
  const [claims, setClaims]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes]                 = useState({});
  const [handoverTokens, setHandoverTokens] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter]   = useState('pending');
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

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminClaims({
        priority: priorityFilter,
        status: statusFilter,
      });
      setClaims(res.claims || []);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [priorityFilter, statusFilter]);

  const handleResolve = async (claimId, decision) => {
    const claimNote = notes[claimId] || '';
    setActionLoading(claimId);
    try {
      const result = await adminService.resolveClaim(claimId, decision, claimNote);
      setClaims((prev) =>
        prev.map((c) =>
          (c._id || c.id) === claimId
            ? { ...c, status: decision, admin_notes: claimNote, handover_url: result.handover_url }
            : c
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update claim decision');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCollection = async (claimId) => {
    const token = handoverTokens[claimId]?.trim();
    if (!token) return;
    setActionLoading(claimId);
    try {
      await adminService.verifyCollection(token);
      setClaims((prev) =>
        prev.map((claim) =>
          (claim._id || claim.id) === claimId ? { ...claim, status: 'completed' } : claim
        )
      );
      alert('Handover verified! Custody transferred to claimant.');
    } catch (err) {
      alert(err.response?.data?.message || 'Handover token could not be verified');
    } finally {
      setActionLoading(null);
    }
  };

  /* derived counts */
  const pendingCount   = claims.filter(c => c.status === 'pending').length;
  const approvedCount  = claims.filter(c => c.status === 'approved').length;
  const completedCount = claims.filter(c => c.status === 'completed').length;
  const urgentCount    = claims.filter(c => c.priority_tier === 'URGENT').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* ══ INTERACTIVE HERO ══ */}
      <div
        ref={heroRef}
        style={{ transition: 'transform 0.12s ease-out' }}
        className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/20 shadow-2xl shadow-amber-500/5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-6 right-16 w-52 h-52 bg-amber-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-24 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black uppercase tracking-widest mb-5 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              AI-Powered · Moderation Queue
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">Claims</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-blue-400">Work Queue</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm max-w-md leading-relaxed">
              AI-prioritized by item value, evidence depth, and fraud risk — so high-stakes claims are reviewed first.
            </p>
            {/* Priority filter embedded in hero */}
            <div className="mt-6 flex flex-wrap gap-2">
              {['all', 'urgent', 'high', 'normal', 'low'].map(tier => (
                <button key={tier} onClick={() => setPriorityFilter(tier)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                    priorityFilter === tier
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105'
                      : 'bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 backdrop-blur-md'
                  }`}>{tier}</button>
              ))}
            </div>
          </div>

          {/* Right — stat tiles */}
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
            {[
              { label: 'Pending Review', value: pendingCount,   icon: Clock,       color: 'amber'   },
              { label: 'Approved',       value: approvedCount,  icon: CheckCircle2, color: 'emerald' },
              { label: 'Completed',      value: completedCount, icon: CheckCircle,  color: 'blue'    },
              { label: 'Urgent',         value: urgentCount,    icon: Flame,        color: 'rose'    },
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

      {/* Status Tab Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-800">
        {[
          { id: 'pending', label: 'Pending Review', icon: Clock },
          { id: 'approved', label: 'Approved (Awaiting Collection)', icon: CheckCircle },
          { id: 'completed', label: 'Completed Handover', icon: CheckCircle2 },
          { id: 'all', label: 'All Records', icon: FileCheck2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Fetching ownership request queue...</p>
        </div>
      ) : claims.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {claims.map((claim) => {
            const claimId = claim._id || claim.id;
            const isPending = claim.status === 'pending';

            return (
              <div
                key={claimId}
                className={`group flex flex-col rounded-[2rem] border transition-all duration-300 shadow-xl backdrop-blur-md overflow-hidden hover:-translate-y-1 ${isPending ? 'bg-slate-900/70 border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
              >
                {/* Top Header Section */}
                <div className="p-6 border-b border-slate-800/60 bg-slate-950/40">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge
                      variant={
                        claim.status === 'approved'
                          ? 'success'
                          : claim.status === 'rejected'
                          ? 'danger'
                          : claim.status === 'completed'
                          ? 'success'
                          : 'warning'
                      }
                      className="shadow-lg"
                    >
                      {claim.status?.toUpperCase() || 'PENDING'}
                    </Badge>

                    {/* AI Work Queue Priority Badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg ${
                        claim.priority_tier === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : claim.priority_tier === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{claim.priority_tier || 'NORMAL'} Priority</span>
                      {claim.priority_score && <span className="opacity-70 ml-1">({claim.priority_score}%)</span>}
                    </span>

                    {/* Fraud Risk Indicator */}
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase ${
                        claim.fraud_risk === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : claim.fraud_risk === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      Risk: {claim.fraud_risk || 'LOW'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {claim.item_title || 'Campus Item'}
                  </h3>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      By: <strong className="text-slate-200">{claim.user_name || claim.user_email}</strong>
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                      ID: {claimId.substring(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  {/* Storage Info */}
                  {claim.storage_locker && (
                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
                       <Archive className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                       <div>
                         <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Physical Storage Location</p>
                         <p className="text-sm text-blue-200 mt-1">
                           <strong>{claim.storage_shelf || 'Shelf A'}</strong>, <strong>{claim.storage_locker}</strong>
                         </p>
                         <p className="text-[10px] text-blue-500/70 font-mono mt-1">Ref: {claim.storage_id}</p>
                       </div>
                    </div>
                  )}

                  {/* Evidence Box */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                    <span className="text-[10px] uppercase tracking-wider font-black text-slate-500 flex items-center gap-2 mb-2">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Claimant Evidence
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed font-mono">
                      {claim.proof_description || 'No detailed evidence description provided.'}
                    </p>
                  </div>

                  {/* Private Verification Answer Checked by Admin */}
                  {claim.answers_to_private_questions && (
                    <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30">
                      <span className="text-[10px] uppercase font-black text-purple-400 flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Private Verification Match
                      </span>
                      <p className="text-sm text-purple-200 font-mono">
                        {claim.answers_to_private_questions}
                      </p>
                      {claim.private_verification_questions && (
                        <div className="mt-3 pt-3 border-t border-purple-500/20">
                           <span className="text-[10px] uppercase text-purple-500/80 font-bold block mb-1">Target Secret on Record</span>
                           <p className="text-xs text-slate-400 italic font-mono">
                             {claim.private_verification_questions}
                           </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1"></div>

                  {/* Action Area */}
                  <div className="pt-4 border-t border-slate-800/60 mt-2">
                    {isPending ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Internal admin notes (optional)..."
                          value={notes[claimId] || ''}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [claimId]: e.target.value }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                        />

                        <div className="flex flex-wrap sm:flex-nowrap gap-3">
                          <button
                            onClick={() => handleResolve(claimId, 'rejected')}
                            disabled={actionLoading === claimId}
                            className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleResolve(claimId, 'approved')}
                            disabled={actionLoading === claimId}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            {actionLoading === claimId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>Approve Handoff</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {claim.admin_notes && (
                          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                             <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Admin Note</span>
                             <p className="text-sm text-slate-300 italic">{claim.admin_notes}</p>
                          </div>
                        )}
                        {claim.status === 'approved' && (
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <QrCode className="w-16 h-16 text-amber-500" />
                            </div>
                            <div className="relative z-10">
                              <p className="text-[11px] uppercase font-black tracking-wider text-amber-400 mb-2">Collection Handover</p>
                              <p className="text-sm text-slate-300 mb-3">Scan or paste the one-time secure collection token presented by the student at handover.</p>
                              <div className="flex gap-2">
                                <input
                                  value={handoverTokens[claimId] || ''}
                                  onChange={(e) => setHandoverTokens((prev) => ({ ...prev, [claimId]: e.target.value }))}
                                  placeholder="Paste secure token"
                                  className="min-w-0 flex-1 rounded-xl border border-amber-500/30 bg-slate-950 px-4 py-2.5 text-sm font-mono text-amber-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 shadow-inner"
                                />
                                <button
                                  onClick={() => handleCollection(claimId)}
                                  disabled={actionLoading === claimId}
                                  className="rounded-xl bg-amber-500 hover:bg-amber-400 transition-colors px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                                >
                                  {actionLoading === claimId ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {claim.status === 'completed' && (
                          <div className="flex items-center justify-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-2">
                             <CheckCircle2 className="w-5 h-5" />
                             <span className="text-sm font-bold">Successfully Returned to Owner</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <FileCheck2 className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">Queue is Clear</h3>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            There are no claims matching the current filters. Great job keeping the queue empty!
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminClaimsPage;
