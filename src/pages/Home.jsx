import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLayers, FiTrendingUp, FiCloud, FiSearch, FiShield, FiLock } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import androidIcon from '../assets/android-removebg-preview.png';
import iosIcon from '../assets/ios-removebg-preview.png';
import RequestQuoteModal from '../components/RequestQuoteModal';
import { submitQuote } from '../utils/api';

const Feature = ({ title, desc, Icon }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[#14B87D]/15 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
    <div className="absolute -top-16 right-0 h-36 w-36 rounded-full bg-[#14B87D]/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="relative">
      {Icon && (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#14B87D]/10 text-[#0b1d19] text-2xl">
          <Icon />
        </span>
      )}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const Home = () => {
  const [quoteOpen, setQuoteOpen] = useState(false);

  const handleQuoteSubmit = async (data) => {
    const digitsOnly = (data.mobile || '').replace(/\D/g, '');
    const payload = {
      fullName: data.fullName?.trim() || '',
      mobileNumber: digitsOnly,
      entityName: data.service?.trim() || '',
      email: (data.email || '').trim().toLowerCase(),
      projectDescription: data.message?.trim() || '',
    };

    await submitQuote(payload);
  };

  const featureList = [
    {
      title: 'Template Management',
      desc: 'Download standardized templates and upload CSV/Excel files with built-in validation and mapping.',
      Icon: FiLayers,
    },
    {
      title: 'Bulk Issuance',
      desc: 'Sign degrees as verifiable credentials (VCs) using DID keys with full status tracking.',
      Icon: FiTrendingUp,
    },
    {
      title: 'IPFS Storage',
      desc: 'Store degree artifacts like VC JSON or PDFs on IPFS with accessible links.',
      Icon: FiCloud,
    },
    {
      title: 'Search & Manage',
      desc: 'Filter, search, and paginate through issued degrees with detailed metadata.',
      Icon: FiSearch,
    },
    {
      title: 'Security & Compliance',
      desc: 'Audit logs, encryption, and adherence to W3C DID/VC standards for interoperability.',
      Icon: FiShield,
    },
    {
      title: 'Access Controls',
      desc: 'Fine-grained role-based permissions keep sensitive workflows protected and traceable.',
      Icon: FiLock,
    },
  ];

  const stats = [
    { label: 'Credentials issued', value: '2K+' },
    { label: 'Automation accuracy', value: '99.9%' },
    { label: 'Institutions onboarded', value: '45' },
  ];

  const differentiators = [
    'Product-led tools like Solidity Shield and SecureWatch for real-time multi-chain protection.',
    'Comprehensive coverage from pre-deployment audits to ongoing monitoring.',
    'Founded in 2023, Bangalore. Recognized by government bodies and industry leaders.',
    'Trusted by teams across DeFi, finance, supply chain, and more.',
  ];

  const workflow = [
    {
      step: '1. Import & Verify',
      detail: 'Upload degree datasets and validate fields instantly with template-driven rules.',
    },
    {
      step: '2. Issue Credentials',
      detail: 'Sign verifiable credentials with secure DID keys and notify recipients in one click.',
    },
    {
      step: '3. Track & Audit',
      detail: 'Monitor issuance status, share IPFS artifacts, and maintain immutable audit trails.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Marketing Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-[#ecfdf5] via-white to-white" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:py-20">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/20 bg-white px-3 py-1 text-sm font-medium text-[#0b1d19] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#14B87D]" />
                Future-ready credentialing platform
              </span>
              <h1 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-5xl">
                Issue and Verify Degrees as Verifiable Credentials
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-gray-600">
                Build trust in education with decentralized identifiers (DIDs) and verifiable credentials. SecureX-DID empowers universities to issue, manage, and verify degrees in a few guided steps.
              </p>
              <div className="grid gap-3 sm:flex sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center rounded-md bg-[#14B87D] px-6 py-3 font-semibold text-white shadow-sm transition hover:brightness-95">
                  Sign In
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-md border border-[#14B87D] px-6 py-3 font-semibold text-[#14B87D] transition hover:bg-green-50">
                  Get Started
                </Link>
                <button
                  type="button"
                  onClick={() => setQuoteOpen(true)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  Request Quote
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Integrated DID wallet</p>
                  <p>Instant verification and revocation controls.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Enterprise-ready APIs</p>
                  <p>Secure REST hooks for existing ERPs.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="relative overflow-hidden rounded-3xl border border-[#14B87D]/20 bg-white/90 p-8 shadow-[0_32px_80px_-32px_rgba(20,184,125,0.45)] backdrop-blur">
                <div className="absolute -top-24 -left-6 h-40 w-40 rounded-full bg-[#14B87D]/20 blur-3xl" aria-hidden="true" />
                <div className="absolute bottom-[-40px] right-[-40px] h-48 w-48 rounded-full bg-[#14B87D]/10 blur-3xl" aria-hidden="true" />
                <div className="relative space-y-4 text-gray-800">
                  <h2 className="text-xl font-semibold">Powered by SecureDApp</h2>
                  <p>
                    SecureDApp brings enterprise-grade blockchain security to higher education. From pre-deployment audits to live monitoring, we keep every credential tamper-resistant.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#14B87D]" />Predictive threat detection across chains
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#14B87D]" />AI-assisted smart contract reviews
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#14B87D]" />Compliance-ready dashboards and reports
                    </li>
                  </ul>
                  <a href="https://securedapp.io/" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold text-[#14B87D] hover:underline">
                    Learn more →
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-6 rounded-3xl border border-dashed border-[#14B87D]/30 bg-white/70 px-6 py-5 backdrop-blur-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm uppercase tracking-wide text-gray-500">Trusted by institutions</div>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-base font-medium text-gray-700">
              <span>Bangalore Tech University</span>
              <span>National Skills Council</span>
              <span>FinServe Academy</span>
              <span>NorthBridge Institute</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#14B87D]">Key Features</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">A guided, secure path from import to issuance</h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                Every module is designed to shorten credential operations while preserving traceability and compliance.
              </p>
            </div>
            <Link to="/register" className="inline-flex items-center justify-center rounded-md border border-[#14B87D] px-5 py-2 text-sm font-semibold text-[#14B87D] transition hover:bg-green-50">
              Explore the dashboard
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featureList.map(({ title, desc, Icon }) => (
              <Feature key={title} title={title} desc={desc} Icon={Icon} />
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators / About SecureDApp */}
      <section className="bg-gradient-to-br from-white via-[#f7fdfb] to-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#14B87D]">Why SecureDApp</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Enterprise-grade security from day one</h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                We combine blockchain-native security with education workflows so you can deliver verifiable records that inspire trust.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-[#14B87D]/20 bg-white/80 p-5 shadow-sm backdrop-blur">
              {stats.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {differentiators.map((item) => (
              <div key={item} className="rounded-2xl border border-[#14B87D]/15 bg-white p-6 shadow-sm">
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#14B87D]">Guided workflow</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">From spreadsheets to verifiable credentials</h2>
            <p className="mt-3 text-gray-600">
              Follow a proven path to launch digital diplomas without overhauling your existing systems.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {workflow.map(({ step, detail }) => (
              <div key={step} className="flex flex-col gap-3 rounded-2xl border border-[#14B87D]/10 bg-white p-6 shadow-sm">
                <span className="text-sm font-semibold uppercase tracking-wide text-[#14B87D]">{step}</span>
                <p className="text-gray-700">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps CTA with Icons and QR */}
      <section className="border-t bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#14B87D]/20 bg-[#ecfdf5] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#14B87D]">
              Mobile companion
            </span>
            <h3 className="mt-3 text-xl font-semibold text-gray-900 md:text-2xl">Get the SecureX-DID mobile app</h3>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">Carry your issuer dashboard anywhere. Receive instant alerts when credentials are requested, approved, or revoked.</p>

            {/* Links with platform icons */}
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <a
                href={"https://play.google.com/store/apps/details?id=your.android.app"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[#14B87D]/20 bg-white px-5 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                aria-label="Download Android app"
              >
                <img src={androidIcon} alt="Android" className="h-10 w-auto object-contain" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Download on Android</div>
                  <div className="text-xs text-gray-600">Secure access via Google Play</div>
                </div>
              </a>
              <a
                href={"https://apps.apple.com/app/id0000000000"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[#14B87D]/20 bg-white px-5 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                aria-label="Download iOS app"
              >
                <img src={iosIcon} alt="iOS" className="h-10 w-auto object-contain" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Download on iOS</div>
                  <div className="text-xs text-gray-600">Available on the App Store</div>
                </div>
              </a>
            </div>

            {/* QR codes for quick scan */}
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#14B87D]/30 bg-white/80 p-5 shadow-sm">
                <img
                  className="h-36 w-36 rounded-md border border-gray-200"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    'https://play.google.com/store/apps/details?id=your.android.app'
                  )}`}
                  alt="Android app QR code"
                />
                <span className="text-xs text-gray-600">Scan to download for Android</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#14B87D]/30 bg-white/80 p-5 shadow-sm">
                <img
                  className="h-36 w-36 rounded-md border border-gray-200"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    'https://apps.apple.com/app/id0000000000'
                  )}`}
                  alt="iOS app QR code"
                />
                <span className="text-xs text-gray-600">Scan to download for iOS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <RequestQuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        onSubmit={handleQuoteSubmit}
      />
    </div>
  );
};

export default Home;
