import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Trash2, CheckCircle2, AlertCircle, MapPin, Calendar, Archive, ShieldCheck, Box, RefreshCw } from 'lucide-react';
import { adminService, itemService } from '../../services/itemService';
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

export const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const heroRef = useRef(null);
  
  // Storage Assignment state
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [storageForm, setStorageForm] = useState({ location: '', room: '', locker: '' });

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

  const handleDeliveryStatusChange = async (id, newDeliveryStatus) => {
    try {
      await itemService.updateItem(id, { delivery_status: newDeliveryStatus });
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, delivery_status: newDeliveryStatus } : item
        )
      );
    } catch (err) {
      alert('Failed to update delivery status.');
    }
  };

  const submitStorage = async (e) => {
    e.preventDefault();
    try {
      const formattedStorage = `Storage: ${storageForm.location}, Room: ${storageForm.room}, Locker: ${storageForm.locker}`;
      await itemService.updateItem(selectedItemId, { 
        delivery_status: 'STORED', 
        storage_location: formattedStorage 
      });
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === selectedItemId ? { ...item, delivery_status: 'STORED', storage_location: formattedStorage } : item
        )
      );
      setStorageModalOpen(false);
      setStorageForm({ location: '', room: '', locker: '' });
      setSelectedItemId(null);
    } catch (err) {
      alert('Failed to assign storage.');
    }
  };

  const openStorageModal = (id) => {
    setSelectedItemId(id);
    setStorageModalOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.reference_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* derived counts */
  const totalItems    = items.length;
  const lostCount     = items.filter(i => i.type === 'lost').length;
  const foundCount    = items.filter(i => i.type === 'found').length;
  const pendingCount  = items.filter(i => i.delivery_status === 'WAITING_FOR_DELIVERY').length;

  return (
    <div className="space-y-8 animate-fade-in relative max-w-7xl mx-auto">

      {/* ══ INTERACTIVE HERO ══ */}
      <div
        ref={heroRef}
        style={{ transition: 'transform 0.12s ease-out' }}
        className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 shadow-2xl shadow-emerald-500/5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-6 right-16 w-52 h-52 bg-emerald-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-24 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-widest mb-5 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live · Inventory Control
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">Inventory &</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">Moderation</span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm max-w-md leading-relaxed">
              Supervise all lost & found submissions, track physical drop-offs through the custody chain, and manage resolution statuses.
            </p>
            {/* Embedded search */}
            <div className="mt-6 flex gap-3 max-w-md">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search items, ref IDs, locations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-700 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all backdrop-blur-md shadow-inner"
                />
              </div>
              <div className="flex p-1 gap-1 rounded-2xl bg-slate-950/60 border border-slate-700 backdrop-blur-md">
                {['all', 'lost', 'found'].map(type => (
                  <button key={type} onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all duration-200 ${
                      filterType === type
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>{type}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — stat tiles */}
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
            {[
              { label: 'Total Items',     value: totalItems,   icon: Package,    color: 'slate'   },
              { label: 'Lost Reports',    value: lostCount,    icon: Package,    color: 'rose'    },
              { label: 'Found Turn-ins',  value: foundCount,   icon: Package,    color: 'emerald' },
              { label: 'Awaiting Drop',   value: pendingCount, icon: ShieldCheck,color: 'indigo'  },
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

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Syncing Campus Inventory...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const itemId = item._id || item.id;
            const isLost = item.type === 'lost';
            
            return (
              <div key={itemId} className="group flex flex-col bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-xl">
                {/* Image / Header Section */}
                <div className="h-40 bg-slate-950 relative overflow-hidden">
                  {(item.found_image || item.imageUrl) ? (
                    <img src={item.found_image || item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                      <Package className="w-10 h-10 text-slate-800" />
                    </div>
                  )}
                  
                  {/* Absolute Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${isLost ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                      {isLost ? 'LOST' : 'FOUND'}
                    </span>
                    {item.reference_id && (
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-900/80 text-slate-300 border border-slate-700/50 backdrop-blur-md">
                        {item.reference_id}
                      </span>
                    )}
                  </div>
                  {item.type === 'found' && item.found_image && (
                    <a href={item.found_image} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-[10px] font-bold text-slate-200 hover:text-white">
                      View Found Photo
                    </a>
                  )}

                  <div className="absolute top-3 right-3">
                    <Badge variant={item.status === 'resolved' ? 'success' : 'gray'} className="shadow-lg backdrop-blur-md bg-slate-900/90 border-slate-700">
                      {item.status || 'open'}
                    </Badge>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-100 text-lg line-clamp-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{item.location}</span>
                  </div>
                  
                  {/* Delivery Status (For Found Items) */}
                  {!isLost && item.delivery_method === 'LOST_FOUND_CENTER' && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Custody</span>
                        <Badge variant={item.delivery_status === 'STORED' ? 'success' : item.delivery_status === 'SECURED' ? 'blue' : 'purple'} size="sm">
                          {item.delivery_status?.replace(/_/g, ' ') || 'PENDING'}
                        </Badge>
                      </div>
                      
                      {item.storage_location ? (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                          {item.storage_location}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No physical location assigned yet.</p>
                      )}
                    </div>
                  )}

                  <div className="flex-1"></div>

                  {/* Actions Section */}
                  <div className="mt-5 pt-4 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Dynamic Delivery Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!isLost && item.delivery_method === 'LOST_FOUND_CENTER' && item.delivery_status !== 'STORED' && (
                        <>
                          {item.delivery_status === 'WAITING_FOR_DELIVERY' && (
                             <button onClick={() => handleDeliveryStatusChange(itemId, 'RECEIVED')} className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Receive
                             </button>
                          )}
                          {item.delivery_status === 'RECEIVED' && (
                             <button onClick={() => handleDeliveryStatusChange(itemId, 'SECURED')} className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                               <ShieldCheck className="w-3.5 h-3.5" /> Secure
                             </button>
                          )}
                          {item.delivery_status === 'SECURED' && (
                             <button onClick={() => openStorageModal(itemId)} className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                               <Archive className="w-3.5 h-3.5" /> Assign Locker
                             </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatusChange(itemId, 'resolved')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem(itemId)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No Items Found</h3>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            There are currently no items logged in the campus system matching your filters or search query.
          </p>
        </div>
      )}

      {/* Storage Assignment Modal with Glassmorphism */}
      {storageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" 
            onClick={() => setStorageModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-[2rem] p-8 shadow-2xl shadow-emerald-500/10 transform transition-all animate-fade-in-up">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                <Box className="w-6 h-6" />
              </div>
              Assign Locker
            </h3>
             
            <form onSubmit={submitStorage} className="space-y-5 relative z-10">
               <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Building / Facility</label>
                  <input type="text" required value={storageForm.location} onChange={e => setStorageForm({...storageForm, location: e.target.value})} placeholder="e.g. Student Activity Center" className="w-full px-5 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner text-sm" />
               </div>
               <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Room / Area</label>
                  <input type="text" required value={storageForm.room} onChange={e => setStorageForm({...storageForm, room: e.target.value})} placeholder="e.g. Ground Floor Desk" className="w-full px-5 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner text-sm" />
               </div>
               <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Locker ID</label>
                  <input type="text" required value={storageForm.locker} onChange={e => setStorageForm({...storageForm, locker: e.target.value})} placeholder="e.g. Bin 14, Locker B" className="w-full px-5 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner text-sm font-mono" />
               </div>
               <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/60 mt-8">
                 <button type="button" onClick={() => setStorageModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold">Cancel</button>
                 <button type="submit" className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5 active:translate-y-0">
                   Confirm Storage
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminItemsPage;
