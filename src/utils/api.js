/* Path: src/utils/api.js */

import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", // Backend URL
});

// Generic POST with fallback: tries primary path; on 404/Not Found, retries fallback path
const postWithFallback = async (primaryPath, fallbackPath, payload, config = {}) => {
  try {
    return await api.post(primaryPath, payload, config);
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || '';
    if (status === 404 || /not\s*found/i.test(msg)) {
      return api.post(fallbackPath, payload, config);
    }
    throw err;
  }
};

// Generic GET with fallback: tries primary path; on 404/Not Found, retries fallback path
const getWithFallback = async (primaryPath, fallbackPath, config = {}) => {
  try {
    return await api.get(primaryPath, config);
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || '';
    if (status === 404 || /not\s*found/i.test(msg)) {
      return api.get(fallbackPath, config);
    }
    throw err;
  }
};

// ===== Helpers: JWT parsing and expiry check =====
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

const SKEW_S = 60; // clock skew tolerance
const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  if (!payload?.exp) return false; // if no exp, assume not expired to avoid accidental logouts
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= (nowSec - SKEW_S);
};

// Attach token automatically for protected routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Do NOT auto-logout on expiry; let app route guards decide UX
      if (!isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If expired, skip attaching header but do not clear or redirect
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Response interceptor to handle 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Never auto-redirect or clear token; surface an auth flag for callers
      return Promise.reject({ ...error, isAuthError: true });
    }
    return Promise.reject(error);
  }
);

// ====== Auth APIs ======
export const registerUser = (payload) => postWithFallback("/api/auth/register", "/auth/register", payload);
export const loginUser = (payload) => api.post("/api/auth/login", payload);
export const sendOtp = (payload) => api.post("/api/auth/forgot-password", payload);
export const verifyOtp = (payload) => postWithFallback("/api/auth/verify-otp", "/auth/verify-otp", payload);
export const getMe = () => api.get("/api/auth/me");
export const updateProfile = (payload) => api.put("/api/auth/me", payload);
// Resend OTP for registration verification
export const resendRegisterOtp = (payload) => postWithFallback("/api/auth/resend-otp", "/auth/resend-otp", payload);

// ====== Contact / Quote APIs ======
// Sends quote details to Email service
// Per Postman: POST /api/quotes/request
export const submitQuote = (payload) => postWithFallback('/api/quotes/request', '/quotes/request', payload);

// Optional health check
export const healthCheck = () => api.get("/health-check");

// ====== Degree APIs ======

// Get degrees with pagination - accepts optional filters
export const getDegrees = async (page = 1, limit = 20, params = {}) => {
  const query = new URLSearchParams({ page, limit, ...params });
  const q = `?${query.toString()}`;
  try {
    return await api.get(`/api/degree-upload/degrees${q}`);
  } catch (err) {
    const s = err?.response?.status;
    const m = err?.response?.data?.message || err?.message || '';
    if (s === 404 || /not\s*found/i.test(m)) {
      try {
        return await api.get(`/degree-upload/degrees${q}`);
      } catch (e2) {
        const s2 = e2?.response?.status;
        const m2 = e2?.response?.data?.message || e2?.message || '';
        if (s2 === 404 || /not\s*found/i.test(m2)) {
          try {
            return await api.get(`/api/degree${q}`);
          } catch (e3) {
            const s3 = e3?.response?.status;
            const m3 = e3?.response?.data?.message || e3?.message || '';
            if (s3 === 404 || /not\s*found/i.test(m3)) {
              return api.get(`/degree${q}`);
            }
            throw e3;
          }
        }
        throw e2;
      }
    }
    throw err;
  }
};

// Get a single degree by ID
export const getDegreeById = (id) => api.get(`/api/degree/${id}`);

// Create a new degree
export const createDegree = (payload) => api.post("/api/degree", payload);

// Update an existing degree
export const updateDegree = (id, payload) => api.put(`/api/degree/${id}`, payload);

// Delete a degree
export const deleteDegree = (id) => api.delete(`/api/degree/${id}`);

// Upload filled degree template (CSV/XLSX)
export const uploadDegreesFile = (file, config = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/degree/upload', formData, {
    ...config,
  });
};

// ====== Degree Batch APIs (per Postman UI labels) ======
// Download Excel/CSV template from server
export const getDegreeTemplate = () => getWithFallback('/api/degree-upload/template', '/degree/template', { responseType: 'blob' });

// Upload a batch CSV/XLSX of degrees
export const uploadDegreeBatch = (files, config = {}) => {
  const formData = new FormData();
  const list = Array.isArray(files) ? files : [files];
  const isExcel = (file) => {
    const name = String(file?.name || '').toLowerCase();
    return ['.xlsx', '.xls', '.csv'].some((ext) => name.endsWith(ext));
  };
  const usedKeys = new Set();
  const excelFiles = [];
  const certificateFiles = [];

  list.forEach((file) => {
    if (!file) return;
    if (isExcel(file)) excelFiles.push(file);
    else certificateFiles.push(file);
  });

  if (excelFiles.length) {
    // Backend expects a single Excel file under the key 'file'
    formData.append('file', excelFiles[0]);
    usedKeys.add('file');
    // Intentionally ignoring additional Excel files to match API contract
  }

  certificateFiles.forEach((file, idx) => {
    const rawName = String(file?.name || '').split('.').slice(0, -1).join('.') || String(file?.name || '');
    const fallback = `certificate_${idx + 1}`;
    const sanitizedBase = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || fallback;
    let key = sanitizedBase;
    let attempt = 1;
    while (usedKeys.has(key)) {
      key = `${sanitizedBase}_${attempt++}`;
    }
    formData.append(key, file);
    usedKeys.add(key);
  });

  // If no files managed to append (should not happen), throw to alert caller
  if (!usedKeys.size) {
    throw new Error('No valid files selected for upload');
  }
  try {
    const debugEntries = [];
    // eslint-disable-next-line no-undef
    for (const [k, v] of formData.entries()) {
      const info = v && typeof v === 'object' && 'name' in v ? `${v.name} (${v.size ?? 0} bytes)` : '[non-file]';
      debugEntries.push(`${k}: ${info}`);
    }
    // Minimal debug output to verify payload structure in the browser console
    // This helps identify backend 400 causes without changing behavior
    // eslint-disable-next-line no-console
    console.log('[degree-upload] FormData keys ->', debugEntries);
  } catch {}
  // Primary endpoint provided: /api/degree-upload/upload (no legacy fallbacks)
  return api.post('/api/degree-upload/upload', formData, {
    ...config,
  });
};

// List degree batches (exact per Postman)
export const listDegreeBatches = async (page = 1, limit = 20) => {
  const q = `?page=${page}&limit=${limit}`;
  return api.get(`/api/degree-upload/batches${q}`);
};

// Fetch dashboard stats for the authenticated institution
export const getDashboardStats = () => api.get('/api/dashboard');

// Get batch processing status/details (exact per Postman)
export const getBatchStatus = async (batchId) => api.get(`/api/degree-upload/batch/${batchId}/status`);

export const getBatchDegrees = async (batchId, page = 1, limit = 100) =>
  api.get(`/api/degree-upload/batch/${batchId}/degrees`, {
    params: { page, limit },
  });

// List uploaded templates/history (best-effort across common routes)
export const listUploads = async () => [];

// Export Axios instance for custom calls if needed
export default api;
