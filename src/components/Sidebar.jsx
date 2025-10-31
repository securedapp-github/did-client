import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, DocumentIcon, AcademicCapIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';


const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const heading = 'SecureX-DiD';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/templates', label: 'Templates', icon: DocumentIcon },
    { path: '/degrees', label: 'Degrees', icon: AcademicCapIcon },
    { path: '/account', label: 'Account', icon: UserCircleIcon },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" title={heading}>{heading}</h2>
        {onClose && (
          <button onClick={onClose} className="md:hidden">
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center p-3 mb-2 rounded ${
              location.pathname === item.path ? 'bg-[#14B87D]' : 'hover:bg-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
