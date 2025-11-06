import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../components/Button';
import { sendOtp, verifyOtp } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    try {
      setLoading(true);
      setError('');
      await sendOtp({ email: email.trim().toLowerCase() });
      setStep('reset');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setError('Please enter a valid 6-digit OTP');
    if (!newPassword || !confirmPassword) return setError('Please enter and confirm your new password');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    try {
      setLoading(true);
      setError('');
      await verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
        confirmPassword,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 px-4 py-12">
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-32 left-16 h-80 w-80 rounded-full bg-[#14B87D]/20 blur-3xl" />
        <div className="absolute bottom-[-160px] right-12 h-96 w-96 rounded-full bg-[#14B87D]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#14B87D] shadow-sm">
            Account recovery
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Reset your SecureX-DID access</h2>
          <p className="max-w-2xl text-sm md:text-base text-gray-600">
            We&apos;ll send a one-time password (OTP) to verify your control of the registered email address before letting you choose a new password.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-[#14B87D]/15 bg-white/95 p-6 shadow-[0_22px_70px_-40px_rgba(20,184,125,0.55)] backdrop-blur">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl border px-4 py-3 text-left ${step === 'email' ? 'border-[#14B87D]/40 bg-[#ecfdf5]/70 shadow-sm' : 'border-[#14B87D]/15 bg-white/70'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0b1d19]/70">Step 1</p>
                <p className="mt-1 text-sm font-medium text-gray-900">Request verification OTP</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-left ${step === 'reset' ? 'border-[#14B87D]/40 bg-[#ecfdf5]/70 shadow-sm' : 'border-[#14B87D]/15 bg-white/70'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0b1d19]/70">Step 2</p>
                <p className="mt-1 text-sm font-medium text-gray-900">Confirm OTP & set password</p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">Forgot Password</h2>
            <p className="text-sm text-gray-600 mb-6">{step === 'email' ? 'Enter your registered email address to receive the verification OTP.' : 'Provide the OTP we emailed you and choose a new password.'}</p>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">
                {error}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Send OTP'}</Button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] shadow-sm tracking-widest text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    className="w-full px-4 py-3 pr-14 rounded-xl bg-white/90 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] shadow-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-[#14B87D] hover:opacity-90 focus:outline-none"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <FiEye className="h-5 w-5" /> : <FiEyeOff className="h-5 w-5" />}
                    <span className="sr-only">{showNewPassword ? 'Hide new password' : 'Show new password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    className="w-full px-4 py-3 pr-14 rounded-xl bg-white/90 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14B87D] shadow-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-[#14B87D] hover:opacity-90 focus:outline-none"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirmPassword ? <FiEye className="h-5 w-5" /> : <FiEyeOff className="h-5 w-5" />}
                    <span className="sr-only">{showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}</span>
                  </button>
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
              </form>
            )}

            <button
              type="button"
              className="mt-6 text-xs text-gray-500 hover:underline"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to login
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-[#14B87D]/20 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need help regaining access?</h3>
              <p className="mt-1 text-sm text-gray-600">Our support team can assist if you no longer control the registered email.</p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="rounded-2xl border border-[#14B87D]/15 bg-[#ecfdf5]/60 px-4 py-3">Contact account security: <a href="mailto:support@securedapp.io" className="text-[#14B87D] hover:underline">support@securedapp.io</a></li>
              <li className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">Review best practices for credential issuers in the <a href="https://securedapp.io/" target="_blank" rel="noreferrer" className="text-[#14B87D] hover:underline">SecureDApp knowledge base</a>.</li>
              <li className="rounded-2xl border border-[#14B87D]/15 bg-white px-4 py-3">Enable multi-admin workflows inside the dashboard to prevent lockouts.</li>
            </ul>
            <div className="rounded-2xl border border-dashed border-[#14B87D]/30 bg-white px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">Security reminder</p>
              <p>Never share OTP codes with anyone. SecureX-DID representatives will never ask for them.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
