import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errorMsg);
      // If email not verified, offer direct link to verification
      if (err.response?.data?.email_unverified) {
        navigate('/verify-email', { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smart Campus</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">Welcome back</h2>
          <p className="text-xs text-slate-400 mt-2">
            Sign in with your verified campus email account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Campus Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="yourname@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              New to the portal?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register campus account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge note */}
        <div className="text-center">
          <Link to="/admin/login" className="text-[11px] text-slate-500 hover:text-slate-400 transition">
            Campus Staff or Security Admin? Access Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
