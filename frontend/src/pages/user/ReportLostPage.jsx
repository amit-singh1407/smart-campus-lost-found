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
  Camera,
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
    imageUrl: '',
    imageHash: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
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
      setError('Image upload failed. Please try again.');
      setImageFile(null);
      setImagePreview('');
      setFormData((prev) => ({ ...prev, imageUrl: '', imageHash: '' }));
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

    if (!formData.title.trim()) {
      setError('Item Name is required.');
      return;
    }

    if (!formData.imageUrl) {
      setError('Please upload an item photograph (* required).');
      return;
    }

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
        image_url: formData.imageUrl.trim(),
        image_hash: formData.imageHash,
        type: 'lost',
      };

      const res = await itemService.reportLost(payload);
      const generatedRef = res.item?.reference_id || res.reference_id || 'LOST-REPORT';
      setReferenceId(generatedRef);
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-reports');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit lost item report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Report Lost Item</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log details to search campus directory and trigger notifications across university.
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
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Lost report submitted successfully!</p>
              <p className="text-xs text-emerald-300 mt-0.5">Reference ID: <span className="font-mono font-bold text-white">{referenceId}</span>. Redirecting to My Reports...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              name="title"
              placeholder="e.g. MacBook Air M2 or Blue Hydro Flask"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date Lost <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
                />
              </div>
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color</label>
              <input
                type="text"
                name="color"
                placeholder="e.g. Space Gray, Navy Blue, Red"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location Lost <span className="text-rose-400">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
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
                Specific Location
              </label>
              <input
                type="text"
                name="specificLocation"
                placeholder="e.g. Table 4 near windows"
                value={formData.specificLocation}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Provide item description, model, size, distinctive details, or circumstances of loss..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Upload Image Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload Image <span className="text-rose-400">*</span>
            </label>

            {imagePreview ? (
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Uploaded Image"
                    className="w-20 h-20 object-cover rounded-xl border border-slate-800 shadow-md"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-200 truncate max-w-xs">
                      {imageFile?.name || 'Item Photograph'}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      {uploadingImage ? 'Uploading to Cloudinary...' : '✓ Image attached'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition">
                    Change Image
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-rose-500/50 bg-slate-950/40 cursor-pointer transition">
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-medium text-slate-300">
                  Click to upload item photograph (PNG, JPG, WEBP - max 5MB)
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Photographs enable AI image similarity and owner verification
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
            className="w-full mt-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Lost Report...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Submit Lost Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportLostPage;
