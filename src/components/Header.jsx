import React, { useState, useMemo } from 'react';
import { Bars3Icon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import useInstitutionName from '../hooks/useInstitutionName';

const Header = ({ onMenuClick }) => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const institutionName = useInstitutionName();
  const heading = useMemo(() => {
    const trimmed = institutionName?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '';
  }, [institutionName]);
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center">
        {onMenuClick && (
          <button onClick={onMenuClick} className="md:hidden mr-4">
            <Bars3Icon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome to SecureX-DiD {heading}</h1>
      </div>
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6" />
          <span className="text-sm text-gray-700 max-w-[200px] truncate">{user?.email}</span>
          <button onClick={() => setShowConfirm(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">Sign In</Link>
          <Link to="/register" className="px-3 py-1.5 rounded-md bg-[#14B87D] text-white text-sm hover:brightness-95">Get Started</Link>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-1">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#14B87D] text-white text-sm hover:brightness-95"
                onClick={() => { setShowConfirm(false); logout(); }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
