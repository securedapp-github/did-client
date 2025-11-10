import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../components/Button';
import RequestQuoteModal from '../components/RequestQuoteModal';
import CalendarModal from '../components/CalendarModal';
import { useAuthContext } from '../context/AuthContext';
import { loginUser, submitQuote } from '../utils/api';

const extractApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;

  if (data) {
    const parts = [];

    if (data.message) parts.push(data.message);
    if (Array.isArray(data.errors) && data.errors.length) {
      const detailed = data.errors
        .map((item) => item?.msg || item?.message || `${item?.param || 'field'} is invalid`)
        .join(' ');
      if (detailed) parts.push(detailed);
    }
    if (data.error && !parts.includes(data.error)) parts.push(data.error);

    if (parts.length) {
      return parts.join(' ');
    }
  }

  return error?.message || fallbackMessage;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const bookingUrl = 'https://calendar.app.google/zs4gZVpkKYU92BEM8';

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthContext();

  // ✅ LOGIN HANDLER
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        email: (data.email || '').trim().toLowerCase(),
        password: data.password,
      };

      const res = await loginUser(payload);
      const body = res?.data || {};

      if (!body.success) {
        throw {
          response: {
            data: body,
          },
        };
      }

      const token = body?.data?.token;
      if (!token) {
        throw new Error('No token returned from server');
      }

      localStorage.setItem('token', token);
      login(payload.email);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(extractApiError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };


  const handleQuoteSubmit = async (data) => {
    try {
      setLoading(true);
      const digitsOnly = (data.mobile || '').toString().replace(/\D+/g, '');
      const payload = {
        fullName: data.fullName?.trim() || '',
        mobileNumber: digitsOnly,
        entityName: data.service?.trim() || '',
        email: (data.email || '').trim().toLowerCase(),
        projectDescription: data.message?.trim() || '',
      };
      await submitQuote(payload);
    } catch (e) {
      console.error('Failed to submit quote', e);
      throw e; // propagate to modal so it can show the error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Background gradient circles */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-32 left-10 md:left-20 h-80 w-80 rounded-full bg-[#14B87D]/25 blur-3xl" />
        <div className="absolute bottom-[-160px] right-16 h-96 w-96 rounded-full bg-[#14B87D]/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Welcome / Highlights */}
          <div className="relative overflow-hidden rounded-3xl border border-[#14B87D]/15 bg-white/80 p-8 shadow-[0_30px_80px_-40px_rgba(20,184,125,0.55)] backdrop-blur">
            <div className="absolute -top-24 -right-12 h-40 w-40 rounded-full bg-[#14B87D]/10 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-[-48px] left-[-48px] h-48 w-48 rounded-full bg-[#14B87D]/10 blur-3xl" aria-hidden="true" />
            <div className="relative space-y-6 text-gray-800">
              <img
                src="/X-DID_20250827_171528_0000.png"
                alt="SecureX-DID Logo"
                className="w-28 h-28 object-contain drop-shadow"
              />
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/20 bg-[#ecfdf5] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#14B87D]">
                  SecureX-DID Platform
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900">
                  Welcome back, issuer
                </h2>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Resume managing verifiable credentials with guided workflows, automated checks, and live compliance insights.
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-2xl border border-[#14B87D]/20 bg-white/70 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Real-time security</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">SecureDApp threat monitoring</dd>
                </div>
                <div className="rounded-2xl border border-[#14B87D]/20 bg-white/70 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Bulk issuance</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">Upload Excel or CSV templates</dd>
                </div>
                <div className="rounded-2xl border border-[#14B87D]/20 bg-white/70 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Audit ready</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">Immutable DID-based logs</dd>
                </div>
                <div className="rounded-2xl border border-[#14B87D]/20 bg-white/70 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Support</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">Book onboarding sessions</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-lg backdrop-blur">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-semibold text-gray-900">Sign in to your dashboard</h3>
              <p className="text-sm text-gray-600">Access templates, issuance logs, and analytics tailored to your institution.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('email', {
                    required: 'Email is required',
                    maxLength: { value: 100, message: 'Email too long' },
                    minLength: { value: 5, message: 'Email too short' },
                    pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Invalid email format' },
                  })}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    ⚠️ {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#14B87D] hover:opacity-90"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-14 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-[#14B87D] hover:opacity-90 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEye className="h-5 w-5" /> : <FiEyeOff className="h-5 w-5" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    ⚠️ {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don’t have an account?{' '}
              <Link to="/register" className="text-[#14B87D] hover:opacity-90 font-medium">
                Register
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-[#14B87D]/40 bg-[#ecfdf5]/60 px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">Need a guided walkthrough?</p>
              <p>Use the quick actions to request a quote or book an onboarding session anytime.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-[#14B87D]/20 bg-white/70 px-6 py-5 text-sm text-gray-600 backdrop-blur flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-gray-900">Why institutions rely on SecureX-DID</div>
          <ul className="flex flex-col gap-2 text-gray-600 md:flex-row md:items-center md:gap-6">
            <li>✅ Proven across multi-campus rollouts</li>
            <li>🛡️ Compliance-ready, DID-first architecture</li>
            <li>⚡ Fast credential lookup with rich filters</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Company website:{' '}
          <a
            className="text-[#14B87D] hover:underline"
            href="https://securedapp.io/"
            target="_blank"
            rel="noreferrer"
          >
            securedapp.io
          </a>
        </div>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setQuoteOpen(true)}
          className="px-4 py-2 rounded-full bg-white text-[#14B87D] border border-[#14B87D] shadow hover:brightness-95"
        >
          Request Quote
        </button>
      </div>

      {/* Floating Google Calendar Button */}
      <button
        type="button"
        onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}
        className="fixed bottom-6 right-6 z-50"
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-105 transition-transform duration-300"
          style={{ backgroundColor: '#14B87D' }}
        >
          <img
            src="/Google_Calendar_icon_(2020).svg.png"
            alt="Google Calendar"
            className="w-8 h-8"
          />
        </div>
      </button>

      <RequestQuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} onSubmit={handleQuoteSubmit} />
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} bookingUrl={bookingUrl} />
    </div>
  );
};

export default Login;
