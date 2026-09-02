import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, AlertCircle, ArrowRight, Loader2, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export const LoginPage = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleFillAdminDemo = () => {
    setIsAdminMode(true);
    setEmail('admin@campus.edu');
    setPassword('AdminPassword123!');
    setError('');
  };

  const handleFillStudentDemo = () => {
    setIsAdminMode(false);
    setEmail('test.student@campus.edu');
    setPassword('SecurePassword123!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        // Admin Portal Authentication
        const response = await authService.adminLogin({ email, password });
        if (response.access_token && response.user) {
          if (response.user.role !== 'ADMIN' && response.user.role !== 'SUPER_ADMIN') {
            setError('Access Denied: You do not hold administrative clearance.');
            return;
          }
          login(response.access_token, response.user);
          navigate('/admin');
        } else {
          setError(response.message || 'Invalid administrative credentials');
        }
      } else {
        // Standard User / Student Authentication
        const response = await authService.login({ email, password });
        if (response.access_token && response.user) {
          login(response.access_token, response.user);
          if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
            navigate('/admin');
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(response.message || 'Failed to authenticate');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errorMsg);
      if (err.response?.data?.email_unverified) {
        navigate('/verify-email', { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${isAdminMode ? 'bg-amber-600 shadow-amber-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
              {isAdminMode ? <ShieldCheck className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smart Campus</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">
            {isAdminMode ? 'Staff & Admin Login' : 'Campus User Login'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            {isAdminMode ? 'Authorized administrative & security credentials' : 'Sign in to report, track, and claim lost campus property'}
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsAdminMode(false); setError(''); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${!isAdminMode ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student / User</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsAdminMode(true); setError(''); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${isAdminMode ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Card */}
        <div className={`rounded-3xl border bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl transition-colors ${isAdminMode ? 'border-amber-500/30' : 'border-slate-800'}`}>
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {isAdminMode ? 'Administrator Email' : 'Campus Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder={isAdminMode ? "admin@campus.edu" : "yourname@college.edu"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 text-xs focus:outline-none transition ${isAdminMode ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {!isAdminMode && (
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 text-xs focus:outline-none transition ${isAdminMode ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 rounded-xl font-semibold text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${isAdminMode ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-600/25' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{isAdminMode ? 'Access Admin Console' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Auto-fill Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Demo Login:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFillAdminDemo}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  Fill Admin
                </button>
                <button
                  type="button"
                  onClick={handleFillStudentDemo}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition"
                >
                  Fill Student
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              New to the portal?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register campus account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

