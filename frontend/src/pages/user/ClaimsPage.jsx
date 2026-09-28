import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileCheck2, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { claimService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const res = await claimService.getMyClaims();
        setClaims(res.claims || []);
      } catch (err) {
        console.error('Failed to load user claims:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved - Ready for Pickup</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected / Proof Insufficient</Badge>;
      case 'completed':
        return <Badge variant="purple">Completed / Handoff Confirmed</Badge>;
      default:
        return <Badge variant="warning">Under Review by Security</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Ownership Requests</h2>
        <p className="text-xs text-slate-400 mt-1">
          Track the verification process for items you believe may be yours.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your claims status..." />
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim._id || claim.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {getStatusBadge(claim.status)}
                    <span className="text-[11px] text-slate-500">
                      Filed on {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    Request for: {claim.item_title || `Item #${claim.item_id?.substring(0, 8)}`}
                  </h3>
                </div>

                <Link
                  to={`/items/${claim.item_id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold self-start"
                >
                  <span>View Original Item Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Your Submitted Proof
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {claim.proof_description || 'Detailed proof submitted.'}
                </p>
                {claim.answers_to_private_questions && (
                  <p className="text-[11px] text-purple-300 font-mono pt-1">
                    🔐 Private verification answer provided
                  </p>
                )}
              </div>

              {/* Dynamic QR Handover Pass when Approved */}
              {claim.status === 'approved' && (
                <div className="p-5 rounded-3xl bg-gradient-to-tr from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        QR
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          One-Time QR Digital Handover Pass
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Present this digital pass at the campus security desk for pickup verification
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      Single-Use Pass
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    {/* Visual QR Code Generator via SVG data */}
                    <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          claim.handover_token || claim._id
                        )}`}
                        alt="Handover QR Code"
                        className="w-28 h-28"
                      />
                      <span className="text-[9px] font-mono text-slate-900 mt-1 font-bold">
                        SCAN TO COLLECT
                      </span>
                    </div>

                    <div className="space-y-2 text-xs flex-1">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          Physical Collection Station
                        </span>
                        <p className="text-slate-200 font-semibold flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>{claim.collection_location || 'Central Campus Security Desk (Building A, Room 102)'}</span>
                        </p>
                      </div>

                      {claim.storage_locker && (
                        <div className="flex items-center gap-3 text-[11px] text-slate-300">
                          <span>Shelf: <strong className="text-slate-100">{claim.storage_shelf || 'Shelf B'}</strong></span>
                          <span>•</span>
                          <span>Locker: <strong className="text-slate-100">{claim.storage_locker}</strong></span>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">Token: {claim.handover_token || 'TOKEN-ACTIVE'}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Valid 48h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {claim.admin_notes && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <strong className="text-blue-200">Security Desk Response:</strong> {claim.admin_notes}
                </div>
              )}

            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck2}
          title="No ownership requests yet"
          description="When you believe an item in the campus repository is yours, use the ownership request option on its detail page."
          action={
            <Link
              to="/browse"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              Browse Lost & Found Directory
            </Link>
          }
        />
      )}
    </div>
  );
};

export default ClaimsPage;
