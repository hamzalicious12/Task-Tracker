import { Meeting } from '@/types';
import api from '@/api/api';

export const getMeetings = async (filters?: Record<string, any>): Promise<Meeting[]> => {
  try {
    const response = await api.get<Meeting[]>('/meetings', {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};

export const createMeeting = async (meetingData: Partial<Meeting>): Promise<Meeting> => {
  try {
    console.log('Creating meeting with data:', meetingData);
    const response = await api.post<Meeting>('/meetings', meetingData);
    return response.data;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

export const updateMeeting = async (meetingId: string, updates: Partial<Meeting>): Promise<Meeting> => {
  try {
    const response = await api.patch<Meeting>(`/meetings/${meetingId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating meeting ${meetingId}:`, error);
    throw error;
  }
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  try {
    await api.delete(`/meetings/${meetingId}`);
  } catch (error) {
    console.error(`Error deleting meeting ${meetingId}:`, error);
    throw error;
  }
};
