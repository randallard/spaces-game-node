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
  // In production, API is served from the same origin
  if (!import.meta.env.DEV) {
    return window.location.origin;
  }

  // In development, use an explicit override if set.
  // Otherwise use '' (relative) so Vite's proxy forwards /api/* to the API
  // server without a cross-origin request from the browser.
  return import.meta.env.VITE_API_URL || '';
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

/**
 * Get the inference API base URL for AI agent opponents
 * Uses VITE_INFERENCE_API_URL from environment, defaults to localhost:8100
 */
export function getInferenceApiUrl(): string {
  return import.meta.env.VITE_INFERENCE_API_URL || 'http://localhost:8100';
}

/**
 * Get the full URL for an inference API endpoint
 * @param path - API path (e.g., '/construct-board')
 */
export function getInferenceApiEndpoint(path: string): string {
  const baseUrl = getInferenceApiUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

