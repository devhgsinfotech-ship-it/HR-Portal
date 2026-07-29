import axios from 'axios';

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
