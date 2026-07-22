"use server";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env.config";
import { getToken, setToken, clearToken } from "@/utils/cookie.util";
import { generateTenantHeaders } from "@/utils/signature.util";
import { ITokens } from "@/types/auth.types";

// ── Token refresh queue (prevents concurrent refresh) ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: unknown = null) => {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(publicClient(prom.config));
    }
  }
  failedQueue = [];
};

// ── Public API client (tenant-verified endpoints) ─────

export const publicClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: add tenant headers + Bearer token
publicClient.interceptors.request.use(async (config) => {
  const resolvedEnv = await env();

  // Set base URL
  config.baseURL = resolvedEnv.APP.API_URL;

  // Add tenant verification headers
  try {
    const method = config.method?.toUpperCase() || "GET";
    const path = config.url || "/";
    const body = config.data ? JSON.stringify(config.data) : undefined;
    const queryString = config.params
      ? "?" + new URLSearchParams(config.params).toString()
      : undefined;

    const tenantHeaders = await generateTenantHeaders(
      method,
      path,
      body,
      queryString,
    );

    // Merge tenant headers into request
    for (const [key, value] of Object.entries(tenantHeaders)) {
      config.headers[key] = value;
    }
  } catch (err) {
    // If bypass is enabled, continue without tenant headers
    console.warn("Tenant header generation failed:", err);
  }

  // Add Bearer token from cookie (if available)
  const token = await getToken();
  if (token?.accessToken) {
    config.headers.Authorization = `Bearer ${token.accessToken}`;
  }

  return config;
});

// Response interceptor: handle 401 → refresh token
publicClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't refresh for login/logout/refresh/validate endpoints
    const url = originalRequest.url || "";
    const skipRefreshPaths = [
      "/public/manual/login",
      "/public/logout",
      "/public/me/refresh-token",
      "/public/validate-token",
    ];
    if (skipRefreshPaths.some((p) => url.includes(p))) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const token = await getToken();
      if (!token?.refreshToken) {
        await clearToken();
        return Promise.reject(error);
      }

      const resolvedEnv = await env();
      const res = await axios.post(
        `${resolvedEnv.APP.API_URL}/public/me/refresh-token`,
        { refreshToken: token.refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            ...(await generateTenantHeaders(
              "POST",
              "/public/me/refresh-token",
              JSON.stringify({ refreshToken: token.refreshToken }),
            )),
          },
        },
      );

      if (res.data?.status && res.data?.data) {
        const newTokens: ITokens = {
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
          fullName: token.fullName,
          email: token.email,
          npk: token.npk,
        };
        await setToken(newTokens);

        // Retry queued requests with new token
        processQueue(null);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }
        return publicClient(originalRequest);
      }

      await clearToken();
      processQueue(error);
      return Promise.reject(error);
    } catch (refreshError) {
      await clearToken();
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── OAuth / public client (no tenant headers) ─────────

export const oauthClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

oauthClient.interceptors.request.use(async (config) => {
  const resolvedEnv = await env();
  config.baseURL = resolvedEnv.APP.API_URL;
  return config;
});
