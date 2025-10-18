import axios from 'axios';

const apiClient = axios.create({
  // Use VITE_API_URL from environment variables, fallback to a placeholder
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      // window.location.href = '/login';
      console.error("Authentication failed (401). Redirecting to login is disabled for sandbox testing.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

