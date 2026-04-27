import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types";
import { getAccessToken, setAccessToken } from "./storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const res = await api.post<ApiResponse<{ accessToken: string }>>("/api/auth/refresh");
  if (!res.data.success) throw new Error(res.data.message);
  const token = res.data.data.accessToken;
  setAccessToken(token);
  return token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) throw error;

    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers = original.headers ?? {};
        original.headers.authorization = `Bearer ${token}`;
        return api.request(original);
      } catch (e) {
        setAccessToken(null);
        throw e;
      }
    }
    throw error;
  },
);

