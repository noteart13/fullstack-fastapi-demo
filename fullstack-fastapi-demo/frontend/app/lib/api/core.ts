import { fetchWithAuth, fetchJSON } from "./interceptor";

export const apiCore = {
  url: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1'),
  
  /**
   * Headers với token (deprecated - dùng fetchWithAuth thay thế)
   * @deprecated Use fetchWithAuth instead
   */
  headers(token: string) {
    return {
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  },

  /**
   * Fetch với auto refresh token
   */
  fetch: fetchWithAuth,

  /**
   * Fetch JSON với auto refresh token
   */
  fetchJSON: fetchJSON,
};
