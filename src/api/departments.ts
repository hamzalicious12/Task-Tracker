import { Department } from '@/types';
import api from './api';

export const getDepartments = async () => {
  const response = await api.get<Department[]>('/departments');
  return response.data;
};

export const createDepartment = async (data: { name: string; description?: string; directorId?: string }) => {
  const response = await api.post<Department>('/departments', data);
  return response.data;
};

export const updateDepartment = async (id: string, data: Partial<Department>) => {
  const response = await api.patch<Department>(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: string) => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};
