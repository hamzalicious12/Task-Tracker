import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Types
interface ErrorResponse {
  message: string;
  status?: number;
}

// Environment variables with type checking
const API_URL = import.meta.env.VITE_API_URL || 'https://task-tracker-backend-qury.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
  timeout: 15000, // 15 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Log the request (development only)
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add auth token if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Log successful response (development only)
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError<ErrorResponse>): Promise<never> => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });

      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      // Handle CORS errors
      if (error.response.status === 0 && error.message.includes('CORS')) {
        console.error('CORS Error - Check API configuration');
      }

    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', {
        request: error.request,
        url: error.config?.url
      });
    }

    return Promise.reject(error);
  }
);

// Export types
export type { ErrorResponse };

// Export api instance
export default api;
