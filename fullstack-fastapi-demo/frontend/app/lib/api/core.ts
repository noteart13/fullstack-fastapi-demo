export const apiCore = {
  url: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1'),
  headers(token: string) {
    return {
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  },
};
