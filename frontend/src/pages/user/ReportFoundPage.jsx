import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Camera,
  UploadCloud,
  X,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Calendar
} from "lucide-react";
import { itemService } from "../../services/itemService";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner, EmptyState, Badge } from "../../components/UIComponents";

const CATEGORIES = [
  "All",
  "Electronics & Laptops",
  "Student IDs & Cards",
  "Keys & Keychains",
  "Backpacks & Bags",
  "Books & Notebooks",
  "Clothing & Apparel",
  "Wallets & Purses",
  "Water Bottles & Accessories",
  "Others",
];

const LOCATIONS = [
  "Central Library",
  "Science Complex / Labs",
  "Student Union Building",
  "Main Cafeteria & Food Court",
  "Sports Arena / Gymnasium",
  "Engineering Block",
  "Auditorium",
  "Hostel / Dormitories",
  "Campus Grounds / Parking",
  "Other",
];

export const ReportFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [view, setView] = useState("discover"); // discover | photo_search | confirm | success
  
  // Discover State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Photo Search State
  const [photoSearchFile, setPhotoSearchFile] = useState(null);
  const [photoSearchPreview, setPhotoSearchPreview] = useState("");
  const [photoSearching, setPhotoSearching] = useState(false);
  const [photoSearchResults, setPhotoSearchResults] = useState(null);
  const [photoSearchError, setPhotoSearchError] = useState("");

  // Confirm State
  const [selectedLostItem, setSelectedLostItem] = useState(null);
  const [confirmData, setConfirmData] = useState({
    found_location: LOCATIONS[0],
    delivery_method: "LOST_FOUND_CENTER",
    found_image: "",
    description: "",
  });
  const [confirmImageFile, setConfirmImageFile] = useState(null);
  const [confirmImagePreview, setConfirmImagePreview] = useState("");
  const [confirmUploading, setConfirmUploading] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [referenceId, setReferenceId] = useState("");

  useEffect(() => {
    if (view === "discover") {
      fetchLostItems();
    }
  }, [view, searchQuery, category, locationFilter, dateFilter, statusFilter, page]);

  const fetchLostItems = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = { type: "lost", status: statusFilter, limit: 12, page };
      if (searchQuery) params.q = searchQuery;
      if (category !== "All") params.category = category;
      if (locationFilter !== "All") params.location = locationFilter;
      if (dateFilter) {
        params.date_from = dateFilter;
        params.date_to = `${dateFilter}T23:59:59`;
      }
      const res = await itemService.getItems(params);
      setItems(res.items || []);
      setTotalReports(res.total || 0);
      setTotalPages(res.total_pages || res.pages || 1);
    } catch (err) {
      console.error("Failed to fetch lost items", err);
      setLoadError("Lost reports could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetToFirstPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handlePhotoSearchSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoSearchFile(file);
    setPhotoSearchPreview(URL.createObjectURL(file));
    setPhotoSearching(true);
    setPhotoSearchError("");
    setPhotoSearchResults(null);

    try {
      const res = await itemService.searchByImage(file, {
        target_type: "lost",
        threshold: 100,
        limit: 5,
      });
      setPhotoSearchResults((res.items || []).filter((item) => Number(item.image_match_score) >= 100));
    } catch (err) {
      setPhotoSearchError("Failed to search by photo. Please try again.");
    } finally {
      setPhotoSearching(false);
    }
  };

  const handleConfirmImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConfirmImageFile(file);
    setConfirmImagePreview(URL.createObjectURL(file));
    setConfirmUploading(true);
    
    try {
      const res = await itemService.uploadImage(file);
      setConfirmData(prev => ({ ...prev, found_image: res.url }));
    } catch (err) {
      setConfirmError("Failed to upload image. You can still submit.");
    } finally {
      setConfirmUploading(false);
    }
  };

  const handleFoundClick = (item) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/report-found' } } });
      return;
    }
    setSelectedLostItem(item);
    setView("confirm");
  };

  const submitFoundConfirmation = async () => {
    setConfirmSubmitting(true);
    setConfirmError("");

    if (!confirmData.found_image) {
      setConfirmError("Please upload a photograph of the found item (* required).");
      setConfirmSubmitting(false);
      return;
    }

    try {
      const payload = {
        matched_lost_item_id: selectedLostItem._id,
        found_location: confirmData.found_location,
        delivery_method: confirmData.delivery_method,
        found_image: confirmData.found_image,
        found_description: confirmData.description.trim(),
        description: confirmData.description.trim(),
        found_at: new Date().toISOString(),
      };
      const res = await itemService.submitFoundConfirmation(payload);
      setReferenceId(res.reference_id);
      setView("success");
    } catch (err) {
      setConfirmError(err.response?.data?.message || "Failed to submit found confirmation.");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const renderLostItemCard = (item, isMatch = false) => {
    const itemImage = item.image_url || item.imageUrl || item.found_image || item.found_image_url || item.image;

    return (
    <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col hover:border-blue-500/30 transition-colors shadow-lg">
      <div className="h-48 bg-slate-800 relative">
        {itemImage ? (
          <img src={itemImage} alt={item.title || 'Lost item photo'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800/50">
            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-semibold">No Image Provided</span>
          </div>
        )}
        {isMatch && item.image_match_score && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {item.image_match_score}% Match
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3">
          <Badge variant="danger" className="mb-2 inline-block shadow-sm">Reported Lost</Badge>
          <h3 className="font-bold text-slate-100 text-lg line-clamp-1">{item.title}</h3>
        </div>
        <div className="space-y-2 text-xs text-slate-400 mb-5 flex-1">
          <p className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Category:</span> {item.category}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400" /> 
            <span className="line-clamp-1">Lost near {item.location}</span>
          </p>
          <p className="flex items-center gap-2">
             <Calendar className="w-3.5 h-3.5 text-blue-400" /> 
             Reported: {item.date ? new Date(item.date).toLocaleDateString() : 'Unknown date'}
          </p>
          {item.description && (
             <p className="line-clamp-2 mt-2 pt-2 border-t border-slate-800 italic">
               "{item.description}"
             </p>
          )}
        </div>
        <button
          onClick={() => handleFoundClick(item)}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          I FOUND THIS ITEM
        </button>
      </div>
    </div>
  );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {view === "discover" ? (
            <Link to="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <button 
              onClick={() => setView("discover")} 
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {view === "success" ? "Thank You!" : "I Found an Item"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Help return a lost item to its owner by confirming a match.
            </p>
          </div>
        </div>
      </div>

      {view === "discover" && (
        <div className="space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search reported lost items by name, location or description..." 
                  value={searchQuery}
                  onChange={resetToFirstPage(setSearchQuery)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                />
              </div>
              <button 
                  onClick={() => setView("photo_search")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-md"
              >
                <Camera className="w-5 h-5 text-blue-400" />
                <span>Find by Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-800/60 scrollbar-hide">
              <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Filters:</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition ${
                    category === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <select value={locationFilter} onChange={resetToFirstPage(setLocationFilter)} className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 text-xs focus:outline-none focus:border-blue-500">
                <option value="All">All campus locations</option>
                {LOCATIONS.map(location => <option key={location} value={location}>{location}</option>)}
              </select>
              <input type="date" value={dateFilter} onChange={resetToFirstPage(setDateFilter)} className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 text-xs focus:outline-none focus:border-blue-500" aria-label="Filter by lost date" />
              <select value={statusFilter} onChange={resetToFirstPage(setStatusFilter)} className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 text-xs focus:outline-none focus:border-blue-500">
                <option value="active">Active reports</option>
                <option value="open">Open</option>
                <option value="matched">Already matched</option>
                <option value="all">Any status</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-200">Recently Reported Lost Items</h3>
              <Badge variant="primary" className="text-xs">
                {items.length} of {totalReports} reports
              </Badge>
            </div>
            {loadError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {loadError}
              </div>
            )}
            {loading ? (
              <LoadingSpinner text="Loading lost items..." />
            ) : items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(item => renderLostItemCard(item))}
              </div>
            ) : (
              <div className="max-w-lg mx-auto mt-10">
                <EmptyState icon={Search} title="No lost items found" description="Try adjusting your search filters or categories to see more results." />
              </div>
            )}
            {!loading && !loadError && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40">Previous</button>
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "photo_search" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-400" />
              Find Match by Photo
            </h3>
            
            {photoSearchPreview ? (
               <div className="relative rounded-2xl border border-slate-700 overflow-hidden bg-slate-950 p-4 flex items-center justify-between mb-8 shadow-inner">
                <div className="flex items-center gap-4">
                  <img src={photoSearchPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-800 shadow-md" />
                  <div>
                    <p className="text-sm font-bold text-slate-200 mb-1">Uploaded Photograph</p>
                    <p className="text-xs text-slate-400">Ready for AI processing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhotoSearchPreview(""); setPhotoSearchFile(null); setPhotoSearchResults(null); }}
                  className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-950/50 cursor-pointer transition mb-8 group">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <span className="text-base font-bold text-slate-200 mb-1">Upload Found Item Photo</span>
                <span className="text-sm font-medium text-slate-400">Our AI will compare it against active LOST items</span>
                <input type="file" accept="image/*" onChange={handlePhotoSearchSelect} className="hidden" />
              </label>
            )}

            {photoSearchError && (
              <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {photoSearchError}
              </div>
            )}

            {photoSearching && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                 <p className="text-base font-semibold text-slate-300 animate-pulse">Running AI Image Similarity Matching...</p>
                 <p className="text-xs text-slate-500">Comparing against database of lost items</p>
              </div>
            )}

            {photoSearchResults && !photoSearching && (
               <div className="space-y-6 border-t border-slate-800 pt-8 mt-2">
                 <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                   Exact Matches Found (100% only)
                 </h4>
                 {photoSearchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {photoSearchResults.map(item => renderLostItemCard(item, true))}
                    </div>
                 ) : (
                    <EmptyState icon={AlertCircle} title="No visual matches found" description="Try taking a clearer photo from a different angle or browse the list manually." />
                 )}
               </div>
            )}
          </div>
        </div>
      )}

      {view === "confirm" && selectedLostItem && (
        <div className="max-w-2xl mx-auto space-y-6">
           <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
             <div className="mb-8">
               <h3 className="text-2xl font-bold text-slate-100">You found this item?</h3>
               <p className="text-slate-400 text-sm mt-1">Please confirm the details below to log this item as found.</p>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 mb-8 shadow-inner">
               <div className="w-full sm:w-32 h-40 sm:h-32 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                 {(selectedLostItem.image_url || selectedLostItem.imageUrl || selectedLostItem.found_image || selectedLostItem.found_image_url || selectedLostItem.image) ? (
                   <img src={selectedLostItem.image_url || selectedLostItem.imageUrl || selectedLostItem.found_image || selectedLostItem.found_image_url || selectedLostItem.image} alt={selectedLostItem.title || 'Lost item photo'} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                     <ImageIcon className="mb-2 opacity-50" />
                     <span className="text-[10px] uppercase font-bold">No Image</span>
                   </div>
                 )}
               </div>
               <div className="flex flex-col justify-center">
                 <Badge variant="danger" className="self-start mb-2 shadow-sm">Reported Lost Item</Badge>
                 <h4 className="font-bold text-slate-100 text-lg mb-1">{selectedLostItem.title}</h4>
                 <p className="text-sm text-slate-400 line-clamp-2 italic">"{selectedLostItem.description || 'No description provided'}"</p>
                 <div className="text-xs font-semibold text-slate-300 mt-3 flex items-center gap-1.5">
                   <MapPin className="w-4 h-4 text-blue-400" /> 
                   Lost near {selectedLostItem.location}
                 </div>
               </div>
             </div>

             {confirmError && (
               <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 {confirmError}
               </div>
             )}

             <div className="space-y-6">
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-800/30">
                  <label className="block text-sm font-bold text-slate-200 mb-1.5">
                    Upload Photo <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-4">Taking a picture helps verify this item matches the lost report.</p>
                  {confirmImagePreview ? (
                    <div className="flex items-center gap-5 p-3 rounded-xl bg-slate-950 border border-slate-700">
                      <img src={confirmImagePreview} alt="Found Item" className="w-24 h-24 object-cover rounded-lg border border-slate-800 shadow-md" />
                      <div>
                        <p className="text-sm font-bold text-slate-200 mb-2">Photo Attached</p>
                        <button onClick={() => {setConfirmImagePreview(""); setConfirmImageFile(null); setConfirmData(p => ({...p, found_image: ""}))}} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition">Remove Photo</button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 cursor-pointer text-sm font-bold transition shadow-sm">
                      <Camera className="w-5 h-5" />
                      Take / Upload Photo *
                      <input type="file" accept="image/*" onChange={handleConfirmImageSelect} className="hidden" />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2">
                    Where did you find it? <span className="text-rose-400">*</span>
                  </label>
                  <select 
                    value={confirmData.found_location}
                    onChange={(e) => setConfirmData(prev => ({...prev, found_location: e.target.value}))}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Where is the item now? <span className="text-rose-400">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition shadow-sm ${confirmData.delivery_method === 'WITH_ME' ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="delivery_method" 
                        value="WITH_ME"
                        checked={confirmData.delivery_method === 'WITH_ME'}
                        onChange={(e) => setConfirmData(prev => ({...prev, delivery_method: e.target.value}))}
                        className="mt-1 w-4 h-4 accent-blue-500"
                      />
                      <div>
                        <p className="font-bold text-slate-100 text-sm mb-0.5">With Me</p>
                        <p className="text-xs text-slate-400">You currently have the item and will hold it until verified.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition shadow-sm ${confirmData.delivery_method === 'LOST_FOUND_CENTER' ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="delivery_method" 
                        value="LOST_FOUND_CENTER"
                        checked={confirmData.delivery_method === 'LOST_FOUND_CENTER'}
                        onChange={(e) => setConfirmData(prev => ({...prev, delivery_method: e.target.value}))}
                        className="mt-1 w-4 h-4 accent-blue-500"
                      />
                      <div>
                        <p className="font-bold text-slate-100 text-sm mb-0.5">Lost & Found Center</p>
                        <p className="text-xs text-slate-400">You will deliver or have delivered it to the Campus Lost & Found Center.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition shadow-sm ${confirmData.delivery_method === 'CAMPUS_SECURITY' ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="delivery_method" 
                        value="CAMPUS_SECURITY"
                        checked={confirmData.delivery_method === 'CAMPUS_SECURITY'}
                        onChange={(e) => setConfirmData(prev => ({...prev, delivery_method: e.target.value}))}
                        className="mt-1 w-4 h-4 accent-blue-500"
                      />
                      <div>
                        <p className="font-bold text-slate-100 text-sm mb-0.5">Campus Security</p>
                        <p className="text-xs text-slate-400">Turned over to Campus Security officers or guard post.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={confirmData.description}
                    onChange={(e) => setConfirmData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Provide details about where found and physical condition (e.g. Black backpack found near library entrance with blue notebook inside)..."
                    className="w-full px-5 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-slate-800">
                  <button onClick={() => setView("discover")} className="flex-1 py-3.5 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition shadow-sm">
                    Cancel & Go Back
                  </button>
                  <button onClick={submitFoundConfirmation} disabled={confirmSubmitting || confirmUploading} className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {confirmSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Submit Found Report
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {view === "success" && (
        <div className="max-w-xl mx-auto mt-12 animate-fade-in">
          <div className="p-10 rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-3xl font-extrabold text-slate-100 mb-2">Found Report Submitted!</h3>
              <p className="text-slate-400 text-sm">Thank you for helping the campus community.</p>
            </div>
            
            <div className="space-y-6 py-6 px-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-sm mx-auto">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Reference ID</p>
                <p className="font-mono text-2xl font-bold text-blue-400 tracking-wider">{referenceId}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-sm mx-auto">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-0.5">Status</p>
                <p className="text-sm font-bold text-emerald-400">Waiting for Delivery</p>
              </div>

              {confirmData.delivery_method === "LOST_FOUND_CENTER" || confirmData.delivery_method === "CAMPUS_SECURITY" ? (
                <div className="p-4 rounded-xl bg-slate-800/60 inline-block text-left border border-slate-700 shadow-sm w-full max-w-sm mx-auto">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-400 text-sm">Campus Lost & Found Center</p>
                      <p className="text-xs text-slate-300 mt-0.5">Deliver to Security Desk using your Reference ID.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Item is safely with you. You will be notified when admin confirms ownership for handover.
                </p>
              )}
            </div>
            
            <div className="pt-4">
               <Link to="/dashboard" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20">
                 Return to Dashboard
               </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportFoundPage;
