/* Path: src/pages/Register.jsx */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../components/Button';
import { registerUser, verifyOtp, resendRegisterOtp } from '../utils/api';

const Register = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      institutionName: '',
      institutionType: 'University',
      website: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      country: '',
      state: '',
      city: '',
      address: '',
      expectedVolume: '',
      password: '',
      confirm: '',
    },
    mode: 'onSubmit',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  // Register form submit
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setOtpInfo('');

      const payload = {
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        website: data.website,
        contactPerson: data.contactName,
        contactEmail: (data.contactEmail || '').trim().toLowerCase(),
        contactPhone: data.contactPhone,
        country: data.country,
        state: data.state,
        city: data.city,
        address: data.address,
        expectedIssuanceVolume: data.expectedVolume,
        password: data.password,
        confirmPassword: data.confirm,
      };

      const res = await registerUser(payload);
      console.log('Backend register response:', res.data);

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      setShowOtpModal(true);
      setRegisteredEmail(data.contactEmail);
    } catch (err) {
      console.error('Register error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const res = await verifyOtp({ email: registeredEmail, otp });

      if (res?.data?.success || res?.status === 200 || res?.data?.message === "Institution registered successfully") {
        setOtp('');
        setShowOtpModal(false);
        navigate('/login', { replace: true });
      } else {
        setError(res.data?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err.response?.data || err);
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await resendRegisterOtp({ email: registeredEmail });
      console.log('Resend OTP response:', res.data);
      const ok = res?.data?.success === true || res?.status === 200 ||
                 /sent|resent|success/i.test(res?.data?.message || '');
      if (ok) {
        setOtpInfo('OTP has been resent to your email.');
      } else {
        setError(res?.data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Background accents */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-40 left-20 h-96 w-96 rounded-full bg-[#14B87D]/20 blur-3xl" />
        <div className="absolute bottom-[-180px] right-16 h-[420px] w-[420px] rounded-full bg-[#14B87D]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-10 flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/25 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#14B87D] shadow-sm">
            Institution onboarding
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Create your SecureX-DID issuer workspace</h2>
          <p className="max-w-3xl text-sm md:text-base text-gray-600">
            Register your institution in minutes, verify ownership with OTP, and launch verifiable credential issuance backed by SecureDApp's security stack.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form Card */}
          <div className="lg:col-span-2 rounded-3xl border border-[#14B87D]/15 bg-white/95 p-6 shadow-[0_24px_70px_-35px_rgba(20,184,125,0.55)] backdrop-blur">
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { step: 'Step 1', label: 'Institution profile' },
                { step: 'Step 2', label: 'Contact verification' },
                { step: 'Step 3', label: 'Launch dashboard' },
              ].map(({ step, label }) => (
                <div key={step} className="rounded-2xl border border-[#14B87D]/15 bg-[#ecfdf5]/60 px-4 py-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0b1d19]/70">{step}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{label}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institution Name */}
              <div>
                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                <input
                  id="institutionName"
                  type="text"
                  placeholder="Your Institution"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.institutionName ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('institutionName', { required: 'Institution name is required', minLength: { value: 2, message: 'Too short' } })}
                />
                {errors.institutionName && <p className="mt-1 text-xs text-red-600">{errors.institutionName.message}</p>}
              </div>

              {/* Institution Type */}
              <div>
                <label htmlFor="institutionType" className="block text-sm font-medium text-gray-700 mb-1">Institution Type</label>
                <select
                  id="institutionType"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                  {...register('institutionType', { required: 'Institution type is required' })}
                >
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="Institute">Institute</option>
                  <option value="Department">Department</option>
                </select>
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  id="website"
                  type="url"
                  placeholder="https://example.edu"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('website', { required: 'Website is required' })}
                />
                {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
              </div>

              {/* Contact Person */}
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  id="contactName"
                  type="text"
                  placeholder="Jane Doe"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('contactName', { required: 'Contact person is required' })}
                />
                {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>}
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  id="contactEmail"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('contactEmail', {
                    required: 'Email is required',
                    maxLength: { value: 150, message: 'Email too long' },
                    pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Invalid email format' },
                  })}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>}
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone <span className="text-xs text-gray-500">(exactly 10 digits)</span>
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="9876543210"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('contactPhone', {
                    required: 'Phone is required',
                    validate: (value) => {
                      const digits = (value || '').replace(/\D/g, '');
                      if (digits.length !== 10) {
                        return 'Phone number must be exactly 10 digits';
                      }
                      return true;
                    },
                  })}
                  onInput={(event) => {
                    const digitsOnly = (event.target.value || '').replace(/\D/g, '').slice(0, 10);
                    event.target.value = digitsOnly;
                    setValue('contactPhone', digitsOnly, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  id="country"
                  type="text"
                  placeholder="India"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('country', { required: 'Country is required' })}
                />
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  id="state"
                  type="text"
                  placeholder="Karnataka"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('state', { required: 'State is required' })}
                />
                {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Bengaluru"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('city', { required: 'City is required' })}
                />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
              </div>

              {/* Expected Volume */}
              <div>
                <label htmlFor="expectedVolume" className="block text-sm font-medium text-gray-700 mb-1">Expected Issuance Volume</label>
                <select
                  id="expectedVolume"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D]"
                  {...register('expectedVolume', { required: 'Expected volume is required' })}
                >
                  <option value="1-100">1-100</option>
                  <option value="100-1,000">100-1,000</option>
                  <option value="1,000-10,000">1,000-10,000</option>
                  <option value="10,000+">10,000+</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="123 MG Road"
                  className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 ${errors.confirm ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('confirm', {
                      required: 'Confirm your password',
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                  {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
                </div>
              </div>

              <div className="md:col-span-2 mt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Get Started'}
                </Button>
                <p className="text-sm text-gray-600 mt-3">
                  Already have an account? <Link to="/login" className="text-[#14B87D] hover:underline">Sign in</Link>
                </p>
              </div>
            </form>
          </div>

          {/* Benefits Card */}
          <div className="flex flex-col gap-4 rounded-3xl border border-[#14B87D]/20 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Why institutions choose SecureX-DID</h3>
              <p className="mt-1 text-sm text-gray-600">Purpose-built for registrars, controllers, and academic operations teams.</p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="rounded-2xl border border-[#14B87D]/15 bg-[#ecfdf5]/50 px-4 py-3">
                <span className="font-medium text-gray-900">Interoperable credentials:</span> W3C DID & VC compliant with optional IPFS artifacts.
              </li>
              <li className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">
                <span className="font-medium text-gray-900">Operational efficiency:</span> Guided CSV/Excel uploads with validation and mapping.
              </li>
              <li className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">
                <span className="font-medium text-gray-900">Live monitoring:</span> SecureDApp threat intel and audit logs for every issuance.
              </li>
              <li className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">
                <span className="font-medium text-gray-900">Dedicated support:</span> Book onboarding sessions and quarterly governance reviews.
              </li>
            </ul>
            <div className="rounded-2xl border border-dashed border-[#14B87D]/30 bg-white px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">Need help before registering?</p>
              <p>Write to <a className="text-[#14B87D] hover:underline" href="mailto:hello@securedapp.io">hello@securedapp.io</a> or explore <a className="text-[#14B87D] hover:underline" href="https://securedapp.io/" target="_blank" rel="noreferrer">securedapp.io</a>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-1">Verify OTP</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the valid OTP sent to your email</p>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] text-center tracking-widest text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              {otpInfo && (
                <div className="rounded-xl border border-green-400/30 bg-green-50 text-green-700 text-sm px-3 py-2">
                  {otpInfo}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button type="submit" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Submit'}
                </Button>
                <button
                  type="button"
                  className="text-[#14B87D] hover:underline text-sm"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
