import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Compass, KeyRound, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

export const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Ref to track whether auto-submit is already in-flight
  const autoSubmitting = useRef(false);

  const verifyOtp = async (otpValue, emailValue) => {
    if (autoSubmitting.current) return;
    autoSubmitting.current = true;
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authService.verifyEmail({ email: emailValue.trim(), otp: otpValue.trim() });
      setMessage(res.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { emailVerified: true } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      autoSubmitting.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when OTP reaches 6 digits
  useEffect(() => {
    if (otp.length === 6 && email) {
      verifyOtp(otp, email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleOtpChange = (e) => {
    // Only allow numeric input, max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    // Reset auto-submit ref when user clears/changes OTP
    if (value.length < 6) {
      autoSubmitting.current = false;
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    await verifyOtp(otp, email);
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to receive a new OTP.');
      return;
    }
    setError('');
    setMessage('');
    setResending(true);
    setOtp('');
    autoSubmitting.current = false;

    try {
      const res = await authService.resendOtp({ email: email.trim() });
      setMessage(res.message || 'A fresh OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smart Campus</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">Verify Campus Email</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the 6-digit verification code sent to your registered campus email
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@college.edu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-Digit Verification OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i < otp.length
                        ? 'bg-blue-500 scale-110'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              {otp.length === 6 && loading && (
                <p className="text-center text-xs text-blue-400 mt-2 flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying automatically…
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Confirm &amp; Activate Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>

            <Link to="/login" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
