import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, PlusCircle, Trash2, Edit3, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { itemService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';
import ItemCard from '../../components/ItemCard';

export const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'lost', 'found'
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
      const res = await itemService.getMyReports();
      setReports(res.items || []);
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

  const handleStatusChange = async (itemId, status) => {
    try {
      await itemService.updateItemStatus(itemId, status);
      setActionMessage(`Item status updated to ${status}.`);
      fetchReports();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredReports = reports.filter((item) => {
    if (filterTab === 'lost') return item.type === 'lost';
    if (filterTab === 'found') return item.type === 'found';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">My Submitted Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your lost queries and found submissions with live status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/report-lost"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
          >
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
          >
            Report Found
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
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
          Lost Items ({reports.filter((r) => r.type === 'lost').length})
        </button>
        <button
          onClick={() => setFilterTab('found')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterTab === 'found'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Found Items ({reports.filter((r) => r.type === 'found').length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching your reports..." />
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((item) => {
            const itemId = item._id || item.id;
            return (
              <div
                key={itemId}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col justify-between"
              >
                <ItemCard item={item} />
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.status !== 'resolved' ? (
                      <button
                        onClick={() => handleStatusChange(itemId, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold hover:bg-emerald-500/20"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                      title="Edit details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(itemId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No reports found"
          description="You have not submitted any reports in this category yet."
          action={
            <div className="flex gap-3">
              <Link
                to="/report-lost"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
              >
                Report Lost Item
              </Link>
            </div>
          }
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Edit Item Report</h3>
                <p className="text-xs text-slate-400">Update headline, brand, color, or description.</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Title *</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow flex items-center gap-2"
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
