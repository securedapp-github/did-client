import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../components/Button';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
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
      ipfsProvider: 'Pinata',
      password: '',
      confirm: '',
      agree: false,
    },
    mode: 'onSubmit',
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // TODO: Integrate with backend when ready
      // For now, simply show success and redirect to Login
      alert('Registration successful. Please sign in.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Background accents */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-24 right-10 w-64 h-64 rounded-full blur-3xl opacity-20 bg-blue-300" />
        <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full blur-3xl opacity-20 bg-indigo-200" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">SecureX-DID Client Dashboard</h2>
          <p className="mt-1 text-gray-600 text-sm">For Colleges and Universities to issue and verify degrees as Verifiable Credentials</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                <input
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.institutionName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., ABC University"
                  {...register('institutionName', { required: 'Institution name is required', minLength: { value: 3, message: 'Too short' } })}
                />
                {errors.institutionName && <p className="text-xs text-red-600 mt-1">{errors.institutionName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('institutionType')}
                >
                  <option>University</option>
                  <option>College</option>
                  <option>Institute</option>
                  <option>Department</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://"
                  {...register('website', { pattern: { value: /^(https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,}.*$/, message: 'Invalid URL' } })}
                />
                {errors.website && <p className="text-xs text-red-600 mt-1">{errors.website.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Full name"
                  {...register('contactName', { required: 'Contact name is required' })}
                />
                {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="admin@university.edu"
                  {...register('contactEmail', { required: 'Email is required', pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Invalid email' } })}
                />
                {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                  {...register('contactPhone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('country')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('state')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('city')} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" {...register('address')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Issuance Volume (per month)</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('expectedVolume')}>
                  <option value="">Select</option>
                  <option>1-100</option>
                  <option>100-1,000</option>
                  <option>1,000-10,000</option>
                  <option>10,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred IPFS Provider</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('ipfsProvider')}>
                  <option>Pinata</option>
                  <option>Web3.Storage</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirm ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    {...register('confirm', {
                      required: 'Confirm your password',
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                  {errors.confirm && <p className="text-xs text-red-600 mt-1">{errors.confirm.message}</p>}
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-3 mt-2">
                <input id="agree" type="checkbox" className="mt-1" {...register('agree', { required: 'You must agree to continue' })} />
                <label htmlFor="agree" className="text-sm text-gray-700">I agree to the terms and privacy policy.</label>
              </div>
              {errors.agree && <p className="text-xs text-red-600 md:col-span-2">{errors.agree.message}</p>}

              <div className="md:col-span-2 mt-2">
                <Button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Get Started'}</Button>
                <p className="text-sm text-gray-600 mt-3">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link></p>
              </div>
            </form>
          </div>

          {/* Benefits Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-3">Why institutions choose us</h3>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>Standards-compliant DIDs and Verifiable Credentials (W3C).</li>
              <li>Bulk issuance workflow with CSV/Excel templates.</li>
              <li>IPFS-backed storage for VC JSON and PDF artifacts.</li>
              <li>Powerful search with filters and audit logs.</li>
              <li>Public verification portal with DID resolution.</li>
              <li>Secure by design — built with SecureDApp expertise.</li>
            </ul>
            <div className="mt-4 text-sm text-gray-600">
              Company website: <a className="text-blue-600 hover:underline" href="https://securedapp.io/" target="_blank" rel="noreferrer">securedapp.io</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
