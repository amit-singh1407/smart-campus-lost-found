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
        <h2 className="text-2xl font-bold text-slate-100">Ownership Claims</h2>
        <p className="text-xs text-slate-400 mt-1">
          Track the verification process of items you claimed ownership for.
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
                    Claim for: {claim.item_title || `Item #${claim.item_id?.substring(0, 8)}`}
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
              </div>

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
          title="No claims filed yet"
          description="When you find an item listed in the campus repository that belongs to you, click 'Claim Item' on its detail page."
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
