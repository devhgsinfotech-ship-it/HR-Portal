import axios from 'axios';
import { APP_CONFIG } from '../../environment';

/**
 * Subdomain system is deprecated — all tenants and features now run directly on the main domain.
 */
export function getSubdomain(): string | null {
    return null;
}

// Create an Axios instance
const apiClient = axios.create({
    baseURL: APP_CONFIG.getBackendUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// List of public auth endpoints where Authorization header is unnecessary
const PUBLIC_AUTH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/company-logo',
    '/auth/verify-email',
    '/auth/verify-invite-token',
    '/auth/accept-invite',
    '/seo-settings'
];

// ── REQUEST INTERCEPTOR ──────────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        const isPublicAuth = PUBLIC_AUTH_ROUTES.some(route => url.includes(route));

        // Only attach JWT token for protected private endpoints
        if (!isPublicAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // When sending FormData, let axios set the correct Content-Type (with boundary)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Handles 401 (expired/invalid token) globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isUnauth = error.response && (
            error.response.status === 401 ||
            (error.response.status === 403 && String(error.response.data?.message || '').toLowerCase().includes('token'))
        );

        if (isUnauth) {
            const requestUrl = error.config?.url || '';

            // NEVER redirect if user is already on any auth/public page (prevents unexpected kicks / infinite reload loops)
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const isPublicPage = 
                currentPath.includes('/login') ||
                currentPath.includes('/register') ||
                currentPath.includes('/forgot-password') ||
                currentPath.includes('/reset-password') ||
                currentPath.includes('/reset-password-success') ||
                currentPath.includes('/invite') ||
                currentPath.includes('/email-verification');

            if (isPublicPage) {
                return Promise.reject(error);
            }

            // Skip redirect for public auth endpoints
            const isAuthEndpoint = PUBLIC_AUTH_ROUTES.some(route => requestUrl.includes(route));

            if (!isAuthEndpoint) {
                // Token expired for a protected route — clear and redirect
                localStorage.removeItem("token");
                localStorage.removeItem("authUser");
                localStorage.removeItem("userRole");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
export default apiClient;
