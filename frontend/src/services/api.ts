import axios from "axios";

import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Refresh token expire setelah 30 menit (ACCESS_TOKEN_LIFETIME). Tanpa ini semua
// request berikutnya langsung 401 dan user terjebak di halaman yang sama.
// Percobaan refresh ditandai supaya 401 yang beruntun tidak memicu refresh
// berulang yang membuat loop.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = localStorage.getItem(REFRESH_TOKEN);

  if (!refresh) {
    return Promise.resolve(null);
  }

  refreshPromise = axios
    .post(`${import.meta.env.VITE_API_URL}/auth/refresh/`, { refresh })
    .then((response) => {
      const access = response.data.access as string;

      localStorage.setItem(ACCESS_TOKEN, access);

      return access;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (typeof error.config & { _retried?: boolean })
      | undefined;

    const isAuthCall =
      original?.url?.includes("/auth/login/") ||
      original?.url?.includes("/auth/refresh/");

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;

      const access = await refreshAccessToken();

      if (access) {
        original.headers.Authorization = `Bearer ${access}`;

        return api(original);
      }

      clearSession();

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;