import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Trash2, Edit3, CheckCircle2, AlertCircle, Loader2, MapPin, Calendar, Eye, Image as ImageIcon } from 'lucide-react';
import { itemService, claimService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'lost', 'found', 'ownership'
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // Edit Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        itemService.getMyReports().catch(() => ({ items: [] })),
        claimService.getMyClaims().catch(() => ({ claims: [] })),
      ]);

      const items = (itemsRes.items || []).map(item => ({
        ...item,
        isClaim: false,
      }));

      const claims = (claimsRes.claims || []).map(claim => ({
        ...claim,
        _id: claim._id || claim.id,
        title: claim.item_title || 'Item Ownership Request',
        type: 'ownership_request',
        category: claim.item_category || 'Claim',
        status: claim.status || 'UNDER_REVIEW',
        reference_id: claim.reference_id || `REQ-${claim._id?.slice(-5)?.toUpperCase()}`,
        description: claim.proof_description || claim.additional_information || '',
        imageUrl: claim.supporting_image_url || claim.evidence_image_url || '',
        isClaim: true,
      }));

      setReports([...items, ...claims]);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditBrand(item.brand || '');
    setEditColor(item.color || '');
    setEditDescription(item.description || '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditLoading(true);
    try {
      await itemService.updateItem(editingItem._id || editingItem.id, {
        title: editTitle.trim(),
        brand: editBrand.trim(),
        color: editColor.trim(),
        description: editDescription.trim(),
      });
      setActionMessage('Report updated successfully.');
      setEditingItem(null);
      fetchReports();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await itemService.deleteItem(itemId);
      setActionMessage('Report removed successfully.');
      fetchReports();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const filteredReports = reports.filter((item) => {
    if (filterTab === 'lost') return item.type === 'lost';
    if (filterTab === 'found') return item.type === 'found';
    if (filterTab === 'ownership') return item.type === 'ownership_request';
    return true;
  });

  const getStatusBadge = (item) => {
    const rawStatus = (item.delivery_status || item.status || 'open').toLowerCase();
    if (rawStatus.includes('resolve') || rawStatus === 'closed') {
      return <Badge variant="success">Resolved</Badge>;
    }
    if (rawStatus === 'ready_for_collection') {
      return <Badge variant="warning">Ready for Collection</Badge>;
    }
    if (rawStatus === 'stored') {
      return <Badge variant="info">Stored</Badge>;
    }
    if (rawStatus === 'waiting_for_delivery') {
      return <Badge variant="warning">Waiting for Delivery</Badge>;
    }
    if (rawStatus === 'under_review' || rawStatus === 'pending') {
      return <Badge variant="warning">Under Review</Badge>;
    }
    if (rawStatus === 'matched') {
      return <Badge variant="info">Possible Match</Badge>;
    }
    return <Badge variant="gray">{item.status || 'Active'}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">My Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track and monitor the status of your reported lost items, found turn-ins, and ownership requests.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Reports ({reports.length})
        </button>
        <button
          onClick={() => setFilterTab('lost')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterTab === 'lost' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Lost ({reports.filter((r) => r.type === 'lost').length})
        </button>
        <button
          onClick={() => setFilterTab('found')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterTab === 'found' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Found ({reports.filter((r) => r.type === 'found').length})
        </button>
        <button
          onClick={() => setFilterTab('ownership')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterTab === 'ownership' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Ownership Requests ({reports.filter((r) => r.type === 'ownership_request').length})
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching your reports..." />
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((item) => {
            const itemId = item._id || item.id;
            const itemImage = item.image_url || item.imageUrl || item.found_image || item.supporting_image_url;
            const targetUrl = item.isClaim ? `/items/${item.item_id || itemId}` : `/items/${itemId}`;

            return (
              <div
                key={itemId}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col justify-between shadow-xl hover:border-slate-700 transition"
              >
                {/* Image Section */}
                <div className="h-44 bg-slate-950 relative overflow-hidden">
                  {itemImage ? (
                    <img src={itemImage} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/80">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${
                      item.type === 'lost' ? 'bg-rose-500 text-white' : item.type === 'found' ? 'bg-emerald-500 text-white' : 'bg-violet-600 text-white'
                    }`}>
                      {item.type === 'lost' ? 'LOST' : item.type === 'found' ? 'FOUND' : 'OWNERSHIP REQ'}
                    </span>
                    {item.reference_id && (
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-900/90 text-slate-200 border border-slate-700 shadow-md">
                        {item.reference_id}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    {getStatusBadge(item)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base line-clamp-1 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {item.description || 'No detailed description logged.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    {item.location && (
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{item.location}</span>
                      </p>
                    )}
                    {item.date && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      to={targetUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    {!item.isClaim && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No reports in this category"
          description="You currently have no records under this tab. Submitted lost reports, found items, and ownership requests will appear here."
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Edit Report</h3>
              <p className="text-xs text-slate-400 mt-1">Update details for {editingItem.reference_id || 'item'}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Name</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
