import axios from 'axios';

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
const apiBaseUrl = configuredApiUrl.replace(/\/$/, '').endsWith('/api/v1')
  ? configuredApiUrl.replace(/\/$/, '')
  : `${configuredApiUrl.replace(/\/$/, '')}/api/v1`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and notify or redirect if not on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
