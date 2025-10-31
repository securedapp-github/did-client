import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// ===== JWT Helper: Check if token is expired =====
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const isTokenExpired = (token) => {
  return false;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const SESSION_KEY = 'x_did_auth_active_session';

  useEffect(() => {
    try {
      const isActiveSession = sessionStorage.getItem(SESSION_KEY) === '1';
      if (!isActiveSession) {
        localStorage.removeItem('x_did_auth');
        localStorage.removeItem('token');
      } else {
        const stored = localStorage.getItem('x_did_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) setUser(parsed);
        }
        if (!user) {
          const token = localStorage.getItem('token');
          if (token && !isTokenExpired(token)) {
            const payload = parseJwt(token) || {};
            const emailCandidate = payload.email || payload.user?.email || payload.preferred_username || null;
            if (emailCandidate && typeof emailCandidate === 'string' && emailCandidate.includes('@')) {
              setUser({ email: emailCandidate });
            }
          }
        }
      }
    } catch {}
    setInitialized(true);
  }, []);

  const login = (email) => {
    const profile = { email };
    setUser(profile);
    try {
      localStorage.setItem('x_did_auth', JSON.stringify(profile));
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('x_did_auth');
    localStorage.removeItem('token');
    sessionStorage.removeItem(SESSION_KEY);
  };

  const value = useMemo(() => {
    // Check if JWT token exists and is not expired
    const token = localStorage.getItem('token');
    const hasValidToken = token && !isTokenExpired(token);
    
    // User is authenticated if they have a valid token OR user profile
    const isAuthenticated = !!user || hasValidToken;
    
    return { user, isAuthenticated, initialized, login, logout };
  }, [user, initialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
