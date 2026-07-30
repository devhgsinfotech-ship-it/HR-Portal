import axios from 'axios';

/**
 * Reads the company subdomain from the current hostname.
 * e.g., "techcorp.yourhrms.com" → "techcorp"
 * e.g., "localhost" or "yourhrms.com" → null (main site, no company)
 */
export function getSubdomain(): string | null {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app') {
        const knownRoots = ['localhost', 'yourhrms'];
        if (!knownRoots.includes(parts[0])) {
            return parts[0];
        }
    }
    return null;
}

// Create an Axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────
// Adds JWT token to every outgoing request automatically
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Handles 401 (expired/invalid token) globally
// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Handles 401 (expired/invalid token) globally
// But does NOT redirect if the 401 came from auth endpoints (login/register)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const requestUrl = error.config?.url || '';

            // Skip redirect for auth endpoints — let the component handle those errors
            const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                requestUrl.includes('/auth/register') ||
                requestUrl.includes('/auth/verify-email');

            if (!isAuthEndpoint) {
                // Token expired for a protected route — clear and redirect
                localStorage.removeItem("token");
                localStorage.removeItem("authUser");
                localStorage.removeItem("userRole");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);


export default apiClient;
