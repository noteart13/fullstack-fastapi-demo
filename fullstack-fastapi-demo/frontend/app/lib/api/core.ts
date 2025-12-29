import { fetchWithAuth, fetchJSON } from "./interceptor";

// Ensure API URL always ends with /api/v1
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    // If env URL is set, use it as-is (should already include /api/v1)
    return envUrl;
  }
  // Fallback: construct from window.location.origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return '/api/v1';
};

export const apiCore = {
  url: getApiUrl(),
  
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
