import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://pulseon-backend.fly.dev/api";

const TOKEN_KEY = "pulseon_admin_token";
const REFRESH_KEY = "pulseon_refresh_token";

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

let refreshing: Promise<string | null> | null = null;

async function renovarAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    if (!data?.token) return null;
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    }
    return data.token as string;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("isAuthenticated");
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = String(original?.url || "");
    const esAuthPublica =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !esAuthPublica
    ) {
      original._retry = true;
      if (!refreshing) {
        refreshing = renovarAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const nuevo = await refreshing;
      if (nuevo) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${nuevo}`;
        return api(original);
      }
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !esAuthPublica
    ) {
      if (!localStorage.getItem(TOKEN_KEY) && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { TOKEN_KEY, REFRESH_KEY };
export default api;
