/**
 * Feature flags and configuration for the game
 *
 * These can be set via environment variables:
 * - VITE_ENABLE_DISCORD_NOTIFICATIONS=false
 * - VITE_ENABLE_URL_SHORTENING=false
 *
 * For GitHub Pages deployment, these should be disabled to run fully client-side
 */

// Helper to get boolean from env var (defaults to true for backwards compatibility)
const getEnvBoolean = (key: string, defaultValue = true): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
};

export const FEATURES = {
  /**
   * Enable Discord notifications
   * When disabled, the game will not attempt to send Discord webhooks
   */
  DISCORD_NOTIFICATIONS: getEnvBoolean('VITE_ENABLE_DISCORD_NOTIFICATIONS', true),

  /**
   * Enable URL shortening service
   * When disabled, will use full compressed URLs instead
   */
  URL_SHORTENING: getEnvBoolean('VITE_ENABLE_URL_SHORTENING', true),

  /**
   * Enable remote CPU opponent (fetches boards from server)
   * When disabled, will only use local CPU opponents
   */
  REMOTE_CPU: getEnvBoolean('VITE_ENABLE_REMOTE_CPU', true),
} as const;

/**
 * Check if running in static/offline mode (all remote services disabled)
 */
export const isStaticMode = (): boolean => {
  return !FEATURES.DISCORD_NOTIFICATIONS && !FEATURES.URL_SHORTENING && !FEATURES.REMOTE_CPU;
};

/**
 * Get user-friendly description of current mode
 */
export const getModeDescription = (): string => {
  if (isStaticMode()) {
    return 'Static Mode - Share links manually (GitHub Pages compatible)';
  }
  return 'Full Mode - Discord notifications and URL shortening enabled';
};
