import { fetchWithAuth, fetchJSON } from "./interceptor";
import { API_URL } from "./config";

export const apiCore = {
  url: API_URL,
  
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
