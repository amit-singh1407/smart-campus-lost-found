import React, { useState, useEffect } from 'react';
import { Package, Search, Trash2, CheckCircle2, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { adminService, itemService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminItems({ type: filterType === 'all' ? undefined : filterType });
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to permanently remove this listing?')) return;
    try {
      await itemService.deleteItem(id);
      setItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await itemService.updateItemStatus(id, newStatus);
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert('Failed to update item status.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Inventory & Listing Moderation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervise all lost & found submissions, custody lockers, and resolution statuses.
          </p>
        </div>

        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterType === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterType === 'lost' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterType === 'found' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading campus inventory listings..." />
      ) : items.length > 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => {
                  const itemId = item._id || item.id;
                  const isLost = item.type === 'lost';
                  return (
                    <tr key={itemId} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-semibold text-slate-100 max-w-xs">
                        <div>{item.title}</div>
                        <div className="text-[11px] text-slate-500 font-normal truncate">
                          {item.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{item.category}</td>
                      <td className="px-6 py-4 text-slate-400">{item.location}</td>
                      <td className="px-6 py-4">
                        <Badge variant={isLost ? 'danger' : 'success'}>
                          {isLost ? 'LOST' : 'FOUND'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === 'resolved' ? 'success' : 'purple'}>
                          {item.status || 'open'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.status !== 'resolved' && (
                          <button
                            onClick={() => handleStatusChange(itemId, 'resolved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold hover:bg-emerald-500/20"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(itemId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex items-center"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No items found"
          description="There are currently no items logged in the campus system matching this filter."
        />
      )}
    </div>
  );
};

export default AdminItemsPage;
