import { User } from '@/types';
import api from '@/api/api';

export const getUsers = async (filters?: Record<string, any>): Promise<User[]> => {
  const response = await api.get<User[]>('/users', {
    params: filters
  });
  return response.data;
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const response = await api.post<User>('/users', userData);
  return response.data;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const response = await api.patch<User>(`/users/${userId}`, updates);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};