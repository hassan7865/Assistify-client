import axios from 'axios';
export const API_BASE_URL = 'http://localhost:8000';
export const FULL_API_BASE_URL = `${API_BASE_URL}/api/v1`;

const api = axios.create({
  baseURL: FULL_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add bearer token
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt refresh for 401 errors, not on login page, and not for login/refresh requests
    if (error.response?.status === 401 && 
        !window.location.pathname.includes('/login') &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Try to refresh the token
          const response = await api.post('/auth/refresh', {
            refresh_token: refreshToken
          });
          
          if (response.status === 200) {
            const { access_token, refresh_token } = response.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('refreshToken', refresh_token);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Only redirect to login if we're on a protected page
        if (window.location.pathname.startsWith('/chat')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
      
      // If we get here, refresh failed or no refresh token
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Only redirect to login if we're on a protected page
      if (window.location.pathname.startsWith('/chat')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
