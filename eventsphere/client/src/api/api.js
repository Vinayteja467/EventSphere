import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  baseURL: isLocalhost 
    ? 'http://localhost:5000/api' 
    : 'https://eventsphere-backend-auur.onrender.com/api',
  timeout: 15000,
});

// Request interceptor to automatically attach authorization header
API.interceptors.request.use(
  (config) => {
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

// Response interceptor to handle errors uniformly (e.g. JWT expirations)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, trigger logout on client side
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
