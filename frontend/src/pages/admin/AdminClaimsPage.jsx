import React, { useState, useEffect } from 'react';
import { FileCheck2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { adminService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes] = useState({});

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminClaims();
      setClaims(res.claims || []);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleResolve = async (claimId, decision) => {
    const claimNote = notes[claimId] || '';
    setActionLoading(claimId);
    try {
      await adminService.resolveClaim(claimId, decision, claimNote);
      setClaims((prev) =>
        prev.map((c) =>
          (c._id || c.id) === claimId
            ? { ...c, status: decision, admin_notes: claimNote }
            : c
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update claim decision');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Claims Verification Desk</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review ownership evidence, private identifiers, and authorize locker handoffs.
        </p>
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
                    <div className="flex items-center gap-2 mb-1.5">
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
                  </div>

                  <div className="text-xs text-slate-500">
                    Filed on {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'Recent'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Claimant Evidence & Secret Proof
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {claim.proof_description || 'No detailed evidence description provided.'}
                  </p>
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
                  claim.admin_notes && (
                    <p className="text-xs text-slate-400 italic">
                      Admin Note: {claim.admin_notes}
                    </p>
                  )
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
