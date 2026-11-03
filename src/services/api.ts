import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://pulseon-backend.fly.dev/api";

const TOKEN_KEY = "pulseon_admin_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = String(error.config?.url || "");
      if (!url.includes("/auth/admin-login") && !url.includes("/auth/login")) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("isAuthenticated");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
