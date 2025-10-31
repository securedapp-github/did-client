import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, initialized } = useAuthContext();
  const location = useLocation();

  // Wait until auth state is initialized to avoid false redirects on hard refresh
  if (!initialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#14B87D] mr-3" />
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export default RequireAuth;
