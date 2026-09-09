import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Camera, Sparkles, MapPin, CalendarDays,
  BellRing, X, ChevronLeft, ChevronRight, PackageOpen, Loader2,
} from 'lucide-react';
import { itemService } from '../../services/itemService';
import ItemCard from '../../components/ItemCard';
import { EmptyState, LoadingSpinner } from '../../components/UIComponents';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Electronics & Laptops', 'Backpacks & Bags', 'Phones', 'Keys & Keychains', 'Student IDs & Cards', 'Books & Notebooks', 'Wallets & Purses', 'Others'];
const LOCATIONS = ['All Locations', 'Central Library', 'Science Complex / Labs', 'Student Union Building', 'Main Cafeteria & Food Court', 'Hostel / Dormitories', 'Campus Grounds / Parking'];

export const FindItem = () => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', location: '', color: '', brand: '', date_from: '', date_to: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [message, setMessage] = useState('');

  const loadItems = async (nextPage = 1) => {
    setLoading(true);
    try {
      const params = { type: 'found', page: nextPage, limit: 12 };
      if (query.trim()) params.q = query.trim();
      Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
      const result = await itemService.getItems(params);
      setItems(result.items || []);
      setPage(result.page || nextPage);
      setPages(result.total_pages || result.pages || 1);
      setTotal(result.total || 0);
    } catch (error) {
      setItems([]);
      setMessage(error.response?.data?.message || 'Unable to load found items right now.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadItems(1); }, [filters]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([itemService.getMatches(), itemService.getMyReports()])
      .then(([matchResult, reportResult]) => {
        setMatches(matchResult.matches || []);
        setReports((reportResult.items || []).filter((item) => item.type === 'lost'));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handlePhotoSearch = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage('Please choose an image smaller than 5 MB.'); return; }
    setPhotoLoading(true); setMessage('Photo uploaded. Searching found-item records...');
    try {
      const result = await itemService.searchByImage(file, { page: 1, limit: 12 });
      setItems(result.items || []);
      setPage(result.page || 1);
      setPages(result.total_pages || 1);
      setTotal(result.total || 0);
      setMessage('Photo search complete. Review these possible found-item matches.');
    } catch (error) { setMessage(error.response?.data?.message || 'Photo search is unavailable right now.'); }
    finally { setPhotoLoading(false); event.target.value = ''; }
  };

  const clearFilters = () => { setQuery(''); setFilters({ category: '', location: '', color: '', brand: '', date_from: '', date_to: '' }); };
  const activeMatch = matches[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Campus recovery desk</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-100">Find Your Lost Item</h1>
        <p className="mt-3 text-sm text-slate-400">Search found items reported across campus. Use text, filters, or upload a photo to find possible matches.</p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 shadow-xl">
        <form onSubmit={(event) => { event.preventDefault(); loadItems(1); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={'Search "black wallet", "AirPods", "blue backpack"...'} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none focus:border-emerald-500" />
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"><Search className="h-4 w-4" />Search</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-emerald-500"><Camera className="h-4 w-4 text-emerald-400" />{photoLoading ? 'Analyzing photo...' : 'Search by Photo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoSearch} className="hidden" /></label>
          <button type="button" onClick={() => document.getElementById('smart-matches')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-amber-400"><Sparkles className="h-4 w-4 text-amber-300" />Smart Match</button>
          <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 sm:hidden"><SlidersHorizontal className="h-4 w-4" />Filters</button>
        </div>
        {message && <p className="mt-4 text-xs text-emerald-300">{message}</p>}
      </section>

      <section><div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold text-slate-100">What are you looking for?</h2><button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-200">Clear filters</button></div><div className="flex gap-2 overflow-x-auto pb-2">{CATEGORIES.map((category) => <button key={category} onClick={() => setFilters((current) => ({ ...current, category }))} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs ${filters.category === category ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>{category}</button>)}</div></section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit"><FilterFields filters={filters} setFilters={setFilters} /></aside>
        <section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-500">Found items</p><h2 className="text-xl font-semibold text-slate-100">Recently Found <span className="text-sm font-normal text-slate-500">({total})</span></h2></div><Link to="/report-found" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">Found something? Report it</Link></div>{loading ? <LoadingSpinner text="Searching found-item records..." /> : items.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ItemCard key={item._id} item={item} />)}</div> : <EmptyState icon={PackageOpen} title="No matching items found" description="Try another keyword, location, category, or upload a photo." />}{pages > 1 && <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4"><span className="text-xs text-slate-500">Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => loadItems(page - 1)} className="rounded-lg border border-slate-800 p-2 text-slate-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= pages} onClick={() => loadItems(page + 1)} className="rounded-lg border border-slate-800 p-2 text-slate-400 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}</section>
      </div>

      {isAuthenticated && <section id="smart-matches" className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-semibold text-amber-200"><Sparkles className="h-4 w-4" />Possible Matches For You</p><p className="mt-1 text-xs text-slate-400">Matches are suggestions only. Ownership still requires a claim and admin review.</p></div>{reports.length > 0 && <span className="text-xs text-slate-500">{reports.length} lost report{reports.length === 1 ? '' : 's'}</span>}</div>{activeMatch ? <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-100">{activeMatch.found_item?.title || 'Possible found item'}</p><p className="mt-1 text-xs text-amber-300">Match confidence: {Math.round(activeMatch.similarity_score || 0)}%</p></div><Link to={`/items/${activeMatch.found_item_id}`} className="text-xs font-semibold text-emerald-400">View match</Link></div> : <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400">No possible matches yet. We’ll continue checking newly reported items.</p>{reports[0] && <button onClick={async () => { try { await itemService.createWatchlist(reports[0]._id); setMessage('Smart Watch enabled for your lost report.'); } catch (error) { setMessage(error.response?.data?.message || 'Could not enable Smart Watch.'); } }} className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300"><BellRing className="h-4 w-4" />Notify me about similar items</button>}</div>}</section>}

      {filterOpen && <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 sm:hidden" onClick={() => setFilterOpen(false)}><div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-slate-800 bg-slate-900 p-6" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold text-slate-100">Filters</h2><button onClick={() => setFilterOpen(false)}><X className="h-5 w-5 text-slate-400" /></button></div><FilterFields filters={filters} setFilters={setFilters} /><button onClick={() => setFilterOpen(false)} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white">Show results</button></div></div>}
    </div>
  );
};

const FilterFields = ({ filters, setFilters }) => <div className="space-y-4"><label className="block text-xs font-semibold text-slate-400">Category<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"><option value="">All categories</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-xs font-semibold text-slate-400">Location<select value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">{LOCATIONS.map((location) => <option key={location} value={location === 'All Locations' ? '' : location}>{location}</option>)}</select></label>{['brand', 'color'].map((name) => <label key={name} className="block text-xs font-semibold capitalize text-slate-400">{name}<input value={filters[name]} onChange={(event) => setFilters((current) => ({ ...current, [name]: event.target.value }))} placeholder={`Any ${name}`} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200" /></label>)}<div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-400">From<input type="date" value={filters.date_from} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200" /></label><label className="text-xs text-slate-400">To<input type="date" value={filters.date_to} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200" /></label></div></div>;

export default FindItem;