import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes] = useState({});
  const [handoverTokens, setHandoverTokens] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, urgent, high, normal, low
  const [statusFilter, setStatusFilter] = useState('pending'); // all, pending, approved, completed

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Smart Work Queue Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>AI-Prioritized Claims Work Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              Smart Moderation
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritizes cases by item value, evidence depth, and fraud risk so campus security tackles high-stakes claims first.
          </p>
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          {['all', 'urgent', 'high', 'normal', 'low'].map((tier) => (
            <button
              key={tier}
              onClick={() => setPriorityFilter(tier)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition ${
                priorityFilter === tier
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Status Tab Filter */}
      <div className="flex gap-2 text-xs border-b border-slate-800 pb-3">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved (Awaiting Collection)' },
          { id: 'completed', label: 'Completed Handover' },
          { id: 'all', label: 'All Records' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {loading ? (
        <LoadingSpinner text="Fetching claims verification queue..." />
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => {
            const claimId = claim._id || claim.id;
            const isPending = claim.status === 'pending';

            return (
              <div
                key={claimId}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge
                        variant={
                          claim.status === 'approved'
                            ? 'success'
                            : claim.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {claim.status?.toUpperCase() || 'PENDING'}
                      </Badge>

                      {/* AI Work Queue Priority Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          claim.priority_tier === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : claim.priority_tier === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        <span>AI Priority: {claim.priority_tier || 'NORMAL'} ({claim.priority_score || 50}%)</span>
                      </span>

                      {/* Fraud Risk Indicator */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          claim.fraud_risk === 'LOW'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : claim.fraud_risk === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        Risk: {claim.fraud_risk || 'LOW'}
                      </span>

                      <span className="text-[11px] text-slate-500">
                        Claim ID: {claimId.substring(0, 8)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">
                      Item: {claim.item_title || 'Campus Item'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Claimant: <strong className="text-slate-200">{claim.user_name || claim.user_email}</strong> ({claim.user_email})
                    </p>

                    {/* Locker Tracking Details */}
                    {claim.storage_locker && (
                      <p className="text-[11px] text-blue-400 mt-1">
                        📦 Stored at: <strong>{claim.storage_shelf || 'Shelf A'}</strong>, <strong>{claim.storage_locker}</strong> (Storage ID: {claim.storage_id || 'N/A'})
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    Filed on {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'Recent'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Claimant Evidence & General Proof
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {claim.proof_description || 'No detailed evidence description provided.'}
                  </p>

                  {/* Private Verification Answer Checked by Admin */}
                  {claim.answers_to_private_questions && (
                    <div className="pt-2 mt-2 border-t border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1 mb-1">
                        🔐 Private Identifying Details Answered:
                      </span>
                      <p className="text-xs text-purple-200 bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40 font-mono">
                        {claim.answers_to_private_questions}
                      </p>
                      {claim.private_verification_questions && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          Target secret on record: {claim.private_verification_questions}
                        </p>
                      )}
                    </div>
                  )}
                </div>


                {isPending ? (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      placeholder="Optional security notes or pickup instructions..."
                      value={notes[claimId] || ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [claimId]: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleResolve(claimId, 'rejected')}
                        disabled={actionLoading === claimId}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Claim</span>
                      </button>
                      <button
                        onClick={() => handleResolve(claimId, 'approved')}
                        disabled={actionLoading === claimId}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Handoff</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claim.admin_notes && (
                      <p className="text-xs text-slate-400 italic">Admin Note: {claim.admin_notes}</p>
                    )}
                    {claim.status === 'approved' && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                        <p className="text-xs text-amber-200">Scan or paste the one-time collection token at handover.</p>
                        <div className="flex gap-2">
                          <input
                            value={handoverTokens[claimId] || ''}
                            onChange={(e) => setHandoverTokens((prev) => ({ ...prev, [claimId]: e.target.value }))}
                            placeholder="Paste handover token"
                            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                          />
                          <button
                            onClick={() => handleCollection(claimId)}
                            disabled={actionLoading === claimId}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                          >
                            Verify pickup
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck2}
          title="No claims in verification queue"
          description="All submitted student claims have been reviewed and resolved."
        />
      )}
    </div>
  );
};

export default AdminClaimsPage;
