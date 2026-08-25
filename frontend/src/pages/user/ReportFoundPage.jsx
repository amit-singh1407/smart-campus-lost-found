import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PackageSearch,
  MapPin,
  Calendar,
  Tag,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
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

const STORAGE_LOCATIONS = [
  'Deposited at Main Campus Security Desk (Building A)',
  'Deposited at Central Library Reception (Level 2)',
  'Deposited at Student Union Help Desk',
  'Keeping in my possession (Safe with Finder)',
];

export const ReportFoundPage = () => {
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
    storageLocation: STORAGE_LOCATIONS[0],
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
        setFormData((prev) => ({ ...prev, imageUrl: res.url }));
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
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
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
        storage_location: formData.storageLocation,
        image_url: formData.imageUrl.trim(),
        type: 'found',
      };

      const res = await itemService.reportFound(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-reports');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit found item report.');
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
          <h2 className="text-2xl font-bold text-slate-100">Report a Found Item</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log an item you discovered on campus so the rightful owner can locate and claim it.
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
            <span>Found report logged successfully! Thank you for helping the campus community.</span>
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
              placeholder="e.g. Set of car keys or Scientific Calculator"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date Found *</label>
              <input
                type="date"
                required
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand / Make</label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Casio, Toyota, Apple"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Color</label>
              <input
                type="text"
                name="color"
                placeholder="e.g. Black, Silver, Blue"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location Where Found *
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
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
                Specific Spot
              </label>
              <input
                type="text"
                name="specificLocation"
                placeholder="e.g. Near main vending machines"
                value={formData.specificLocation}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Safe Storage / Deposit Location *
            </label>
            <select
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            >
              {STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Visible Details
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Describe general appearance and condition..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
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
              <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/40 cursor-pointer transition">
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-medium text-slate-300">
                  Click to upload photograph (PNG, JPG, WEBP - max 5MB)
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

          <button
            type="submit"
            disabled={loading || uploadingImage || success}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Report...</span>
              </>
            ) : (
              <>
                <PackageSearch className="w-4 h-4" />
                <span>Publish Found Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportFoundPage;
