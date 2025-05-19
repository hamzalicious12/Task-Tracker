import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import api from '../api/api';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../api/api';

// Types
interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'CEO' | 'DIRECTOR' | 'EMPLOYEE' | 'ADMIN';
    department?: string;
  };
}

const Login = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const { login } = useAuth();

  // Role-based navigation mapping
  const ROLE_ROUTES = {
    CEO: '/ceo',
    DIRECTOR: '/director',
    EMPLOYEE: '/employee',
    ADMIN: '/admin'
  } as const;

  // Form submission handler 
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Input validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Reset state
    setError('');
    setIsLoading(true);

    try {
      // Attempt login
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // Store authentication data
      login(token, user);
      localStorage.setItem('token', token);

      // Navigate based on user role
      const targetRoute = ROLE_ROUTES[user.role] || '/';
      navigate(targetRoute);

    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      
      // Handle different error scenarios
      if (error.response) {
        setError(error.response.data.message || 'Invalid credentials');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network.');
      } else {
        setError('Unable to connect to the server. Please try again.');
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Task Tracker</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
