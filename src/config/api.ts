/**
 * API configuration
 * Centralized configuration for API endpoints
 */

/**
 * Get the API base URL based on environment
 * In development: uses VITE_API_URL from .env.local
 * In production: uses the same origin as the frontend
 */
export function getApiUrl(): string {
  // In development, use the configured API URL (Vercel dev server)
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  // In production, API is served from the same origin
  return window.location.origin;
}

/**
 * Get the full URL for an API endpoint
 * @param path - API path (e.g., '/api/discord/notify')
 */
export function getApiEndpoint(path: string): string {
  const baseUrl = getApiUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
