/**
 * Fetch interceptor với auto refresh token
 * Xử lý 401 → refresh token → retry request
 * Chống spam refresh với mutex/queue
 */

import { apiCore } from "./core";
import { apiAuth } from "./auth";
import { store } from "../store";
import { setTokens, deleteTokens } from "../slices/tokensSlice";
import { logout } from "../slices/authSlice";
import type { RootState } from "../store";

// Mutex để chống spam refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Thực hiện refresh token
 */
async function doRefreshToken(): Promise<string | null> {
  const state: RootState = store.getState();
  const refreshToken = state.tokens.refresh_token;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await apiAuth.getRefreshedToken(refreshToken);
    store.dispatch(setTokens(response));
    return response.access_token;
  } catch (error) {
    // Refresh failed → logout
    store.dispatch(deleteTokens());
    // Gọi logout action (không await để tránh circular)
    const logoutAction = logout();
    store.dispatch(logoutAction as any);
    
    // Reject tất cả requests đang chờ
    failedQueue.forEach(({ reject }) => reject(error));
    failedQueue.length = 0;
    
    return null;
  }
}

/**
 * Refresh token với mutex (chỉ refresh 1 lần nếu nhiều request cùng 401)
 */
async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    // Đang refresh → chờ kết quả
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  const token = await refreshPromise;

  // Resolve tất cả requests đang chờ
  failedQueue.forEach(({ resolve }) => resolve(token));
  failedQueue.length = 0;

  return token;
}

/**
 * Fetch wrapper với auto refresh token
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const state = store.getState();
  const accessToken = state.tokens.access_token;

  // Tạo headers với access token
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  headers.set("Content-Type", "application/json");

  // Thực hiện request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Nếu 401 → refresh token và retry
  if (response.status === 401) {
    const newToken = await refreshToken();

    if (newToken) {
      // Retry request với token mới
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed → throw error để component xử lý redirect
      throw new Error("Authentication failed. Please login again.");
    }
  }

  return response;
}

/**
 * JSON fetch với auto refresh (wrapper cho fetchWithAuth)
 */
export async function fetchJSON<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    // Parse error response
    let errorMessage = `Request failed with ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Ignore JSON parse error
    }

    throw {
      message: errorMessage,
      code: response.status,
      response,
    };
  }

  return response.json();
}

