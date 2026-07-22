// Central API configuration for Vercel (Frontend) <-> Render (Backend) deployments
const env = (import.meta as any).env || {};
const API_BASE_URL = (env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Returns the full API URL for a given endpoint.
 * In local development (VITE_API_URL not set), returns relative path `/api/...`.
 * In production (VITE_API_URL set to Render backend URL), returns `https://render-backend.onrender.com/api/...`.
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}
