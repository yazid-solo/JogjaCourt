import axios from 'axios';

// Konfigurasi endpoint backend FastAPI Anda
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');
export const WS_URL = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds to accommodate Vercel cold starts
});

// Interceptor untuk menyematkan JWT Token secara otomatis jika pengguna sudah login
api.interceptors.request.use(
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

// Interceptor untuk menangani error respons secara global dan retry otomatis
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Jika token kedaluwarsa atau tidak valid (401), otomatis logout
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth_unauthorized'));
      return Promise.reject(error);
    }
    
    // Konfigurasi Retry untuk Vercel Cold Start / Network Errors (Kecuali 400, 401, 403, 404, dll)
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    const maxRetries = 3;
    const shouldRetry = 
      !error.response || // Network error (cors, offline, etc)
      error.response.status >= 500 || // Server error (Vercel timeout / 504 Gateway)
      error.code === 'ECONNABORTED'; // Client timeout
      
    if (shouldRetry && config.retry < maxRetries) {
      config.retry += 1;
      console.warn(`[API] Retrying request to ${config.url} (Attempt ${config.retry}/${maxRetries})...`);
      
      // Delay backoff: 1s, 2s, 3s
      const delay = new Promise(resolve => setTimeout(resolve, config.retry * 1000));
      await delay;
      
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
