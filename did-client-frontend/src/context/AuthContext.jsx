import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('x_did_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setUser(parsed);
      } catch {}
    }
  }, []);

  const login = (email) => {
    const profile = { email };
    setUser(profile);
    localStorage.setItem('x_did_auth', JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('x_did_auth');
  };

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
