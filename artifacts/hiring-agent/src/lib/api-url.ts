/**
 * Returns the API base URL for all fetch calls.
 *
 * Development (Replit / local): VITE_API_URL is not set → returns ""
 *   → all /api/... paths are relative (same-origin, works via proxy)
 *
 * Production (Vercel frontend + separate API server):
 *   Set VITE_API_URL=https://your-api-server.com in Vercel env vars
 *   → all /api/... paths become absolute cross-origin requests
 */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
}
