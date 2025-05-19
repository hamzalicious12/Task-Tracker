import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://task-tracker-backend-qury.onrender.com', // Updated to match server port 5000
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} with auth token`);
    } else {
      console.warn(`API Request: ${config.method?.toUpperCase()} ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // The server responded with a status code outside of 2xx
      console.error(`API Error ${error.response.status}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('Error response:', error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        console.warn('Authentication error - consider redirecting to login');
        // Could add logic to redirect to login or refresh token
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`API No Response: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
