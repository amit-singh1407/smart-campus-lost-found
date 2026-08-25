import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  ArrowLeft,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Phone,
} from 'lucide-react';
import { itemService, claimService } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
import { Badge, LoadingSpinner, EmptyState } from '../../components/UIComponents';

export const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await itemService.getItemById(id);
        setItem(res.item || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Item not found');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }

    setClaimLoading(true);
    setClaimError('');

    try {
      await claimService.createClaim({
        item_id: id,
        proof_description: proofDescription.trim(),
        contact_phone: contactPhone.trim(),
      });
      setClaimSuccess(true);
      setTimeout(() => {
        setClaimModalOpen(false);
      }, 2000);
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading item details..." />;
  }

  if (!item || error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link to="/browse" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="Item Not Found"
          description={error || 'The requested item report does not exist or has been removed.'}
        />
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isOwner = user && (user.id === item.user_id || user.email === item.user_email);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>

        <Badge variant={isLost ? 'danger' : 'success'} className="text-xs px-3 py-1 font-bold">
          {isLost ? 'REPORTED LOST' : 'REPORTED FOUND'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Image / Placeholder */}
        <div className="md:col-span-1 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
          {item.image_url || item.imageUrl ? (
            <img
              src={item.image_url || item.imageUrl}
              alt={item.title}
              className="w-full h-auto rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="text-center p-8 text-slate-600">
              <Tag className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-xs text-slate-500">No Photo Uploaded</p>
            </div>
          )}
        </div>

        {/* Right Column: Details & Claim action */}
        <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="default">{item.category}</Badge>
              {item.brand && <Badge variant="primary">Brand: {item.brand}</Badge>}
              {item.color && <Badge variant="purple">Color: {item.color}</Badge>}
              <Badge variant={item.status === 'resolved' ? 'success' : 'warning'}>
                Status: {item.status || 'Active'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{item.title}</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Location
              </span>
              <p className="text-slate-200 font-semibold">{item.location}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date Reported
              </span>
              <p className="text-slate-200 font-semibold">
                {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {item.storage_location && (
              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-800">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Handoff & Custody Station
                </span>
                <p className="text-emerald-300 font-semibold">{item.storage_location}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Description & Context
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              {item.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {!isLost && !isOwner && (
              <button
                onClick={() => setClaimModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>This is My Item (Submit Claim)</span>
              </button>
            )}

            {isOwner && (
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                You are the author of this report
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Claim Submission Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Submit Ownership Claim</h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide private identifying proof (e.g. unique marks, serial number, lock wallpaper, receipts) so security can verify your ownership.
              </p>
            </div>

            {claimError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Claim submitted! Campus security and finder have been notified.</span>
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Ownership Proof & Evidence *
                </label>
                <textarea
                  required
                  rows={4}
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  placeholder="Describe secret marks, stickers, engravings, or contents only you would know..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Callback Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading || claimSuccess}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {claimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailsPage;
