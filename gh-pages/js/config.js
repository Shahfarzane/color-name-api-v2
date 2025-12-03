/**
 * Configuration module for Color Name API Frontend
 * Automatically detects environment and provides correct API URLs
 */

const CONFIG = (() => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Development environment
  if (isLocal) {
    return {
      API_BASE_URL: 'http://localhost:8080/v1/',
      SOCKET_URL: 'http://localhost:8080',
      ENV: 'development',
    };
  }

  // Production environment - Fly.io backend
  return {
    API_BASE_URL: 'https://color-name-api.fly.dev/v1/',
    SOCKET_URL: 'https://color-name-api.fly.dev',
    ENV: 'production',
  };
})();

// Export for ES modules
export default CONFIG;
export const { API_BASE_URL, SOCKET_URL, ENV } = CONFIG;
