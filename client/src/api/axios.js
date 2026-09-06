import axios from 'axios';

// In local dev, '/api' is proxied to localhost:5000 (see vite.config.js).
// In production on Vercel, set VITE_API_URL to your deployed backend's
// base URL, e.g. https://labwala-api.vercel.app/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('labwala-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('labwala-token');
      localStorage.removeItem('labwala-role');
    }
    return Promise.reject(error);
  }
);

export default api;
