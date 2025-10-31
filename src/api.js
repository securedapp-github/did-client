import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // reads your backend URL from .env
});

// Attach token automatically for protected routes
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// API endpoints
export const healthCheck = () => API.get("/health-check");
export const registerUser = (data) => API.post("/auth/register", data);
export const verifyOtp = (data) => API.post("/auth/verify-otp", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/get-me");


// NEW: Resend OTP
export const resendOtp = (data) => API.post("/auth/resend-otp", data);

export default API;
