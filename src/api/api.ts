import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: 'https://task-tracker-backend-qury.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    // Add CORS headers to every request
    config.headers['Access-Control-Allow-Origin'] = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    config.headers['Access-Control-Allow-Credentials'] = 'true';
    console.log('Making request to:', config.url, 'with headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

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
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

export default api;
