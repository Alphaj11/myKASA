import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("localtrack_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function clearSessionAndRedirect() {
  window.localStorage.removeItem("localtrack_token");
  window.localStorage.removeItem("localtrack_refresh_token");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = window.localStorage.getItem("localtrack_refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
    const newAccessToken: string = res.data.access_token;
    window.localStorage.setItem("localtrack_token", newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  }
}

// Endpoints ou un 401 est un resultat attendu (mauvais identifiants, token
// deja consomme, etc.) : on ne tente pas de refresh dessus.
const NO_RETRY_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isNoRetryEndpoint = NO_RETRY_PATHS.some((path) => config?.url?.includes(path));

    if (error.response?.status !== 401 || !config || config._retried || isNoRetryEndpoint) {
      return Promise.reject(error);
    }

    config._retried = true;
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(config);
  }
);

export function imgUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${API_URL}${path}`;
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}
