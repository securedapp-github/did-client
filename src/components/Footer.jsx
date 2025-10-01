import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p>© {new Date().getFullYear()} SecureX-DID Client Dashboard. All rights reserved.</p>
        </div>
        <div className="text-center md:text-right">
          <p>
            Powered by
            <a
              href="https://securedapp.ai/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-semibold text-blue-600 hover:underline"
            >
              SecureDApp
            </a>
          </p>
          {/* Replace with company logo if available */}
          {/* <img src={secureDappLogo} alt="SecureDApp" className="h-6 inline-block ml-2" /> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
