export const base_path = '/'
export const img_path = '/'

// Centralized Application Configuration
// Change your domains here and it will update everywhere in the app automatically.
export const APP_CONFIG = {
  liveBackendUrl: 'https://api.aaups.com',
  localBackendUrl: 'http://localhost:5000',
  liveFrontendDomain: 'aaups.com',
  localFrontendDomain: 'localhost:3000',
  
  // Gets the correct backend URL based on whether you are running npm run dev or npm run build
  getBackendUrl: () => {
    // If VITE_API_URL is set in docker, use it. Otherwise use the automatic fallback.
    return import.meta.env.VITE_API_URL || (import.meta.env.DEV ? APP_CONFIG.localBackendUrl : APP_CONFIG.liveBackendUrl);
  },
  
  // Gets the correct frontend domain based on whether you are running npm run dev or npm run build
  getFrontendDomain: () => {
    return import.meta.env.DEV ? APP_CONFIG.localFrontendDomain : APP_CONFIG.liveFrontendDomain;
  }
};