import React from 'react';
import { Bars3Icon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { isAuthenticated, user, logout } = useAuthContext();
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center">
        {onMenuClick && (
          <button onClick={onMenuClick} className="md:hidden mr-4">
            <Bars3Icon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">SecureX-DID Client Dashboard</h1>
      </div>
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6" />
          <span className="hidden sm:inline text-sm text-gray-700">{user?.email}</span>
          <button onClick={logout} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">Sign In</Link>
          <Link to="/register" className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Get Started</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
