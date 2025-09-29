import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Feature = ({ title, desc }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Marketing Header */}
      <Header />

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Issue and Verify Degrees as Verifiable Credentials
            </h1>
            <p className="mt-4 text-gray-600">
              Build trust in education with decentralized identifiers (DIDs) and verifiable credentials (VCs). The X - DID Client Dashboard helps universities issue, manage, and verify degrees securely.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="inline-flex justify-center items-center px-5 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Sign In
              </Link>
              <Link to="/register" className="inline-flex justify-center items-center px-5 py-3 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">
                Get Started
              </Link>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Powered by SecureDApp</h2>
              <p className="text-gray-600">
                SecureDApp is a blockchain security company specializing in smart contract audits and Web3 security solutions. With products like AI-powered Solidity Shield and the SecureWatch monitoring platform, SecureDApp ensures end-to-end protection for decentralized systems.
              </p>
              <a href="https://securedapp.ai/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-block mt-2">Learn more →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature title="Template Management" desc="Download standardized templates and upload CSV/Excel files with built-in validation and mapping." />
            <Feature title="Bulk Issuance" desc="Sign degrees as verifiable credentials (VCs) using DID keys with full status tracking." />
            <Feature title="IPFS Storage" desc="Store degree artifacts like VC JSON or PDFs on IPFS with accessible links." />
            <Feature title="Search & Manage" desc="Filter, search, and paginate through issued degrees with detailed metadata." />
            <Feature title="Verification" desc="Public verification of signatures and DID resolution with clear results." />
            <Feature title="Security & Compliance" desc="Audit logs, encryption, and W3C DID/VC standards for interoperability." />
          </div>
        </div>
      </section>

      {/* Differentiators / About SecureDApp */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Why SecureDApp</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <li className="bg-white p-6 rounded-lg shadow">Product-led tools like Solidity Shield and SecureWatch for real-time multi-chain protection.</li>
            <li className="bg-white p-6 rounded-lg shadow">Comprehensive coverage from pre-deployment audits to ongoing monitoring.</li>
            <li className="bg-white p-6 rounded-lg shadow">Founded in 2023, Bangalore. Recognized by government bodies and industry leaders.</li>
            <li className="bg-white p-6 rounded-lg shadow">Trusted by teams across DeFi, finance, supply chain, and more.</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
