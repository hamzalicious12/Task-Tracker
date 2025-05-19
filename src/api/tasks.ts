import axios from 'axios';
import { Task } from '../types';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getTasks = async (filters?: Record<string, any>): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/tasks`, {
    ...getAuthHeader(),
    params: filters
  });
  return response.data;
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  const response = await axios.post(`${API_URL}/tasks`, taskData, getAuthHeader());
  return response.data;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
  const response = await axios.patch(
    `${API_URL}/tasks/${taskId}`,
    updates,
    getAuthHeader()
  );
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeader());
};