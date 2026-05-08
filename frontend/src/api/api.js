import axios from "axios";

const FALLBACK_API = "http://localhost:5001/api";
let resolvedBaseURL = import.meta.env.VITE_API_BASE_URL || FALLBACK_API;

// Simplified: Only use fallback if we are on localhost and no env is set
if (typeof window !== "undefined") {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
    
  if (!import.meta.env.VITE_API_BASE_URL && !isLocalhost) {
    console.warn("VITE_API_BASE_URL is missing in production! API calls might fail.");
  }
}

const api = axios.create({
  baseURL: resolvedBaseURL,
  withCredentials: true, // 🔐 default: protected routes
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  /* 🔓 PUBLIC ROUTES (NO AUTH, NO COOKIES) */
  const publicRoutes = [
    "/online-booking",
    "/otp",
    "/room/search",
    "/membership",
    "/contact",
    "/newsletter"
  ];

  const isPublic = publicRoutes.some(route =>
    config.url?.includes(route)
  );

  /* ❌ PUBLIC ROUTE: cookie + token dono hata do */
  if (isPublic) {
    config.withCredentials = false; // 🔥 MOST IMPORTANT
    delete config.headers.Authorization;
    return config;
  }

  /* 🔐 PROTECTED ROUTES */
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE INTERCEPTOR (OPTIONAL) ================= */
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized request:", err.config?.url);
    }
    return Promise.reject(err);
  }
);

export default api;
