import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RefreshCw, Layers, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { itemService } from '../../services/itemService';
import ItemCard from '../../components/ItemCard';
import { LoadingSpinner, EmptyState } from '../../components/UIComponents';

const CATEGORIES = [
  'All',
  'Electronics & Laptops',
  'Student IDs & Cards',
  'Keys & Keychains',
  'Backpacks & Bags',
  'Books & Notebooks',
  'Clothing & Apparel',
  'Wallets & Purses',
  'Water Bottles & Accessories',
  'Others',
];

const LOCATIONS = [
  'All Locations',
  'Central Library',
  'Science Complex / Labs',
  'Student Union Building',
  'Main Cafeteria & Food Court',
  'Sports Arena / Gymnasium',
  'Engineering Block',
  'Auditorium',
  'Hostel / Dormitories',
  'Campus Grounds / Parking',
];

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchItems = async (currentPage = page) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
      };
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation !== 'All Locations') params.location = selectedLocation;
      if (brandFilter.trim()) params.brand = brandFilter.trim();
      if (colorFilter.trim()) params.color = colorFilter.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await itemService.getItems(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error('Failed to load items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(1);
  }, [selectedType, selectedCategory, selectedLocation, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchItems(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Campus Lost & Found Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search {total} verified reports and turn-ins logged across the university.
          </p>
        </div>

        {/* Tab Filters for Type */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedType('lost')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === 'lost'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setSelectedType('found')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === 'found'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search keyword (e.g. MacBook, AirPods, Dell, Leather Wallet)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Brand / Make</label>
            <input
              type="text"
              placeholder="e.g. Apple, Sony"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              onBlur={() => fetchItems(1)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Color</label>
            <input
              type="text"
              placeholder="e.g. Silver, Black"
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              onBlur={() => fetchItems(1)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              setSearchQuery('');
              setBrandFilter('');
              setColorFilter('');
              setSelectedCategory('All');
              setSelectedLocation('All Locations');
              setSelectedType('all');
              setStatusFilter('all');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Item Grid & States */}
      {loading ? (
        <LoadingSpinner text="Searching campus listings..." />
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item._id || item.id} item={item} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages} ({total} total results)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800">
                  {page}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="No items found"
          description="There are no items matching your criteria. Try adjusting keywords or filters."
        />
      )}
    </div>
  );
};

export default BrowsePage;
