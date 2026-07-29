import axios from 'axios';

/**
 * Reads the company subdomain from the current hostname.
 * e.g., "techcorp.yourhrms.com" → "techcorp"
 * e.g., "localhost" or "yourhrms.com" → null (main site, no company)
 */
export function getSubdomain(): string | null {
    const host = window.location.hostname; // e.g., "techcorp.yourhrms.com"
    const parts = host.split('.');
    // In production: techcorp.yourhrms.com → ["techcorp", "yourhrms", "com"]
    // In local dev:  techcorp.localhost    → ["techcorp", "localhost"]
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app') {
        // Check it's not just "localhost" or "yourhrms.com"
        const knownRoots = ['localhost', 'yourhrms'];
        if (!knownRoots.includes(parts[0])) {
            return parts[0]; // Return "techcorp"
        }
    }
    return null;
}

// Create an Axios instance
const apiClient = axios.create({
    // Fallback to localhost if the env variable isn't set yet
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the JWT token to every request
apiClient.interceptors.request.use(
    (config) => {
        // We'll store the token in localStorage upon login
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally (like expired tokens)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If unauthorized, you might want to clear localStorage and redirect to login
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
