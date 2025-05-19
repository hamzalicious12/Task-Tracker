import axios from 'axios';
import { AuthResponse } from '@/types';

const API_URL = 'https://task-tracker-backend-qury.onrender.com';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
