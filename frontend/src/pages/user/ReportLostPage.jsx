import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Calendar,
  Tag,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { itemService } from '../../services/itemService';

const CATEGORIES = [
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
  'Central Library',
  'Science Complex / Labs',
  'Student Union Building',
  'Main Cafeteria & Food Court',
  'Sports Arena / Gymnasium',
  'Engineering Block',
  'Auditorium',
  'Hostel / Dormitories',
  'Campus Grounds / Parking',
  'Other Specific Location',
];

export const ReportLostPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    brand: '',
    color: '',
    location: LOCATIONS[0],
    specificLocation: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    distinctiveFeatures: '',
    privateVerificationQuestions: '',
    imageUrl: '',
    imageHash: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // AI Report Quality Assistant state
  const [qualityData, setQualityData] = useState({
    quality_score: 25,
    rating: 'Needs Detail',
    badge_color: 'rose',
    recommendation: 'Start filling out details. Adding brand, color, and location boosts AI matching fidelity.',
    strengths: [],
    suggestions: ['Add a descriptive item name and brand', 'Specify the campus location where last seen'],
  });
  const [analyzingQuality, setAnalyzingQuality] = useState(false);

  const checkQuality = async (currentData) => {
    try {
      setAnalyzingQuality(true);
      const res = await assistantService.analyzeQuality({
        title: currentData.title,
        category: currentData.category,
        brand: currentData.brand,
        color: currentData.color,
        location: currentData.location,
        description: currentData.description,
        distinctive_features: currentData.distinctiveFeatures || currentData.privateVerificationQuestions,
        has_image: Boolean(currentData.imageUrl || imageFile),
        type: 'lost',
      });
      if (res.quality_score !== undefined) {
        setQualityData(res);
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setAnalyzingQuality(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Debounce quality check
      clearTimeout(window._qualityTimeout);
      window._qualityTimeout = setTimeout(() => {
        checkQuality(updated);
      }, 500);
      return updated;
    });
  };


  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setError('');

    try {
      const res = await itemService.uploadImage(file);
      if (res.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.url, imageHash: res.image_hash || '' }));
      }
    } catch (err) {
      setError('Image upload failed. You can still submit report without image or provide URL.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageUrl: '', imageHash: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullLocation = formData.specificLocation
        ? `${formData.location} - ${formData.specificLocation}`
        : formData.location;

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        brand: formData.brand.trim(),
        color: formData.color.trim(),
        location: fullLocation,
        date: formData.date,
        description: formData.description.trim(),
        distinctive_features: formData.distinctiveFeatures.trim(),
        image_url: formData.imageUrl.trim(),
        image_hash: formData.imageHash,
        type: 'lost',
      };

      const res = await itemService.reportLost(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-reports');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit lost item report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Report a Lost Item</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log details to search campus directory and trigger AI smart matching.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Lost report published! Checking for matches across campus...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              required
              name="title"
              placeholder="e.g. MacBook Air M2 or Blue Hydro Flask"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Lost *</label>
              <input
                type="date"
                required
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand / Make</label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Apple, Dell, Nike, Casio"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Color</label>
              <input
                type="text"
                name="color"
                placeholder="e.g. Space Gray, Navy Blue, Red"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campus Location *
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specific Area / Room
              </label>
              <input
                type="text"
                name="specificLocation"
                placeholder="e.g. Table 4 near windows"
                value={formData.specificLocation}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Details
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Provide general description, model, size, or circumstances of loss..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Privacy-Preserving Hidden Verification Feature */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                🔐 Private Verification Details (Hidden from Public View)
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Privacy Shielded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Information only the true owner would know (e.g. wallpaper picture, specific sticker on the back, internal engravings, or hidden compartment items). These remain completely hidden to prevent fraudulent claims.
            </p>
            <input
              type="text"
              name="privateVerificationQuestions"
              placeholder="e.g. Lock screen wallpaper is a mountain photo; small anime sticker inside case"
              value={formData.privateVerificationQuestions}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Visible Distinctive Features (Public)
            </label>
            <input
              type="text"
              name="distinctiveFeatures"
              placeholder="e.g. Scratched bottom corner, red zipper tag"
              value={formData.distinctiveFeatures}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Cloudinary Image Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Photograph (Cloudinary Upload)
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-800"
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-200 truncate max-w-xs">
                      {imageFile?.name || 'Uploaded Photograph'}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {uploadingImage ? 'Uploading to Cloudinary...' : 'Ready & Attached'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-rose-500/50 bg-slate-950/40 cursor-pointer transition">
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-medium text-slate-300">
                  Click to upload image (PNG, JPG, WEBP - max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* AI Report Quality Assistant Live Meter */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">AI Report Quality Assistant</h4>
                  <p className="text-[10px] text-slate-400">Live matching probability score</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    qualityData.quality_score >= 80
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : qualityData.quality_score >= 50
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {qualityData.quality_score}% • {qualityData.rating}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  qualityData.quality_score >= 80
                    ? 'bg-emerald-500'
                    : qualityData.quality_score >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${qualityData.quality_score}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 italic">{qualityData.recommendation}</p>

            {qualityData.suggestions && qualityData.suggestions.length > 0 && (
              <div className="pt-1 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Recommended Additions:
                </span>
                <ul className="space-y-0.5 text-[10px] text-slate-400">
                  {qualityData.suggestions.slice(0, 3).map((tip, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-amber-400">✦</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage || success}
            className="w-full mt-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Report...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Publish Lost Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportLostPage;

