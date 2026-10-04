import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Mail,
  Lock,
  User,
  School,
  Phone,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '../../services/authService';

// Password strength rules
const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',              test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least one number (0-9)',           test: (p) => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least one special character (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;

  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  // Once the password satisfies all requirements, the temporary checklist disappears
  if (passed === PASSWORD_RULES.length) return null;

  const strength = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : 'Good';
  const colors = ['bg-rose-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'];
  const textColors = ['text-rose-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'];

  return (
    <div className="mt-2 space-y-2 animate-fade-in">
      {/* Strength bar */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passed ? colors[passed - 1] : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${textColors[passed - 1] || 'text-slate-500'}`}>
        {password ? `Strength: ${strength}` : ''}
      </p>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold border transition-colors ${
                ok ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-600'
              }`}>
                {ok ? '✓' : '○'}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user starts fixing
    if (error) setError('');
  };

  const validatePassword = (pwd) => {
    return PASSWORD_RULES.every((rule) => rule.test(pwd));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (e.g. Campus@2026).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        department: formData.department.trim(),
        phone: formData.phone.trim(),
      };

      const res = await authService.register(payload);
      setSuccess(true);
      // Navigate to verification page with email in state
      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const allRulesPassed = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smart Campus</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">Create Campus Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register to post items, file claims, and receive matching alerts
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Registration successful! Redirecting to email verification...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  name="name"
                  placeholder="Alex Rivera"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                College Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="yourname@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Department / Major <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <School className="w-4 h-4" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department / Major</option>
                    <option value="BBDU">BBDU</option>
                    <option value="BBDNITM">BBDNITM</option>
                    <option value="BBDEC">BBDEC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Password fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-950 text-slate-100 text-xs focus:outline-none transition ${
                      formData.password && !allRulesPassed
                        ? 'border-rose-500/50 focus:border-rose-500'
                        : formData.password && allRulesPassed
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator shown below the password field */}
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-950 text-slate-100 text-xs focus:outline-none transition ${
                      formData.confirmPassword && formData.confirmPassword !== formData.password
                        ? 'border-rose-500/50 focus:border-rose-500'
                        : formData.confirmPassword && formData.confirmPassword === formData.password
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Match indicator */}
                {formData.confirmPassword && (
                  <p className={`mt-1.5 text-[11px] flex items-center gap-1 ${
                    formData.confirmPassword === formData.password ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>{formData.confirmPassword === formData.password ? '✓ Passwords match' : '✗ Passwords do not match'}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign in to your account
              </Link>
            </p>
          </div>

          <Link
            to="/"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <span aria-hidden="true">&lt;-</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
