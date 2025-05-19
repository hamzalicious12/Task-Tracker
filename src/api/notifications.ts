import { Notification } from '@/types';
import api from '@/api/api';

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get<Notification[]>('/notifications');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await api.patch<Notification>(
      `/notifications/${notificationId}/read`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch(
    `/notifications/mark-all-read`,
    {}
  );
};
