import axios from 'axios';

// Vite dev server proxies /api and /auth to the backend (see vite.config.js)
// In production, set VITE_API_URL to the deployed backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach token to every request
export const tokenStore = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token;
};

export const setToken = (token, persist = true) => {
  if (persist) {
    localStorage.setItem('token', token);
    sessionStorage.removeItem('token');
  } else {
    sessionStorage.setItem('token', token);
    localStorage.removeItem('token');
  }
};

export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

api.interceptors.request.use((config) => {
  const token = tokenStore();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;