/* Path :- did-client-frontend/src/pages/Login.jsx */

// why :-  Login page component.

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../components/Button';
import { useAuthContext } from '../context/AuthContext';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthContext();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        email: (data.email || '').trim().toLowerCase(),
        password: data.password,
      };
      // Mock auth flow (replace with API when backend is ready)
      if (!payload.email || !payload.password) throw new Error('Missing credentials');
      login(payload.email);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Subtle background accents for a premium feel matching app theme */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-24 right-10 w-64 h-64 rounded-full blur-3xl opacity-20 bg-blue-300" />
        <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full blur-3xl opacity-20 bg-indigo-200" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl">
            <span className="text-white text-xl font-bold">X</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Welcome Back</h2>
          <p className="mt-1 text-gray-600 text-sm">Sign in to SecureX-DID Client Dashboard</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white backdrop-blur-md border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
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
                className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                {...register('email', {
                  required: 'Email is required',
                  maxLength: { value: 100, message: 'Email too long' },
                  minLength: { value: 5, message: 'Email too short' },
                  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Invalid email format' },
                })}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">⚠️ {errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="#" className="text-xs text-blue-600 hover:text-blue-500">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-10 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">⚠️ {errors.password.message}</p>
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
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Register
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Company website: <a className="text-blue-600 hover:underline" href="https://securedapp.io/" target="_blank" rel="noreferrer">securedapp.io</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
