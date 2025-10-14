/**
 * Environment configuration for RentGuy Enterprise Platform
 * 
 * This file centralizes all environment variable access.
 * Vite exposes env vars via import.meta.env with VITE_ prefix.
 */

export const config = {
  /**
   * Base URL for REST API calls
   * @default 'http://localhost:8000'
   */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',

  /**
   * Base URL for WebSocket connections
   * @default 'ws://localhost:8000'
   */
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000',

  /**
   * Legacy API URL (for backwards compatibility)
   */
  rentguyApiUrl: import.meta.env.RENTGUY_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',

  /**
   * Environment mode
   */
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  /**
   * Get WebSocket URL for a specific endpoint
   * @param path - WebSocket path (e.g., '/ws/projects')
   * @returns Full WebSocket URL
   */
  getWsUrl: (path: string): string => {
    const baseUrl = config.wsBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },

  /**
   * Get API URL for a specific endpoint
   * @param path - API path (e.g., '/api/projects')
   * @returns Full API URL
   */
  getApiUrl: (path: string): string => {
    const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
};

// Log configuration in development
if (config.isDevelopment) {
  console.log('RentGuy Config:', {
    apiBaseUrl: config.apiBaseUrl,
    wsBaseUrl: config.wsBaseUrl,
    mode: import.meta.env.MODE
  });
}

