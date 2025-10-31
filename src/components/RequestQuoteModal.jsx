import React, { useState } from 'react';

const RequestQuoteModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    service: '',
    email: '',
    message: '',
    agree: false,
    subscribe: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'mobile') {
      const digits = (value || '').replace(/\D+/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Basic validation to satisfy backend required fields
    const required = {
      fullName: form.fullName?.trim(),
      mobile: (form.mobile || '').toString().replace(/\D+/g, ''),
      service: form.service?.trim(),
      email: form.email?.trim(),
      message: form.message?.trim(),
    };

    if (!required.fullName || !required.mobile || !required.service || !required.email || !required.message) {
      setError('Please fill all fields before submitting.');
      return;
    }
    if (required.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!/[^@\s]+@[^@\s]+\.[^@\s]+/.test(required.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if ((required.message || '').length < 25) {
      setError('Project description must be at least 25 characters.');
      return;
    }
    if (!form.agree) {
      setError('You must agree to the Privacy Policy to continue.');
      return;
    }
    if (!form.subscribe) {
      setError('You must opt in to receive cyber-security research reports.');
      return;
    }
    try {
      setSubmitting(true);
      if (onSubmit) await onSubmit({ ...form, ...required });
      setSuccess(true);
      setSuccess(true);
      setForm({ fullName: '', mobile: '', service: '', email: '', message: '', agree: false, subscribe: false });
      // Do not auto-close; wait for user to click Close
    } catch (e) {
      const res = e?.response?.data;
      const fromArray = Array.isArray(res?.errors) && res.errors.length ? (res.errors[0].message || res.errors[0].msg || JSON.stringify(res.errors[0])) : '';
      const serverMsg = res?.message || res?.error || fromArray || e?.message || 'Failed to submit. Please try again.';
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1d19]/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[101] w-full max-w-xl rounded-3xl bg-white/95 border border-[#14B87D]/20 shadow-[0_30px_80px_-24px_rgba(20,184,125,0.45)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#14B87D]/15 bg-white/80 backdrop-blur">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Tell us about your Projects</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-[#14B87D] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 bg-gradient-to-br from-white via-white to-[#ecfdf5] rounded-b-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 border-gray-300"
            />
            <input
              name="mobile"
              type="tel"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 border-gray-300"
            />
            <input
              name="service"
              type="text"
              placeholder="Entity name"
              value={form.service}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 border-gray-300 md:col-span-1"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 border-gray-300"
            />
          </div>

          <textarea
            name="message"
            placeholder="Tell us a bit about your project..."
            rows={3}
            value={form.message}
            onChange={handleChange}
            minLength={25}
            required
            className="mt-4 w-full px-4 py-3 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#14B87D] placeholder-gray-400 border-gray-300"
          />

          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#14B87D] focus:ring-[#14B87D]"
              />
              <span className="text-gray-700">I agree with the Privacy Policy and information being used to contact me</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="subscribe"
                checked={form.subscribe}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#14B87D] focus:ring-[#14B87D]"
              />
              <span className="text-gray-700">Get cyber-security research reports.</span>
            </label>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-5 flex justify-center">
            <button
              type="submit"
              disabled={submitting || !(form.agree && form.subscribe)}
              className={`inline-flex items-center justify-center px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#14B87D] transition-colors ${
                form.agree && form.subscribe
                  ? 'bg-[#14B87D] text-white hover:brightness-95'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
        {success && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b1d19]/50 backdrop-blur">
            <div className="rounded-2xl border border-[#14B87D]/25 bg-white/95 shadow-[0_25px_60px_-20px_rgba(20,184,125,0.45)] px-6 py-5 text-center max-w-sm">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-gray-900 font-medium">Quote request submitted</div>
              <div className="text-sm text-gray-600 mt-1">We will get back to you shortly.</div>
              <button
                type="button"
                onClick={() => { setSuccess(false); onClose?.(); }}
                className="mt-4 inline-flex items-center justify-center px-5 py-2 rounded-md bg-[#14B87D] text-white hover:brightness-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestQuoteModal;
